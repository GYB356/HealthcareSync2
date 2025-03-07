import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { 
  FiFileText, 
  FiUser, 
  FiCalendar, 
  FiClock, 
  FiX, 
  FiEdit, 
  FiTrash2,
  FiRefreshCw,
  FiDownload,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiTag,
  FiShield,
  FiLock,
  FiEye
} from 'react-icons/fi';
import { formatDate, formatRelativeTime } from '../../utils/dateUtils';
import LoadingSpinner from '../common/LoadingSpinner';

const PrescriptionDetails = ({ 
  prescription: initialPrescription, 
  onClose, 
  onEdit, 
  onDelete, 
  onRefillRequest, 
  canRequestRefill 
}) => {
  const { currentUser } = useAuth();
  const { socket } = useSocket();
  const isDoctor = currentUser.role === 'doctor' || currentUser.role === 'admin';
  const isPatient = currentUser.role === 'patient';
  
  const [prescription, setPrescription] = useState(initialPrescription);
  const [loading, setLoading] = useState(false);
  const [accessLog, setAccessLog] = useState([]);
  const [showAccessLog, setShowAccessLog] = useState(false);
  
  useEffect(() => {
    // Update local state when prop changes
    setPrescription(initialPrescription);
  }, [initialPrescription]);
  
  useEffect(() => {
    if (!socket || !prescription) return;
    
    // Listen for real-time updates to this prescription
    const handlePrescriptionUpdate = (updatedPrescription) => {
      if (updatedPrescription._id === prescription._id) {
        setPrescription(updatedPrescription);
      }
    };
    
    // Listen for refill status changes
    const handleRefillStatusChange = (data) => {
      if (data.prescriptionId === prescription._id) {
        setPrescription(prev => ({
          ...prev,
          status: data.status,
          refillsRemaining: data.refillsRemaining,
          lastUpdated: data.timestamp
        }));
      }
    };
    
    // Listen for access log updates
    const handleAccessLogUpdate = (data) => {
      if (data.resourceId === prescription._id) {
        setAccessLog(prev => [data, ...prev]);
      }
    };
    
    socket.on('prescription:update', handlePrescriptionUpdate);
    socket.on('prescription:refill-status', handleRefillStatusChange);
    socket.on('hipaa:access-log', handleAccessLogUpdate);
    
    // Emit event to log this access
    if (prescription._id) {
      socket.emit('hipaa:log-access', {
        resourceType: 'prescription',
        resourceId: prescription._id,
        action: 'view',
        timestamp: new Date()
      });
      
      // Fetch access logs if user is authorized
      if (isDoctor) {
        fetchAccessLogs();
      }
    }
    
    return () => {
      socket.off('prescription:update', handlePrescriptionUpdate);
      socket.off('prescription:refill-status', handleRefillStatusChange);
      socket.off('hipaa:access-log', handleAccessLogUpdate);
    };
  }, [socket, prescription?._id]);
  
  const fetchAccessLogs = async () => {
    if (!prescription?._id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/hipaa/access-logs?resourceType=prescription&resourceId=${prescription._id}`);
      if (response.ok) {
        const data = await response.json();
        setAccessLog(data);
      }
    } catch (error) {
      console.error('Error fetching access logs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleApproveRefill = async () => {
    if (!prescription?._id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/prescriptions/${prescription._id}/approve-refill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const updatedPrescription = await response.json();
        setPrescription(updatedPrescription);
        
        // The server will emit the socket event to all relevant clients
      }
    } catch (error) {
      console.error('Error approving refill:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDenyRefill = async () => {
    if (!prescription?._id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/prescriptions/${prescription._id}/deny-refill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const updatedPrescription = await response.json();
        setPrescription(updatedPrescription);
        
        // The server will emit the socket event to all relevant clients
      }
    } catch (error) {
      console.error('Error denying refill:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!prescription) return null;
  
  const getStatusBadge = () => {
    if (prescription.status === 'discontinued') {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <FiX className="mr-1" />
          Discontinued
        </span>
      );
    } else if (prescription.status === 'refill-requested') {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <FiRefreshCw className="mr-1" />
          Refill Requested
        </span>
      );
    } else if (prescription.status === 'refill-approved') {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <FiCheckCircle className="mr-1" />
          Refill Approved
        </span>
      );
    } else if (prescription.status === 'refill-denied') {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <FiX className="mr-1" />
          Refill Denied
        </span>
      );
    } else if (new Date(prescription.expiryDate) < new Date()) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          <FiClock className="mr-1" />
          Expired
        </span>
      );
    } else {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <FiCheckCircle className="mr-1" />
          Active
        </span>
      );
    }
  };
  
  const getTypeIcon = () => {
    switch (prescription.type) {
      case 'controlled':
        return <FiLock className="text-red-500" />;
      case 'otc':
        return <FiInfo className="text-blue-500" />;
      case 'equipment':
        return <FiTag className="text-purple-500" />;
      case 'supplement':
        return <FiInfo className="text-green-500" />;
      default:
        return <FiFileText className="text-gray-500" />;
    }
  };
  
  const getTypeText = () => {
    switch (prescription.type) {
      case 'controlled':
        return 'Controlled Substance';
      case 'otc':
        return 'Over-the-Counter';
      case 'equipment':
        return 'Medical Equipment';
      case 'supplement':
        return 'Supplement';
      default:
        return 'Standard Prescription';
    }
  };
  
  const handleDownload = () => {
    // In a real app, this would download a PDF of the prescription
    alert('Downloading prescription...');
    
    // Log the download action
    if (socket) {
      socket.emit('hipaa:log-access', {
        resourceType: 'prescription',
        resourceId: prescription._id,
        action: 'download',
        timestamp: new Date()
      });
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <FiFileText className="mr-2" />
            Prescription Details
            {loading && <LoadingSpinner size="small" className="ml-2" />}
          </h2>
          <div className="flex items-center">
            {isDoctor && (
              <button
                onClick={() => setShowAccessLog(!showAccessLog)}
                className="mr-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                aria-label="View access logs"
                title="View access logs"
              >
                <FiEye className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
              aria-label="Close"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {showAccessLog ? (
          <div className="px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              HIPAA Access Log
            </h3>
            {accessLog.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No access records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Action
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {accessLog.map((log, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {log.userName || log.userId || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {log.ipAddress || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4">
              <button
                onClick={() => setShowAccessLog(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Back to Prescription
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4">
            <div className="flex flex-col md:flex-row justify-between mb-6">
              <div>
                <div className="flex items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {prescription.medication}
                  </h3>
                  <div className="ml-2">
                    {getStatusBadge()}
                  </div>
                </div>
                <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  {getTypeIcon()}
                  <span className="ml-1">{getTypeText()}</span>
                </div>
              </div>
              
              <div className="mt-2 md:mt-0 flex flex-col items-end">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <FiCalendar className="mr-1.5 h-4 w-4" />
                  <span>Prescribed: {formatDate(prescription.prescribedDate)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <FiClock className="mr-1.5 h-4 w-4" />
                  <span>Expires: {formatDate(prescription.expiryDate)}</span>
                </div>
                {prescription.lastUpdated && (
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Updated: {formatRelativeTime(prescription.lastUpdated)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Patient
                </h4>
                <p className="text-base text-gray-900 dark:text-white flex items-center">
                  <FiUser className="mr-1.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  {prescription.patient?.name || 'Unknown'}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Prescribed By
                </h4>
                <p className="text-base text-gray-900 dark:text-white flex items-center">
                  <FiUser className="mr-1.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  Dr. {prescription.prescribedBy?.name || 'Unknown'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Dosage
                </h4>
                <p className="text-base text-gray-900 dark:text-white">
                  {prescription.dosage}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Frequency
                </h4>
                <p className="text-base text-gray-900 dark:text-white">
                  {prescription.frequency}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Duration
                </h4>
                <p className="text-base text-gray-900 dark:text-white">
                  {prescription.duration}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Instructions
              </h4>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {prescription.instructions}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Refills
                </h4>
                {prescription.type === 'controlled' && (
                  <span className="flex items-center text-xs text-amber-600 dark:text-amber-400">
                    <FiShield className="mr-1" />
                    Controlled Substance - Special Restrictions Apply
                  </span>
                )}
              </div>
              <div className="mt-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {prescription.refillsRemaining} of {prescription.refillsAllowed} refills remaining
                  </p>
                  {isPatient && canRequestRefill(prescription) && (
                    <button
                      onClick={() => onRefillRequest(prescription._id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      disabled={loading}
                    >
                      {loading ? (
                        <LoadingSpinner size="small" color="white" className="mr-1" />
                      ) : (
                        <FiRefreshCw className="mr-1" />
                      )}
                      Request Refill
                    </button>
                  )}
                </div>
                
                {prescription.refillsRemaining === 0 && prescription.refillsAllowed > 0 && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    No refills remaining. Please contact your healthcare provider.
                  </p>
                )}
                
                {prescription.status === 'refill-requested' && (
                  <div className="mt-2">
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Refill request is pending approval from your healthcare provider.
                    </p>
                    
                    {isDoctor && (
                      <div className="mt-2 flex space-x-2">
                        <button
                          onClick={handleApproveRefill}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          disabled={loading}
                        >
                          <FiCheckCircle className="mr-1" />
                          Approve Refill
                        </button>
                        <button
                          onClick={handleDenyRefill}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          disabled={loading}
                        >
                          <FiX className="mr-1" />
                          Deny Refill
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {prescription.status === 'refill-denied' && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    Refill request was denied. Please contact your healthcare provider for more information.
                  </p>
                )}
              </div>
            </div>
            
            {prescription.notes && isDoctor && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Provider Notes (Not visible to patient)
                </h4>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border-l-4 border-yellow-400">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {prescription.notes}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap justify-end space-x-2 space-y-2 sm:space-y-0">
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={loading}
              >
                <FiDownload className="mr-2" />
                Download
              </button>
              
              {isDoctor && (
                <>
                  <button
                    onClick={onEdit}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={loading}
                  >
                    <FiEdit className="mr-2" />
                    Edit
                  </button>
                  
                  <button
                    onClick={onDelete}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    disabled={loading}
                  >
                    <FiTrash2 className="mr-2" />
                    Delete
                  </button>
                </>
              )}
            </div>
            
            {/* HIPAA compliance notice */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <div className="ml-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This prescription information is protected under HIPAA (Health Insurance Portability and Accountability Act). 
                    Unauthorized access, use, or disclosure is prohibited and may result in penalties or legal action.
                    All access to this information is logged and monitored.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionDetails;

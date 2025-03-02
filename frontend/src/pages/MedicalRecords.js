import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const MedicalRecords = () => {
  const { user, hasRole } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // Check role-based access
  if (!hasRole(['doctor', 'nurse', 'admin'])) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You do not have permission to access medical records.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (selectedPatientId) {
      fetchRecords(selectedPatientId);
    }
  }, [selectedPatientId]);

  const fetchRecords = async (patientId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/medical-records/${patientId}`);
      setRecords(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load medical records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file, recordData) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      Object.keys(recordData).forEach(key => {
        formData.append(key, recordData[key]);
      });

      const response = await axios.post('/api/medical-records', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setRecords(prev => [...prev, response.data]);
      setShowModal(false);
      setError(null);
    } catch (err) {
      setError('Failed to upload medical record');
      console.error(err);
    }
  };

  const handleUpdateRecord = async (recordId, recordData, file) => {
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      Object.keys(recordData).forEach(key => {
        formData.append(key, recordData[key]);
      });

      const response = await axios.put(`/api/medical-records/${recordId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setRecords(prev => 
        prev.map(record => 
          record.id === recordId ? response.data : record
        )
      );
      setShowModal(false);
      setError(null);
    } catch (err) {
      setError('Failed to update medical record');
      console.error(err);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    try {
      await axios.delete(`/api/medical-records/${recordId}`);
      setRecords(prev => prev.filter(record => record.id !== recordId));
      setShowModal(false);
      setError(null);
    } catch (err) {
      setError('Failed to delete medical record');
      console.error(err);
    }
  };

  const filteredRecords = records.filter(record =>
    record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && selectedPatientId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading medical records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-800 text-white">
            <h2 className="text-xl font-semibold">Medical Records</h2>
            <p className="mt-1 text-sm text-gray-300">
              View and manage patient medical records
            </p>
          </div>

          {/* Search and Filter */}
          <div className="p-6 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Patient ID
                </label>
                <input
                  type="text"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  placeholder="Enter patient ID"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Search Records
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, type, or description"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {selectedPatientId ? (
              <>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => {
                      setSelectedRecord(null);
                      setShowModal(true);
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none"
                  >
                    Add Record
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {filteredRecords.map((record) => (
                    <div
                      key={record.id}
                      className="bg-white border rounded-lg shadow-sm overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {record.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Type: {record.type}
                            </p>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(record.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="mt-4 text-gray-600">{record.description}</p>

                        <div className="mt-4 flex items-center justify-between">
                          {record.fileUrl && (
                            <a
                              href={record.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View Document
                            </a>
                          )}

                          <div className="flex space-x-4">
                            <button
                              onClick={() => {
                                setSelectedRecord(record);
                                setShowModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Enter a patient ID to view their medical records</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Record Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedRecord ? 'Edit Medical Record' : 'Add Medical Record'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const recordData = {
                  patientId: selectedPatientId,
                  title: formData.get('title'),
                  type: formData.get('type'),
                  description: formData.get('description')
                };
                const file = formData.get('file');

                if (selectedRecord) {
                  handleUpdateRecord(selectedRecord.id, recordData, file);
                } else {
                  handleFileUpload(file, recordData);
                }
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={selectedRecord?.title}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  name="type"
                  defaultValue={selectedRecord?.type}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="lab_result">Lab Result</option>
                  <option value="prescription">Prescription</option>
                  <option value="diagnosis">Diagnosis</option>
                  <option value="imaging">Imaging</option>
                  <option value="note">Clinical Note</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={selectedRecord?.description}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows="3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  File
                </label>
                <input
                  type="file"
                  name="file"
                  className="mt-1 block w-full"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                  {selectedRecord ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;
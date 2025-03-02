import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AnalyticsDashboard = () => {
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [appointmentData, setAppointmentData] = useState(null);
  const [telemedicineData, setTelemedicineData] = useState(null);
  const [medicalRecordsData, setMedicalRecordsData] = useState(null);
  const [messagingData, setMessagingData] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');

  // Check role-based access
  if (!hasRole('admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You do not have permission to access analytics.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeframe]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [
        dashboardResponse,
        appointmentsResponse,
        telemedicineResponse,
        medicalRecordsResponse,
        messagingResponse
      ] = await Promise.all([
        axios.get('/api/analytics/dashboard'),
        axios.get('/api/analytics/appointments'),
        axios.get('/api/analytics/telemedicine'),
        axios.get('/api/analytics/medical-records'),
        axios.get('/api/analytics/messaging')
      ]);

      setDashboardData(dashboardResponse.data);
      setAppointmentData(appointmentsResponse.data);
      setTelemedicineData(telemedicineResponse.data);
      setMedicalRecordsData(medicalRecordsResponse.data);
      setMessagingData(messagingResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
          <div className="mt-4 flex justify-between items-center">
            <p className="text-gray-600">
              Comprehensive overview of healthcare metrics and performance indicators
            </p>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="ml-4 bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Patients</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {formatNumber(dashboardData?.patientCount || 0)}
            </p>
            <div className="mt-2 text-green-600 text-sm">
              +5.4% from last month
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Appointments</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {formatNumber(dashboardData?.appointmentCount || 0)}
            </p>
            <div className="mt-2 text-green-600 text-sm">
              +12.3% from last month
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Telemedicine Sessions</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {formatNumber(dashboardData?.telemedicineSessionCount || 0)}
            </p>
            <div className="mt-2 text-green-600 text-sm">
              +8.1% from last month
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Active Devices</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {formatNumber(dashboardData?.activeDevices || 0)}
            </p>
            <div className="mt-2 text-yellow-600 text-sm">
              -2.1% from last month
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appointments by Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Appointments by Status</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(appointmentData?.byStatus || {}).map(([status, count]) => ({
                      name: status,
                      value: count
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  />
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Appointments by Month */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Appointments Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={Object.entries(appointmentData?.byMonth || {}).map(([month, count]) => ({
                    month,
                    count
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Telemedicine Sessions by Doctor */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Telemedicine Sessions by Doctor</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(telemedicineData?.byDoctor || {}).map(([doctorId, count]) => ({
                    doctorId,
                    count
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="doctorId" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Messages by Date */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Messaging Activity</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={Object.entries(messagingData?.byDate || {}).map(([date, count]) => ({
                    date,
                    count
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 
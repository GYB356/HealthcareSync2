import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

const DeviceIntegration = () => {
    const { user, hasRole } = useAuth();
    const { socket, sendDeviceData } = useSocket();
    const [devices, setDevices] = useState([]);
    const [deviceData, setDeviceData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    // Check role-based access
    if (!hasRole(['doctor', 'nurse', 'admin'])) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
                    <p className="mt-2 text-gray-600">You do not have permission to access device management.</p>
                </div>
            </div>
        );
    }

    useEffect(() => {
        fetchDevices();

        if (socket) {
            socket.on('deviceUpdate', handleDeviceUpdate);
            socket.on('deviceDeleted', handleDeviceDelete);
        }

        return () => {
            if (socket) {
                socket.off('deviceUpdate', handleDeviceUpdate);
                socket.off('deviceDeleted', handleDeviceDelete);
            }
        };
    }, [socket]);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/devices');
            setDevices(response.data);
            
            // Fetch initial data for each device
            response.data.forEach(async (device) => {
                const dataResponse = await axios.get(`/api/devices/${device.id}/data`);
                setDeviceData(prev => ({
                    ...prev,
                    [device.id]: dataResponse.data
                }));
            });

            setError(null);
        } catch (err) {
            setError('Failed to load devices');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeviceUpdate = (data) => {
        setDeviceData(prev => ({
            ...prev,
            [data.deviceId]: data
        }));
    };

    const handleDeviceDelete = (deviceId) => {
        setDevices(prev => prev.filter(device => device.id !== deviceId));
        setDeviceData(prev => {
            const newData = { ...prev };
            delete newData[deviceId];
            return newData;
        });
    };

    const handleAddDevice = async (formData) => {
        try {
            const response = await axios.post('/api/devices/register', formData);
            setDevices(prev => [...prev, response.data]);
            setShowAddModal(false);
            setError(null);
        } catch (err) {
            setError('Failed to add device');
            console.error(err);
        }
    };

    const handleDeleteDevice = async (deviceId) => {
        try {
            await axios.delete(`/api/devices/${deviceId}`);
            handleDeviceDelete(deviceId);
            setError(null);
        } catch (err) {
            setError('Failed to delete device');
            console.error(err);
        }
    };

    const getDeviceStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-gray-100 text-gray-800';
            case 'error':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading devices...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="px-6 py-4 bg-gray-800 text-white flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold">Medical Devices</h2>
                            <p className="mt-1 text-sm text-gray-300">
                                Monitor and manage connected medical devices
                            </p>
                        </div>
                        {hasRole('admin') && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Add Device
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {error && (
                            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {devices.map((device) => (
                                <div
                                    key={device.id}
                                    className="bg-white border rounded-lg shadow-sm overflow-hidden"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <svg
                                                    className="h-8 w-8 text-gray-400"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                                                    />
                                                </svg>
                                                <div className="ml-4">
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        {device.type}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">ID: {device.id}</p>
                                                </div>
                                            </div>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDeviceStatusColor(
                                                    device.status
                                                )}`}
                                            >
                                                {device.status}
                                            </span>
                                        </div>

                                        {deviceData[device.id] && (
                                            <div className="mt-4 border-t pt-4">
                                                <h4 className="text-sm font-medium text-gray-900">Latest Readings</h4>
                                                <div className="mt-2 grid grid-cols-2 gap-4">
                                                    {Object.entries(deviceData[device.id].readings || {}).map(([key, value]) => (
                                                        <div key={key} className="text-sm">
                                                            <span className="text-gray-500">{key}:</span>{' '}
                                                            <span className="font-medium">{value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {hasRole('admin') && (
                                            <div className="mt-4 flex justify-end">
                                                <button
                                                    onClick={() => handleDeleteDevice(device.id)}
                                                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                                                >
                                                    Remove Device
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Device Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
import React from 'react';
import { useAuth } from '../context/AuthContext';

const DeviceIntegration = () => {
    const { user } = useAuth();

    // Check user role for access control
    if (!user || !['doctor', 'nurse', 'admin'].includes(user.role)) {
        return <div>Access Denied</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800">Device Integration</h1>
            <p className="mt-4 text-gray-600">Monitor medical device data in real-time.</p>
            {/* WebSocket and real-time communication setup will go here */}
        </div>
    );
};

export default DeviceIntegration; 
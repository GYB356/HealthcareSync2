import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const { user, isAuthenticated } = useAuth();
    
    useEffect(() => {
        if (isAuthenticated && user) {
            // Initialize socket connection
            const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
                auth: {
                    token: localStorage.getItem('token')
                },
                query: {
                    userId: user.id,
                    userRole: user.role
                }
            });

            // Connection event handlers
            newSocket.on('connect', () => {
                console.log('Socket connected');
                setConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
                setConnected(false);
            });

            newSocket.on('error', (error) => {
                console.error('Socket error:', error);
                setConnected(false);
            });

            setSocket(newSocket);

            // Cleanup on unmount
            return () => {
                newSocket.close();
            };
        } else {
            // Close socket if user logs out
            if (socket) {
                socket.close();
                setSocket(null);
                setConnected(false);
            }
        }
    }, [isAuthenticated, user, socket]);

    // Join a telemedicine session
    const joinTelemedicineSession = (sessionId) => {
        if (socket && connected) {
            socket.emit('joinTelemedicineSession', sessionId);
        }
    };

    // Leave a telemedicine session
    const leaveTelemedicineSession = (sessionId) => {
        if (socket && connected) {
            socket.emit('leaveTelemedicineSession', sessionId);
        }
    };

    // Join a chat room
    const joinChatRoom = (roomId) => {
        if (socket && connected) {
            socket.emit('joinChat', roomId);
        }
    };

    // Send a message in a chat room
    const sendMessage = (roomId, message) => {
        if (socket && connected) {
            socket.emit('sendMessage', { roomId, ...message });
        }
    };

    // Send device data
    const sendDeviceData = (data) => {
        if (socket && connected) {
            socket.emit('deviceData', data);
        }
    };

    // Update staff schedule
    const updateSchedule = (scheduleData) => {
        if (socket && connected) {
            socket.emit('scheduleUpdate', scheduleData);
        }
    };

    // Subscribe to real-time updates
    const subscribeToUpdates = (event, callback) => {
        if (socket) {
            socket.on(event, callback);
            return () => socket.off(event, callback);
        }
        return () => {};
    };
    
    const value = {
        socket,
        connected,
        joinTelemedicineSession,
        leaveTelemedicineSession,
        joinChatRoom,
        sendMessage,
        sendDeviceData,
        updateSchedule,
        subscribeToUpdates
    };
    
    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export { SocketContext, SocketProvider };
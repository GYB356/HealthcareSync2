import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

const Messaging = () => {
    const { user } = useAuth();
    const { socket, joinChatRoom, sendMessage } = useSocket();
    const [rooms, setRooms] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchRooms();

        if (socket) {
            socket.on('newMessage', handleNewMessage);
            socket.on('messageDeleted', handleMessageDelete);
        }

        return () => {
            if (socket) {
                socket.off('newMessage', handleNewMessage);
                socket.off('messageDeleted', handleMessageDelete);
            }
        };
    }, [socket]);

    useEffect(() => {
        if (selectedRoom) {
            fetchMessages(selectedRoom.id);
            joinChatRoom(selectedRoom.id);
        }
    }, [selectedRoom]);

    const fetchRooms = async () => {
        try {
            const response = await axios.get('/api/messages/rooms');
            setRooms(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load chat rooms');
        }
    };

    const fetchMessages = async (roomId) => {
        try {
            const response = await axios.get(`/api/messages/${roomId}`);
            setMessages(response.data);
        } catch (err) {
            setError('Failed to load messages');
        }
    };

    const handleNewMessage = (message) => {
        if (message.roomId === selectedRoom?.id) {
            setMessages(prev => [...prev, message]);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleMessageDelete = (messageId) => {
        setMessages(prev => prev.filter(message => message.id !== messageId));
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedRoom) return;

        try {
            const message = {
                roomId: selectedRoom.id,
                senderId: user.id,
                content: newMessage.trim(),
                timestamp: new Date().toISOString()
            };
            sendMessage(selectedRoom.id, message);
            setNewMessage('');
        } catch (err) {
            setError('Failed to send message');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading messages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="flex h-screen">
                {/* Chat Rooms Sidebar */}
                <div className="w-64 bg-white border-r">
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                    </div>
                    <div className="overflow-y-auto h-full">
                        {rooms.map((room) => (
                            <button
                                key={room.id}
                                onClick={() => setSelectedRoom(room)}
                                className={`w-full p-4 text-left hover:bg-gray-50 ${
                                    selectedRoom?.id === room.id ? 'bg-gray-100' : ''
                                }`}
                            >
                                <div className="flex items-center">
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900">{room.name}</p>
                                        <p className="text-sm text-gray-500">{room.lastMessage}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    {selectedRoom ? (
                        <>
                            {/* Chat Header */}
                            <div className="bg-white border-b px-6 py-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {selectedRoom.name}
                                </h3>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {error && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                        {error}
                                    </div>
                                )}

                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${
                                            message.senderId === user.id ? 'justify-end' : 'justify-start'
                                        }`}
                                    >
                                        <div
                                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                message.senderId === user.id
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-900'
                                            }`}
                                        >
                                            <p>{message.content}</p>
                                            <p className="text-xs mt-1 text-gray-500">
                                                {new Date(message.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="bg-white border-t p-4">
                                <form onSubmit={handleSendMessage} className="flex space-x-4">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        Send
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gray-50">
                            <p className="text-gray-500">Select a conversation to start messaging</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messaging; 
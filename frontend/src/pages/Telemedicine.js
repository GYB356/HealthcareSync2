import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

const Telemedicine = () => {
  const { user, hasRole } = useAuth();
  const { socket, joinTelemedicineSession, leaveTelemedicineSession } = useSocket();
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef();

  // Check role-based access
  if (!hasRole(['doctor', 'patient'])) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You do not have permission to access telemedicine services.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const initializeSession = async () => {
      try {
        if (sessionId) {
          const response = await axios.get(`/api/telemedicine/sessions/${sessionId}`);
          setSession(response.data);
          joinTelemedicineSession(sessionId);
        }
      } catch (err) {
        setError('Failed to load telemedicine session');
        console.error(err);
      }
    };

    initializeSession();

    return () => {
      if (sessionId) {
        leaveTelemedicineSession(sessionId);
      }
      cleanup();
    };
  }, [sessionId]);

  useEffect(() => {
    if (!socket || !session) return;

    socket.on('telemedicineSignal', handleSignalingData);

    return () => {
      socket.off('telemedicineSignal', handleSignalingData);
    };
  }, [socket, session]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: !isVideoOff,
        audio: !isMuted
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err) {
      setError('Failed to access camera and microphone');
      console.error(err);
    }
  };

  const initializePeerConnection = async () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: 'turn:your-turn-server.com',
          username: 'username',
          credential: 'credential'
        }
      ]
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Add local stream tracks to peer connection
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('telemedicineSignal', {
          sessionId,
          signal: {
            type: 'candidate',
            candidate: event.candidate
          }
        });
      }
    };

    return pc;
  };

  const handleSignalingData = async (data) => {
    try {
      const { type, sdp, candidate } = data.signal;

      if (!peerConnectionRef.current) {
        await initializePeerConnection();
      }

      const pc = peerConnectionRef.current;

      if (type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription({ type, sdp }));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('telemedicineSignal', {
          sessionId,
          signal: {
            type: 'answer',
            sdp: answer.sdp
          }
        });
      } else if (type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription({ type, sdp }));
      } else if (type === 'candidate') {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      setError('Failed to process signaling data');
      console.error(err);
    }
  };

  const startCall = async () => {
    try {
      await initializeMedia();
      const pc = await initializePeerConnection();

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('telemedicineSignal', {
        sessionId,
        signal: {
          type: 'offer',
          sdp: offer.sdp
        }
      });
    } catch (err) {
      setError('Failed to start call');
      console.error(err);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    setLocalStream(null);
    setRemoteStream(null);
  };

  const endCall = () => {
    cleanup();
    navigate('/dashboard');
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
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
            <h2 className="text-xl font-semibold">
              Telemedicine Session {session?.id}
            </h2>
            <p className="text-sm text-gray-300">
              {session?.scheduledTime && new Date(session.scheduledTime).toLocaleString()}
            </p>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            {/* Local Video */}
            <div className="relative">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg bg-black"
              />
              <div className="absolute bottom-4 left-4">
                <span className="px-2 py-1 bg-gray-900 text-white text-sm rounded">
                  You
                </span>
              </div>
            </div>

            {/* Remote Video */}
            <div className="relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
              />
              <div className="absolute bottom-4 left-4">
                <span className="px-2 py-1 bg-gray-900 text-white text-sm rounded">
                  {session?.participantName || 'Remote User'}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-center space-x-4">
            <button
              onClick={toggleAudio}
              className={`${
                isMuted ? 'bg-red-600' : 'bg-gray-600'
              } text-white p-3 rounded-full hover:opacity-90 focus:outline-none`}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMuted ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                )}
              </svg>
            </button>

            <button
              onClick={toggleVideo}
              className={`${
                isVideoOff ? 'bg-red-600' : 'bg-gray-600'
              } text-white p-3 rounded-full hover:opacity-90 focus:outline-none`}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isVideoOff ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                )}
              </svg>
            </button>

            {!localStream ? (
              <button
                onClick={startCall}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none"
              >
                Start Call
              </button>
            ) : (
              <button
                onClick={endCall}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 focus:outline-none"
              >
                End Call
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Telemedicine; 
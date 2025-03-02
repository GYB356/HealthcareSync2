import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import Calendar from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { startOfWeek, format } from 'date-fns';

const StaffScheduling = () => {
  const { user, hasRole } = useAuth();
  const { socket, updateSchedule } = useSocket();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Check role-based access
  if (!hasRole(['admin', 'staff'])) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You do not have permission to access staff scheduling.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchSchedules();

    if (socket) {
      socket.on('scheduleUpdated', handleScheduleUpdate);
      socket.on('scheduleDeleted', handleScheduleDelete);
    }

    return () => {
      if (socket) {
        socket.off('scheduleUpdated', handleScheduleUpdate);
        socket.off('scheduleDeleted', handleScheduleDelete);
      }
    };
  }, [socket]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/staff-schedules');
      setSchedules(response.data.map(formatSchedule));
      setError(null);
    } catch (err) {
      setError('Failed to load schedules');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatSchedule = (schedule) => ({
    id: schedule.id,
    title: `${schedule.staffName} - ${schedule.shiftType}`,
    start: new Date(schedule.startTime),
    end: new Date(schedule.endTime),
    staffId: schedule.staffId,
    shiftType: schedule.shiftType,
    department: schedule.department,
    notes: schedule.notes
  });

  const handleScheduleUpdate = (updatedSchedule) => {
    setSchedules(prevSchedules => {
      const index = prevSchedules.findIndex(s => s.id === updatedSchedule.id);
      if (index === -1) {
        return [...prevSchedules, formatSchedule(updatedSchedule)];
      }
      const newSchedules = [...prevSchedules];
      newSchedules[index] = formatSchedule(updatedSchedule);
      return newSchedules;
    });
  };

  const handleScheduleDelete = (scheduleId) => {
    setSchedules(prevSchedules => 
      prevSchedules.filter(schedule => schedule.id !== scheduleId)
    );
  };

  const handleSelectSlot = ({ start, end }) => {
    if (!hasRole('admin')) return;

    setSelectedEvent({
      start,
      end,
      staffId: '',
      shiftType: 'regular',
      department: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleSelectEvent = (event) => {
    if (!hasRole('admin')) return;

    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleSaveSchedule = async (formData) => {
    try {
      const scheduleData = {
        ...formData,
        startTime: formData.start.toISOString(),
        endTime: formData.end.toISOString()
      };

      let response;
      if (formData.id) {
        response = await axios.put(`/api/staff-schedules/${formData.id}`, scheduleData);
      } else {
        response = await axios.post('/api/staff-schedules', scheduleData);
      }

      updateSchedule(response.data);
      setShowModal(false);
      setSelectedEvent(null);
    } catch (err) {
      setError('Failed to save schedule');
      console.error(err);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await axios.delete(`/api/staff-schedules/${scheduleId}`);
      setShowModal(false);
      setSelectedEvent(null);
    } catch (err) {
      setError('Failed to delete schedule');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-800 text-white flex justify-between items-center">
            <h2 className="text-xl font-semibold">Staff Scheduling</h2>
            {hasRole('admin') && (
              <button
                onClick={() => handleSelectSlot({ start: new Date(), end: new Date() })}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none"
              >
                Add Schedule
              </button>
            )}
          </div>

          {/* Calendar */}
          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <Calendar
              localizer={{
                startOfWeek: () => startOfWeek(new Date()),
                format: (date, formatStr) => format(date, formatStr),
                formats: {
                  timeGutterFormat: 'HH:mm',
                  eventTimeRangeFormat: ({ start, end }) =>
                    `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
                  dayFormat: 'dd'
                }
              }}
              events={schedules}
              defaultView="week"
              views={['day', 'week', 'month']}
              step={30}
              timeslots={2}
              selectable={hasRole('admin')}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              className="h-[600px]"
            />
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {selectedEvent.id ? 'Edit Schedule' : 'New Schedule'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleSaveSchedule({
                id: selectedEvent.id,
                staffId: formData.get('staffId'),
                shiftType: formData.get('shiftType'),
                department: formData.get('department'),
                notes: formData.get('notes'),
                start: selectedEvent.start,
                end: selectedEvent.end
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Staff Member</label>
                  <input
                    type="text"
                    name="staffId"
                    defaultValue={selectedEvent.staffId}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Shift Type</label>
                  <select
                    name="shiftType"
                    defaultValue={selectedEvent.shiftType}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="regular">Regular</option>
                    <option value="on-call">On Call</option>
                    <option value="overtime">Overtime</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <input
                    type="text"
                    name="department"
                    defaultValue={selectedEvent.department}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    defaultValue={selectedEvent.notes}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    rows="3"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none"
                >
                  Cancel
                </button>
                {selectedEvent.id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSchedule(selectedEvent.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffScheduling; 
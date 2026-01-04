'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [monitors, setMonitors] = useState([]);
  const [selectedMonitor, setSelectedMonitor] = useState(null);
  const [history, setHistory] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [interval, setInterval] = useState('300');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect to login if not authenticated
  // useEffect(() => {
  //   if (!authLoading && !user) {
  //     router.push('/login');
  //   }
  // }, [user, authLoading, router]);

  // Fetch monitors on mount
  useEffect(() => {
    if (user) {
      fetchMonitors();
    }
  }, [user]);

  // Fetch history when monitor is selected
  useEffect(() => {
    if (selectedMonitor) {
      fetchHistory(selectedMonitor.id);
    }
  }, [selectedMonitor]);

  const fetchMonitors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/monitor`);
      setMonitors(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch monitors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (monitorId) => {
    try {
      const response = await axios.get(`${API_URL}/monitor/${monitorId}/history?limit=50`);
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleAddMonitor = async (e) => {
    e.preventDefault();
    if (!newUrl.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/monitor`, {
        url: newUrl,
        interval: parseInt(interval)
      });

      setMonitors([response.data, ...monitors]);
      setNewUrl('');
      setInterval('300');
      setSuccess('Monitor added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMonitor = async (id) => {
    if (!confirm('Delete this monitor?')) return;

    try {
      await axios.delete(`${API_URL}/monitor/${id}`);
      setMonitors(monitors.filter(m => m.id !== id));
      if (selectedMonitor?.id === id) {
        setSelectedMonitor(null);
        setHistory([]);
      }
      setSuccess('Monitor deleted');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to delete monitor');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getStatusColor = (status) => {
    return status === 'UP' ? 'text-green-600' : 'text-red-600';
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Logout */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Smart Web Monitor</h1>
            <p className="text-gray-600">Monitor website availability and response times</p>
            <p className="text-sm text-gray-500 mt-2">Logged in as: <span className="font-semibold">{user.email}</span></p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold transition"
          >
            Logout
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Add Monitor Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Add Website to Monitor</h2>
          <form onSubmit={handleAddMonitor} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="url"
                placeholder="https://example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="60">Every 1 min</option>
                <option value="300">Every 5 min</option>
                <option value="600">Every 10 min</option>
                <option value="1800">Every 30 min</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold transition"
            >
              {loading ? 'Adding...' : 'Add Monitor'}
            </button>
          </form>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monitors List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Monitors</h2>
              {monitors.length === 0 ? (
                <p className="text-gray-500">No monitors yet. Add one above!</p>
              ) : (
                <div className="space-y-2">
                  {monitors.map((monitor) => {
                    const latestLog = history.find(h => h.monitor_id === monitor.id);
                    const status = latestLog?.status || 'PENDING';
                    return (
                      <div
                        key={monitor.id}
                        onClick={() => setSelectedMonitor(monitor)}
                        className={`p-3 rounded-lg cursor-pointer transition ${
                          selectedMonitor?.id === monitor.id
                            ? 'bg-indigo-100 border-2 border-indigo-500'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-800 truncate">
                              {new URL(monitor.url).hostname}
                            </p>
                            <p className={`text-xs font-bold ${getStatusColor(status)}`}>
                              {status}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMonitor(monitor.id);
                            }}
                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Details & History */}
          <div className="lg:col-span-2">
            {selectedMonitor ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  {selectedMonitor.url}
                </h2>

                {/* Latest Status */}
                {history.length > 0 && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm">Latest Status</p>
                        <p className={`text-2xl font-bold ${getStatusColor(history[0].status)}`}>
                          {history[0].status}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Response Time</p>
                        <p className="text-2xl font-bold text-gray-800">
                          {history[0].response_time}ms
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Last Checked</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {new Date(history[0].checked_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {/* Uptime Stats */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-gray-600 text-sm mb-2">Uptime (Last checks)</p>
                      {(() => {
                        const upCount = history.filter(h => h.status === 'UP').length;
                        const percentage = history.length > 0
                          ? ((upCount / history.length) * 100).toFixed(2)
                          : 0;
                        return (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="font-bold text-gray-800">{percentage}%</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* History Table */}
                <div>
                  <h3 className="text-lg font-bold mb-3 text-gray-800">History</h3>
                  {history.length === 0 ? (
                    <p className="text-gray-500">No history yet. Waiting for first check...</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-2 font-semibold text-gray-700">Time</th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-700">Status</th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-700">Response</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((log) => (
                            <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2 px-2 text-gray-600">
                                {new Date(log.checked_at).toLocaleTimeString()}
                              </td>
                              <td className={`py-2 px-2 font-semibold ${getStatusColor(log.status)}`}>
                                {log.status}
                              </td>
                              <td className="py-2 px-2 text-gray-600">
                                {log.response_time}ms
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <p className="text-gray-500 text-lg">Select a monitor to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
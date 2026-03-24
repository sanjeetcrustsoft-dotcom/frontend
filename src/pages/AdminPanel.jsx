import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const statusColors = {
  pending: 'bg-amber-500/15 text-amber-400',
  'in-progress': 'bg-blue-500/15 text-blue-400',
  completed: 'bg-emerald-500/15 text-emerald-400',
};

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      const { data } = await adminAPI.getStats();
      setStats(data.stats);
    } catch {
      setError('Failed to load stats');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getAllUsers();
      setUsers(data.users);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getAllTasks();
      setTasks(data.tasks);
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'tasks') fetchTasks();
  }, [activeTab]);

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}" and all their tasks?`)) return;
    try {
      await adminAPI.deleteUser(id);
      setUsers(users.filter((u) => u._id !== id));
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await adminAPI.deleteTask(id);
      setTasks(tasks.filter((t) => t._id !== id));
      fetchStats();
    } catch {
      setError('Failed to delete task');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span className="font-bold text-lg">TaskFlow</span>
            <span className="px-2 py-0.5 text-xs bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-md">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
              My Tasks
            </Link>
            <button onClick={logout} className="px-3 py-1.5 text-sm text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-500/50 rounded-lg transition-all">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage all users and tasks across the platform</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Users', value: stats.totalUsers, color: 'text-violet-400', icon: '👥' },
              { label: 'Total Tasks', value: stats.totalTasks, color: 'text-white', icon: '📋' },
              { label: 'Pending', value: stats.pendingTasks, color: 'text-amber-400', icon: '⏳' },
              { label: 'In Progress', value: stats.inProgressTasks, color: 'text-blue-400', icon: '🔄' },
              { label: 'Completed', value: stats.completedTasks, color: 'text-emerald-400', icon: '✅' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          {['overview', 'users', 'tasks'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? 'text-violet-400 border-violet-500'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {tab === 'overview' ? '📊 Overview' : tab === 'users' ? '👥 Users' : '📋 All Tasks'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button onClick={() => setActiveTab('users')} className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-all flex items-center justify-between">
                  <span>👥 View All Users</span>
                  <span className="text-violet-400">{stats?.totalUsers}</span>
                </button>
                <button onClick={() => setActiveTab('tasks')} className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-all flex items-center justify-between">
                  <span>📋 View All Tasks</span>
                  <span className="text-violet-400">{stats?.totalTasks}</span>
                </button>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Task Distribution</h3>
              {stats && (
                <div className="space-y-2.5">
                  {[
                    { label: 'Pending', value: stats.pendingTasks, total: stats.totalTasks, color: 'bg-amber-400' },
                    { label: 'In Progress', value: stats.inProgressTasks, total: stats.totalTasks, color: 'bg-blue-400' },
                    { label: 'Completed', value: stats.completedTasks, total: stats.totalTasks, color: 'bg-emerald-400' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{item.label}</span>
                        <span>{item.value}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${item.color}`}
                          style={{ width: item.total > 0 ? `${(item.value / item.total) * 100}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase">Joined</th>
                        <th className="text-right px-5 py-3.5 text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {users.map((u) => (
                        <tr key={u._id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center text-xs font-bold text-violet-400 uppercase">
                                {u.name?.charAt(0)}
                              </div>
                              <span className="text-sm text-white font-medium">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-400">{u.email}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-1 text-xs rounded-lg ${u.role === 'admin' ? 'bg-violet-500/15 text-violet-400' : 'bg-gray-700 text-gray-400'}`}>
                              {u.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleDeleteUser(u._id, u.name)}
                              className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-all"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="text-center py-12 text-gray-500">No users found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div>
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase">Owner</th>
                        <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        <th className="text-right px-5 py-3.5 text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {tasks.map((task) => (
                        <tr key={task._id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-sm text-white font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-gray-500 truncate max-w-xs">{task.description}</p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-sm text-gray-300">{task.user?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{task.user?.email}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-1 text-xs rounded-lg capitalize ${statusColors[task.status]}`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-500">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleDeleteTask(task._id)}
                              className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-all"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {tasks.length === 0 && (
                    <div className="text-center py-12 text-gray-500">No tasks found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;

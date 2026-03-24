import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { taskAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const statusColors = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'in-progress': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};
const statusDot = {
  pending: 'bg-amber-400',
  'in-progress': 'bg-blue-400',
  completed: 'bg-emerald-400',
};

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', status: 'pending', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const { data } = await taskAPI.getAll(params);
      setTasks(data.tasks);
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [filterStatus]);

  const openCreate = () => {
    setEditTask(null);
    setForm({ title: '', description: '', status: 'pending', dueDate: '' });
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editTask) {
        await taskAPI.update(editTask._id, form);
      } else {
        await taskAPI.create(form);
      }
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(id);
      setTasks(tasks.filter((t) => t._id !== id));
    } catch {
      setError('Failed to delete task');
    }
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
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
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin" className="px-3 py-1.5 text-sm bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-lg hover:bg-violet-600/30 transition-all">
                🛡️ Admin Panel
              </Link>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
              <div className="w-7 h-7 bg-violet-500/20 rounded-full flex items-center justify-center text-xs font-bold text-violet-400 uppercase">
                {user?.name?.charAt(0)}
              </div>
              <span className="text-sm text-gray-300 hidden sm:block">{user?.name}</span>
            </div>
            <button onClick={logout} className="px-3 py-1.5 text-sm text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-500/50 rounded-lg transition-all">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">My Tasks</h1>
            <p className="text-gray-400 text-sm mt-0.5">Welcome back, {user?.name} 👋</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-white', bg: 'bg-gray-800/60' },
            { label: 'Pending', value: stats.pending, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Completed', value: stats.completed, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border border-gray-800 rounded-xl p-4`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['', 'pending', 'in-progress', 'completed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 text-sm rounded-lg border transition-all capitalize ${
                filterStatus === s
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {s || 'All Tasks'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Task List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-400 text-lg">No tasks yet. Create your first task!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-white truncate">{task.title}</h3>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full border capitalize ${statusColors[task.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot[task.status]}`}></span>
                        {task.status}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
                    )}
                    {task.dueDate && (
                      <p className="text-xs text-gray-600 mt-2">
                        📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => openEdit(task)}
                      className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-5">
              {editTask ? '✏️ Edit Task' : '➕ Create Task'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-all"
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-all resize-none"
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-all"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-700 text-gray-400 rounded-xl hover:border-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : null}
                  {editTask ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

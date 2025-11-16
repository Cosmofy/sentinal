'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, CheckCircle2, Settings, ExternalLink, LogOut, GripVertical, Eye, EyeOff } from 'lucide-react';

interface Endpoint {
  id: number;
  title: string;
  url: string;
  intervalSeconds: number;
  expectedStatusCode: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    intervalSeconds: 60,
    expectedStatusCode: 200,
  });

  useEffect(() => {
    fetchEndpoints();
    initializeMonitoring();
  }, []);

  const initializeMonitoring = async () => {
    try {
      await fetch('/api/monitor/init', { method: 'POST' });
    } catch (error) {
      console.error('Error initializing monitoring:', error);
    }
  };

  const fetchEndpoints = async () => {
    try {
      const res = await fetch('/api/endpoints');
      const data = await res.json();
      // Ensure data is an array before setting it
      if (Array.isArray(data)) {
        setEndpoints(data);
      } else {
        console.error('Invalid response format:', data);
        setEndpoints([]);
      }
    } catch (error) {
      console.error('Error fetching endpoints:', error);
      setEndpoints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await fetch(`/api/endpoints/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch('/api/endpoints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      setFormData({ title: '', url: '', intervalSeconds: 60, expectedStatusCode: 200 });
      setShowAddForm(false);
      setEditingId(null);
      fetchEndpoints();
    } catch (error) {
      console.error('Error saving endpoint:', error);
    }
  };

  const handleEdit = (endpoint: Endpoint) => {
    setFormData({
      title: endpoint.title,
      url: endpoint.url,
      intervalSeconds: endpoint.intervalSeconds,
      expectedStatusCode: endpoint.expectedStatusCode,
    });
    setEditingId(endpoint.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this endpoint?')) return;

    try {
      await fetch(`/api/endpoints/${id}`, { method: 'DELETE' });
      fetchEndpoints();
    } catch (error) {
      console.error('Error deleting endpoint:', error);
    }
  };

  const handleToggleActive = async (endpoint: Endpoint) => {
    // Optimistic update - update UI immediately
    setEndpoints(endpoints.map(ep =>
      ep.id === endpoint.id
        ? { ...ep, isActive: !ep.isActive }
        : ep
    ));

    try {
      await fetch(`/api/endpoints/${endpoint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !endpoint.isActive }),
      });
    } catch (error) {
      console.error('Error toggling endpoint:', error);
      // Revert on error
      fetchEndpoints();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    window.location.href = '/admin';
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newEndpoints = [...endpoints];
    const draggedItem = newEndpoints[draggedIndex];
    newEndpoints.splice(draggedIndex, 1);
    newEndpoints.splice(index, 0, draggedItem);

    setEndpoints(newEndpoints);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);

    // Save the new order to the database
    try {
      await Promise.all(
        endpoints.map((endpoint, index) =>
          fetch(`/api/endpoints/${endpoint.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sortOrder: index }),
          })
        )
      );
    } catch (error) {
      console.error('Error saving sort order:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Admin Portal</h1>
          <nav className="flex items-center gap-0.5">
            <a
              href="/admin/settings"
              className="inline-flex items-center gap-1.5 px-3 h-8 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-all"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </a>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 h-8 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Status</span>
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 h-8 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Add Button */}
        <div className="mb-8">
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingId(null);
              setFormData({ title: '', url: '', intervalSeconds: 60, expectedStatusCode: 200 });
            }}
            className="inline-flex items-center gap-2 px-4 h-9 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-md transition-all shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? 'Cancel' : 'Add Endpoint'}
          </button>
        </div>

        {/* Add Form (only for new endpoints) */}
        {showAddForm && !editingId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mb-8 bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
          >
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              New Endpoint
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                    placeholder="Production API"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    URL
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                    placeholder="https://api.example.com/health"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Interval (seconds)
                  </label>
                  <input
                    type="number"
                    value={formData.intervalSeconds}
                    onChange={(e) =>
                      setFormData({ ...formData, intervalSeconds: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                    min="10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Expected Status
                  </label>
                  <input
                    type="number"
                    value={formData.expectedStatusCode}
                    onChange={(e) =>
                      setFormData({ ...formData, expectedStatusCode: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                    min="100"
                    max="599"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-md transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    setFormData({ title: '', url: '', intervalSeconds: 60, expectedStatusCode: 200 });
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Endpoints */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-700">
            Endpoints ({endpoints.length})
          </h2>

          {loading ? (
            <div className="text-center py-8 text-sm text-gray-400">Loading...</div>
          ) : endpoints.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-500">No endpoints yet</p>
            </div>
          ) : (
            endpoints.map((endpoint, index) => (
              <div key={endpoint.id}>
                <div
                  onDragOver={(e) => handleDragOver(e, index)}
                  style={{ transition: 'all 0.3s ease' }}
                  className={`bg-white rounded-lg p-4 transition-all ${
                    draggedIndex === index
                      ? 'opacity-40 border-2 border-gray-400'
                      : 'border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className={`w-4 h-4 ${
                              endpoint.isActive ? 'text-emerald-500' : 'text-gray-300'
                            }`} fill="currentColor" />
                          <h3 className="font-medium text-gray-900 text-sm truncate">
                            {endpoint.title}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{endpoint.url}</p>
                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                          <span>{endpoint.intervalSeconds}s</span>
                          <span>Status {endpoint.expectedStatusCode}</span>
                          <span className={endpoint.isActive ? 'text-emerald-600' : 'text-gray-400'}>
                            {endpoint.isActive ? 'Active' : 'Paused'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleActive(endpoint)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                          title={endpoint.isActive ? 'Hide' : 'Show'}
                        >
                          {endpoint.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(endpoint)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(endpoint.id)}
                          className="p-1.5 rounded hover:bg-gray-100 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inline Edit Form */}
                {editingId === endpoint.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 bg-gray-50 rounded-lg border border-gray-200 p-4"
                  >
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Edit Endpoint
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            URL
                          </label>
                          <input
                            type="url"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Interval (seconds)
                          </label>
                          <input
                            type="number"
                            value={formData.intervalSeconds}
                            onChange={(e) =>
                              setFormData({ ...formData, intervalSeconds: parseInt(e.target.value) })
                            }
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                            min="10"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Expected Status
                          </label>
                          <input
                            type="number"
                            value={formData.expectedStatusCode}
                            onChange={(e) =>
                              setFormData({ ...formData, expectedStatusCode: parseInt(e.target.value) })
                            }
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                            min="100"
                            max="599"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-md transition-colors"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setFormData({ title: '', url: '', intervalSeconds: 60, expectedStatusCode: 200 });
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-900 text-sm font-medium rounded-md border border-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

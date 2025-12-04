'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings, ExternalLink, LogOut } from '@/components/icons';
import Link from 'next/link';

interface StatusPageConfig {
  id: number;
  pageTitle: string;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  headerText: string | null;
  footerText: string | null;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<StatusPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    pageTitle: '',
    companyName: '',
    logoUrl: '',
    headerText: '',
    footerText: '',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
      setFormData({
        pageTitle: data.pageTitle || '',
        companyName: data.companyName || '',
        logoUrl: data.logoUrl || '',
        headerText: data.headerText || '',
        footerText: data.footerText || '',
      });
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // Redirect to admin portal after successful save
      router.push('/admin');
    } catch (error) {
      console.error('Error saving config:', error);
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    window.location.href = '/admin';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
            <h1 className="text-base font-medium text-gray-900">Settings</h1>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
          <nav className="flex items-center gap-0.5">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 h-8 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
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

      <div className="max-w-3xl mx-auto px-6 py-12">

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Page Title
              </label>
              <input
                type="text"
                value={formData.pageTitle}
                onChange={(e) => setFormData({ ...formData, pageTitle: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                placeholder="Status Page"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                placeholder="My Company"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Logo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({ ...formData, logoUrl: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
              {formData.logoUrl && (
                <div className="mt-3">
                  <img src={formData.logoUrl} alt="Logo preview" className="h-16 object-contain rounded-md" />
                </div>
              )}
              <p className="mt-1.5 text-xs text-gray-500">Upload an image file</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Announcement Banner
              </label>
              <textarea
                value={formData.headerText}
                onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all resize-none"
                placeholder="We're currently investigating elevated response times. Updates will be posted here."
              />
              <p className="mt-1.5 text-xs text-gray-500">Displays a blue banner at the top of your status page</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Footer Text
              </label>
              <textarea
                value={formData.footerText}
                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all resize-none"
                placeholder="© 2024 My Company. All systems monitored in real-time."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

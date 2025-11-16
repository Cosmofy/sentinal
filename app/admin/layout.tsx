'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if already authenticated
    const authToken = localStorage.getItem('admin_auth');
    if (authToken === 'authenticated') {
      setIsAuthenticated(true);
    }
    setLoading(false);

    // Set page title based on pathname
    if (pathname.includes('/settings')) {
      document.title = 'Settings - Admin';
    } else {
      document.title = 'Admin Portal';
    }

    // Fetch and set favicon from config
    fetch('/api/config')
      .then(res => res.json())
      .then(config => {
        if (config.logoUrl) {
          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (link) {
            link.href = config.logoUrl;
          } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = config.logoUrl;
            document.head.appendChild(newLink);
          }
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simple password check - in production, use proper auth
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

    if (password === adminPassword) {
      localStorage.setItem('admin_auth', 'authenticated');
      setIsAuthenticated(true);
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setPassword('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900 mb-1">
              Admin Portal
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              Enter password to continue
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className={`w-full px-3 py-2 rounded-md border ${
                    error ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-300'
                  } bg-white text-gray-900 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all ${
                    error ? 'animate-shake' : ''
                  }`}
                  placeholder="Enter password"
                  required
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-md transition-colors"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {children}
    </div>
  );
}

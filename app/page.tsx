'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Monitoring Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome to your uptime monitoring system</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/status"
            className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            View Status Page
          </Link>
          <Link
            href="/admin"
            className="px-6 py-3 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
          >
            Admin Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, XCircle, Check, X } from '@/components/icons';

interface DayStats {
  date: string;
  uptimePercentage: number;
  totalChecks: number;
  successfulChecs: number;
  status: 'operational' | 'degraded' | 'down' | 'no-data';
}

interface EndpointStats {
  endpointId: number;
  endpointTitle: string;
  endpointUrl: string;
  overallUptime: number;
  last90Days: DayStats[];
  currentStatus: 'operational' | 'degraded' | 'down';
}

interface StatusPageConfig {
  id: number;
  pageTitle: string;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  headerText: string | null;
  footerText: string | null;
}

interface StatusData {
  config: StatusPageConfig;
  endpoints: EndpointStats[];
}

export default function StatusPageNew() {
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; status: string; uptime: number; x: number; y: number } | null>(null);

  useEffect(() => {
    fetchStatusData();
    const interval = setInterval(fetchStatusData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (statusData?.config.pageTitle) {
      document.title = statusData.config.pageTitle;
    }

    if (statusData?.config.logoUrl) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = statusData.config.logoUrl;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = statusData.config.logoUrl;
        document.head.appendChild(newLink);
      }
    }
  }, [statusData]);

  const fetchStatusData = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatusData(data);
    } catch (error) {
      console.error('Error fetching status data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!statusData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-400 text-sm">Failed to load status data</div>
      </div>
    );
  }

  const allOperational = statusData.endpoints.every((e) => e.currentStatus === 'operational');
  const anyDown = statusData.endpoints.some((e) => e.currentStatus === 'down');

  return (
    <div className="min-h-screen bg-white relative flex flex-col">
      {hoveredDay && (
        <div
          className="fixed z-50 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg pointer-events-none"
          style={{
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold">{hoveredDay.date}</div>
          <div className={`${
            hoveredDay.status === 'Operational' ? 'text-emerald-300' :
            hoveredDay.status === 'Degraded' ? 'text-amber-300' :
            hoveredDay.status === 'Down' ? 'text-red-300' :
            'text-gray-300'
          }`}>
            {hoveredDay.status}
            {hoveredDay.status !== 'No data' && ` · ${hoveredDay.uptime.toFixed(2)}%`}
          </div>
        </div>
      )}

      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      <header className="bg-white/80 backdrop-blur-sm relative z-10">
        <div className="w-full px-8 h-16 flex items-center gap-3 border-b border-gray-200">
          {statusData.config.logoUrl && (
            <img
              src={statusData.config.logoUrl}
              alt="Logo"
              className="h-8 object-contain rounded-md"
            />
          )}
          <h1 className="text-lg font-semibold text-gray-900">
            {statusData.config.companyName}
          </h1>
        </div>
      </header>

      <main className="w-full px-8 py-12 relative z-10 flex-1">
        {statusData.config.headerText && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-900">{statusData.config.headerText}</p>
          </div>
        )}

        <div
          className={`rounded-lg p-5 mb-8 ${
            allOperational
              ? 'bg-emerald-50 border border-emerald-200'
              : anyDown
              ? 'bg-red-50 border border-red-200'
              : 'bg-amber-50 border border-amber-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {allOperational ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            ) : anyDown ? (
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <h2
                className={`text-base font-medium mb-1 ${
                  allOperational
                    ? 'text-emerald-900'
                    : anyDown
                    ? 'text-red-900'
                    : 'text-amber-900'
                }`}
              >
                {allOperational
                  ? 'All Systems Operational'
                  : anyDown
                  ? 'Service Disruption'
                  : 'Partial Service Degradation'}
              </h2>
              <p
                className={`text-sm ${
                  allOperational
                    ? 'text-emerald-700'
                    : anyDown
                    ? 'text-red-700'
                    : 'text-amber-700'
                }`}
              >
                {new Date().toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short',
                })}
              </p>
            </div>
          </div>
        </div>

        {statusData.endpoints.length > 0 && (
          <div className="space-y-6">
            {statusData.endpoints.map((endpoint, index) => (
              <motion.div
                key={endpoint.endpointId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 flex items-center justify-center ${
                      endpoint.currentStatus === 'operational' ? 'bg-emerald-500' :
                      endpoint.currentStatus === 'degraded' ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}>
                      {endpoint.currentStatus === 'operational' ? (
                        <Check className="w-2 h-2 text-white" strokeWidth={4} />
                      ) : endpoint.currentStatus === 'down' ? (
                        <X className="w-2 h-2 text-white" strokeWidth={4} />
                      ) : null}
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm">{endpoint.endpointTitle}</h3>
                    <span className="text-xs text-gray-500">· 90 days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-900 font-semibold truncate">
                      {endpoint.endpointUrl.replace(/^https?:\/\//, '')}
                    </div>
                    <span className="text-gray-400">·</span>
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                      {endpoint.overallUptime.toFixed(2)}% uptime
                    </span>
                  </div>
                </div>

                <div className="flex gap-1 w-full relative">
                  {endpoint.last90Days.map((day) => {
                    const statusText = day.status === 'no-data'
                      ? 'No data'
                      : day.status === 'operational'
                      ? 'Operational'
                      : day.status === 'degraded'
                      ? 'Degraded'
                      : 'Down';

                    return (
                      <div
                        key={day.date}
                        className={`h-8 rounded-sm cursor-pointer ${
                          day.status === 'no-data'
                            ? 'bg-gray-200 hover:bg-gray-300'
                            : day.status === 'operational'
                            ? 'bg-emerald-400 hover:bg-emerald-500'
                            : day.status === 'degraded'
                            ? 'bg-amber-400 hover:bg-amber-500'
                            : 'bg-red-400 hover:bg-red-500'
                        } transition-all`}
                        style={{ flex: '1 1 0px', minWidth: 0 }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredDay({
                            date: day.date,
                            status: statusText,
                            uptime: day.uptimePercentage,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 10,
                          });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                      />
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {statusData.endpoints.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-sm">No services configured</p>
          </div>
        )}
      </main>

      {statusData.config.footerText && (
        <footer className="bg-white/80 backdrop-blur-sm relative z-10 py-4">
          <div className="w-full px-8 text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
            {statusData.config.footerText}
          </div>
        </footer>
      )}
    </div>
  );
}

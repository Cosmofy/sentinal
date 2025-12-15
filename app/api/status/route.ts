import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subDays, eachDayOfInterval } from 'date-fns';

// Format date as YYYY-MM-DD in UTC
function formatDateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// In-memory cache
let cachedData: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds

async function computeStatusData() {
  // Get status page config (or create default if doesn't exist)
  let config = await prisma.statusPageConfig.findFirst();

  if (!config) {
    config = await prisma.statusPageConfig.create({
      data: {},
    });
  }

  // Get all active endpoints
  const endpoints = await prisma.endpoint.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  const now = new Date();
  const ninetyDaysAgo = subDays(now, 90);

  // Fetch all pings for all endpoints in a single query
  const allPings = await prisma.ping.findMany({
    where: {
      endpointId: { in: endpoints.map(e => e.id) },
      timestamp: { gte: ninetyDaysAgo },
    },
    orderBy: { timestamp: 'asc' },
  });

  // Group pings by endpoint ID
  const pingsByEndpoint = new Map<number, typeof allPings>();
  for (const ping of allPings) {
    const existing = pingsByEndpoint.get(ping.endpointId) || [];
    existing.push(ping);
    pingsByEndpoint.set(ping.endpointId, existing);
  }

  // Pre-generate all days once
  const allDays = eachDayOfInterval({ start: ninetyDaysAgo, end: now });

  // Calculate stats for each endpoint
  const endpointsWithStats = endpoints.map((endpoint) => {
    const pings = pingsByEndpoint.get(endpoint.id) || [];

    const endpointCreatedDate = new Date(endpoint.createdAt);
    endpointCreatedDate.setHours(0, 0, 0, 0);

    // Group pings by date string for O(1) lookup
    const pingsByDate = new Map<string, { total: number; successful: number }>();
    for (const ping of pings) {
      const dateStr = formatDateUTC(new Date(ping.timestamp));
      const existing = pingsByDate.get(dateStr) || { total: 0, successful: 0 };
      existing.total++;
      if (ping.success) existing.successful++;
      pingsByDate.set(dateStr, existing);
    }

    const dayStats = allDays.map((date) => {
      const dateStr = formatDateUTC(date);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);

      const isBeforeCreation = dayStart < endpointCreatedDate;
      const dayData = pingsByDate.get(dateStr);

      const totalChecks = dayData?.total || 0;
      const successfulChecks = dayData?.successful || 0;
      const uptimePercentage = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;

      let status: 'operational' | 'degraded' | 'down' | 'no-data';

      if (isBeforeCreation) {
        status = 'no-data';
      } else if (totalChecks === 0) {
        status = 'no-data';
      } else if (uptimePercentage >= 98.5) {
        status = 'operational';
      } else if (uptimePercentage >= 90) {
        status = 'degraded';
      } else {
        status = 'down';
      }

      return {
        date: dateStr,
        uptimePercentage,
        totalChecks,
        successfulChecks,
        status,
      };
    });

    // Calculate overall uptime
    const totalPings = pings.length;
    const successfulPings = pings.filter((p) => p.success).length;
    const overallUptime = totalPings > 0 ? (successfulPings / totalPings) * 100 : 100;

    // Get current status (last 10 pings)
    const recentPings = pings.slice(-10);
    const recentSuccessRate =
      recentPings.length > 0
        ? (recentPings.filter((p) => p.success).length / recentPings.length) * 100
        : 100;

    let currentStatus: 'operational' | 'degraded' | 'down';
    if (recentSuccessRate >= 90) {
      currentStatus = 'operational';
    } else if (recentSuccessRate >= 50) {
      currentStatus = 'degraded';
    } else {
      currentStatus = 'down';
    }

    return {
      endpointId: endpoint.id,
      endpointTitle: endpoint.title,
      endpointDescription: endpoint.description,
      endpointUrl: endpoint.url,
      endpointType: endpoint.type,
      serverIp: endpoint.serverIp,
      whitelistEnabled: endpoint.whitelistEnabled,
      modpackUrl: endpoint.modpackUrl,
      overallUptime,
      last90Days: dayStats,
      currentStatus,
    };
  });

  return {
    config,
    endpoints: endpointsWithStats,
  };
}

export async function GET() {
  try {
    const now = Date.now();

    // Return cached data if still valid
    if (cachedData && (now - cacheTimestamp) < CACHE_TTL) {
      return NextResponse.json(cachedData);
    }

    // Compute fresh data
    const data = await computeStatusData();

    // Update cache
    cachedData = data;
    cacheTimestamp = now;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching status data:', error);
    return NextResponse.json({ error: 'Failed to fetch status data' }, { status: 500 });
  }
}

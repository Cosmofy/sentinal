import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subDays, format, eachDayOfInterval } from 'date-fns';

export async function GET() {
  try {
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

    // Calculate 90-day stats for each endpoint
    const endpointsWithStats = await Promise.all(
      endpoints.map(async (endpoint) => {
        const now = new Date();
        const ninetyDaysAgo = subDays(now, 90);

        // Get all pings for the last 90 days
        const pings = await prisma.ping.findMany({
          where: {
            endpointId: endpoint.id,
            timestamp: {
              gte: ninetyDaysAgo,
            },
          },
          orderBy: { timestamp: 'asc' },
        });

        // Group pings by day
        const endpointCreatedDate = new Date(endpoint.createdAt);
        endpointCreatedDate.setHours(0, 0, 0, 0);

        const dayStats = eachDayOfInterval({
          start: ninetyDaysAgo,
          end: now,
        }).map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);

          // Check if this day is before the endpoint was created
          const isBeforeCreation = dayStart < endpointCreatedDate;

          const dayPings = pings.filter((ping) => {
            const pingDate = new Date(ping.timestamp);
            return pingDate >= dayStart && pingDate <= dayEnd;
          });

          const totalChecks = dayPings.length;
          const successfulChecks = dayPings.filter((p) => p.success).length;
          const uptimePercentage = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;

          let status: 'operational' | 'degraded' | 'down' | 'no-data';

          // If before creation date, mark as no-data
          if (isBeforeCreation) {
            status = 'no-data';
          } else if (totalChecks === 0) {
            status = 'no-data';
          } else if (uptimePercentage >= 99) {
            status = 'operational';
          } else if (uptimePercentage >= 98) {
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
          endpointUrl: endpoint.url,
          overallUptime,
          last90Days: dayStats,
          currentStatus,
        };
      })
    );

    return NextResponse.json({
      config,
      endpoints: endpointsWithStats,
    });
  } catch (error) {
    console.error('Error fetching status data:', error);
    return NextResponse.json({ error: 'Failed to fetch status data' }, { status: 500 });
  }
}

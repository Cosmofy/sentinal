import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { monitorService } from '@/lib/monitor';

// GET /api/endpoints - Get all endpoints
export async function GET() {
  try {
    const endpoints = await prisma.endpoint.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(endpoints);
  } catch (error) {
    console.error('Error fetching endpoints:', error);
    return NextResponse.json({ error: 'Failed to fetch endpoints' }, { status: 500 });
  }
}

// POST /api/endpoints - Create new endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, url, type, port, serverIp, whitelistEnabled, modpackUrl, intervalSeconds, expectedStatusCode, isActive } = body;

    if (!title || !url) {
      return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
    }

    // Get the highest sortOrder and add 1
    const maxSortOrder = await prisma.endpoint.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const isMinecraft = type === 'minecraft';
    const endpoint = await prisma.endpoint.create({
      data: {
        title,
        description: description || null,
        url,
        type: type || 'http',
        port: isMinecraft ? (port || 25565) : null,
        serverIp: isMinecraft ? serverIp : null,
        whitelistEnabled: isMinecraft ? (whitelistEnabled || false) : false,
        modpackUrl: isMinecraft ? modpackUrl : null,
        intervalSeconds: intervalSeconds || 60,
        expectedStatusCode: expectedStatusCode || 200,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: (maxSortOrder?.sortOrder ?? -1) + 1,
      },
    });

    // Start monitoring if active
    if (endpoint.isActive) {
      monitorService.startMonitoring(endpoint.id, endpoint.intervalSeconds);
    }

    return NextResponse.json(endpoint, { status: 201 });
  } catch (error) {
    console.error('Error creating endpoint:', error);
    return NextResponse.json({ error: 'Failed to create endpoint' }, { status: 500 });
  }
}

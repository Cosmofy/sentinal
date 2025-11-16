import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { monitorService } from '@/lib/monitor';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/endpoints/:id - Get single endpoint
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const endpoint = await prisma.endpoint.findUnique({
      where: { id: parseInt(id) },
    });

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json(endpoint);
  } catch (error) {
    console.error('Error fetching endpoint:', error);
    return NextResponse.json({ error: 'Failed to fetch endpoint' }, { status: 500 });
  }
}

// PATCH /api/endpoints/:id - Update endpoint
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, url, intervalSeconds, expectedStatusCode, isActive, sortOrder } = body;

    const endpoint = await prisma.endpoint.update({
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(url !== undefined && { url }),
        ...(intervalSeconds !== undefined && { intervalSeconds }),
        ...(expectedStatusCode !== undefined && { expectedStatusCode }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    // Update monitoring
    if (endpoint.isActive) {
      monitorService.startMonitoring(endpoint.id, endpoint.intervalSeconds);
    } else {
      monitorService.stopMonitoring(endpoint.id);
    }

    return NextResponse.json(endpoint);
  } catch (error) {
    console.error('Error updating endpoint:', error);
    return NextResponse.json({ error: 'Failed to update endpoint' }, { status: 500 });
  }
}

// DELETE /api/endpoints/:id - Delete endpoint
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const endpointId = parseInt(id);

    await prisma.endpoint.delete({
      where: { id: endpointId },
    });

    // Stop monitoring
    monitorService.stopMonitoring(endpointId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting endpoint:', error);
    return NextResponse.json({ error: 'Failed to delete endpoint' }, { status: 500 });
  }
}

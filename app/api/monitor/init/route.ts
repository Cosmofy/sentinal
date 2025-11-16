import { NextResponse } from 'next/server';
import { monitorService } from '@/lib/monitor';

export async function POST() {
  try {
    await monitorService.syncAllEndpoints();
    return NextResponse.json({ message: 'Monitoring initialized' });
  } catch (error) {
    console.error('Error initializing monitoring:', error);
    return NextResponse.json({ error: 'Failed to initialize monitoring' }, { status: 500 });
  }
}

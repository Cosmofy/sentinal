import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/config - Get status page configuration
export async function GET() {
  try {
    let config = await prisma.statusPageConfig.findFirst();

    if (!config) {
      config = await prisma.statusPageConfig.create({
        data: {},
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

// PATCH /api/config - Update status page configuration
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageTitle, companyName, logoUrl, primaryColor, headerText, footerText } = body;

    // Get or create config
    let config = await prisma.statusPageConfig.findFirst();

    if (!config) {
      config = await prisma.statusPageConfig.create({
        data: {
          pageTitle,
          companyName,
          logoUrl,
          primaryColor,
          headerText,
          footerText,
        },
      });
    } else {
      config = await prisma.statusPageConfig.update({
        where: { id: config.id },
        data: {
          ...(pageTitle !== undefined && { pageTitle }),
          ...(companyName !== undefined && { companyName }),
          ...(logoUrl !== undefined && { logoUrl }),
          ...(primaryColor !== undefined && { primaryColor }),
          ...(headerText !== undefined && { headerText }),
          ...(footerText !== undefined && { footerText }),
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}

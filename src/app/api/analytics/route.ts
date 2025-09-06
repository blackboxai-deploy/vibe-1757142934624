import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsOverview } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const linkId = url.searchParams.get('linkId');
    
    // Get overall analytics overview
    const overview = await getAnalyticsOverview();
    
    // If specific link requested, you could filter here
    // For now, return the general overview
    
    return NextResponse.json({
      success: true,
      data: overview
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
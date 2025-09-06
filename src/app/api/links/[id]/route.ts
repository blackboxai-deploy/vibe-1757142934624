import { NextRequest, NextResponse } from 'next/server';
import { getLinkById, updateLink, deleteLink, getLinkStats } from '@/lib/database';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const includeStats = request.nextUrl.searchParams.get('includeStats') === 'true';
    
    const link = await getLinkById(id);
    
    if (!link) {
      return NextResponse.json(
        { success: false, error: 'Link not found' },
        { status: 404 }
      );
    }
    
    let response: any = {
      success: true,
      data: {
        ...link,
        // Don't expose password
        password: undefined
      }
    };
    
    if (includeStats) {
      const stats = await getLinkStats(id);
      response.data.stats = stats;
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch link' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const link = await getLinkById(id);
    
    if (!link) {
      return NextResponse.json(
        { success: false, error: 'Link not found' },
        { status: 404 }
      );
    }
    
    // Validate and sanitize update data
    const allowedUpdates = ['title', 'description', 'isActive', 'password', 'expiresAt'];
    const updates: any = {};
    
    for (const [key, value] of Object.entries(body)) {
      if (allowedUpdates.includes(key)) {
        updates[key] = value;
      }
    }
    
    // Validate expiration date
    if (updates.expiresAt && new Date(updates.expiresAt) <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Expiration date must be in the future' },
        { status: 400 }
      );
    }
    
    const success = await updateLink(id, updates);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update link' },
        { status: 500 }
      );
    }
    
    const updatedLink = await getLinkById(id);
    
    return NextResponse.json({
      success: true,
      data: {
        ...updatedLink,
        password: undefined
      }
    });
    
  } catch (error) {
    console.error('Error updating link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update link' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    const link = await getLinkById(id);
    
    if (!link) {
      return NextResponse.json(
        { success: false, error: 'Link not found' },
        { status: 404 }
      );
    }
    
    const success = await deleteLink(id);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete link' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Link deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete link' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createLink, getAllLinks } from '@/lib/database';
import { generateUniqueShortCode, createTrackingLink, isValidUrl, isValidCustomCode } from '@/lib/link-generator';
import { validateCreateLinkData } from '@/lib/validation';

export async function GET() {
  try {
    const links = await getAllLinks();
    
    return NextResponse.json({
      success: true,
      data: links.map(link => ({
        ...link,
        // Don't expose password in list view
        password: undefined
      }))
    });
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch links' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validation = validateCreateLinkData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input data',
          details: validation.errors
        },
        { status: 400 }
      );
    }
    
    const { originalUrl, customCode, title, description, password, expiresAt } = validation.data!;
    
    // Additional URL validation
    if (!isValidUrl(originalUrl)) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }
    
    // Validate custom code if provided
    if (customCode && !isValidCustomCode(customCode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid custom code format' },
        { status: 400 }
      );
    }
    
    try {
      // Generate unique short code
      const shortCode = await generateUniqueShortCode(customCode);
      
      // Create tracking link
      const trackingLink = createTrackingLink(originalUrl, shortCode, {
        title,
        description,
        password,
        expiresAt
      });
      
      // Save to database
      await createLink(trackingLink);
      
      // Generate full URL
      const baseUrl = request.headers.get('origin') || 'http://localhost:3000';
      const shortUrl = `${baseUrl}/r/${shortCode}`;
      
      return NextResponse.json({
        success: true,
        data: {
          ...trackingLink,
          // Don't expose password in response
          password: undefined
        },
        shortUrl
      }, { status: 201 });
      
    } catch (error) {
      if ((error as Error).message === 'Custom short code already exists') {
        return NextResponse.json(
          { success: false, error: 'Custom short code already exists' },
          { status: 409 }
        );
      }
      throw error;
    }
    
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create link' },
      { status: 500 }
    );
  }
}
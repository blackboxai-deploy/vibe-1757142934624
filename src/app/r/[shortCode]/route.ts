import { NextRequest, NextResponse } from 'next/server';
import { getLinkByShortCode, addClick } from '@/lib/database';
import { isLinkExpired, isPasswordProtected, generateId } from '@/lib/link-generator';
import { getIPGeolocation, getClientIP } from '@/lib/geolocation';
import { parseUserAgent, generateSessionId, isBot, parseReferer } from '@/lib/device-detection';
import { LinkClick } from '@/types/link';

export async function GET(request: NextRequest, context: { params: { shortCode: string } }) {
  try {
    const { shortCode } = context.params;
    const url = new URL(request.url);
    const password = url.searchParams.get('password');
    
    // Find the link
    const link = await getLinkByShortCode(shortCode);
    
    if (!link) {
      return new NextResponse('Link not found', { status: 404 });
    }
    
    // Check if link is active
    if (!link.isActive) {
      return new NextResponse('Link is disabled', { status: 410 });
    }
    
    // Check if link is expired
    if (isLinkExpired(link)) {
      return new NextResponse('Link has expired', { status: 410 });
    }
    
    // Check password protection
    if (isPasswordProtected(link)) {
      if (!password || link.password !== password) {
        // Return password prompt page
        const passwordPromptHtml = generatePasswordPromptHTML(shortCode);
        return new NextResponse(passwordPromptHtml, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
    }
    
    // Track the click (but not for bots)
    const userAgent = request.headers.get('user-agent') || '';
    const shouldTrack = !isBot(userAgent);
    
    if (shouldTrack) {
      await trackClick(request, link.id, shortCode);
    }
    
    // Redirect to original URL
    return NextResponse.redirect(link.originalUrl, { status: 302 });
    
  } catch (error) {
    console.error('Error in redirect handler:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

async function trackClick(request: NextRequest, linkId: string, shortCode: string) {
  try {
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || undefined;
    const ip = getClientIP(request);
    
    // Get device info
    const deviceInfo = parseUserAgent(userAgent);
    
    // Get referer info
    const refererInfo = parseReferer(referer);
    
    // Get location data
    const location = await getIPGeolocation(ip);
    
    // Generate session ID (in real app, you might use cookies)
    const sessionId = generateSessionId();
    
    const click: LinkClick = {
      id: generateId(),
      linkId,
      shortCode,
      timestamp: new Date().toISOString(),
      ipAddress: ip,
      userAgent,
      referer,
      location: {
        country: location.country,
        countryCode: location.countryCode,
        region: location.region,
        city: location.city,
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,
        isp: location.isp,
        source: location.source
      },
      device: deviceInfo,
      sessionId
    };
    
    await addClick(click);
    
  } catch (error) {
    console.error('Error tracking click:', error);
    // Don't fail the redirect if tracking fails
  }
}

function generatePasswordPromptHTML(shortCode: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Required</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .container {
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 400px;
                width: 100%;
                text-align: center;
            }
            
            .icon {
                width: 60px;
                height: 60px;
                margin: 0 auto 20px;
                background: #f3f4f6;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            }
            
            h1 {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 10px;
                color: #1f2937;
            }
            
            p {
                color: #6b7280;
                margin-bottom: 30px;
                line-height: 1.5;
            }
            
            .form-group {
                margin-bottom: 20px;
                text-align: left;
            }
            
            label {
                display: block;
                font-weight: 500;
                margin-bottom: 6px;
                color: #374151;
            }
            
            input[type="password"] {
                width: 100%;
                padding: 12px 16px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-size: 16px;
                transition: border-color 0.2s;
            }
            
            input[type="password"]:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            button {
                width: 100%;
                background: #3b82f6;
                color: white;
                border: none;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            button:hover {
                background: #2563eb;
            }
            
            button:disabled {
                background: #9ca3af;
                cursor: not-allowed;
            }
            
            .error {
                background: #fee2e2;
                color: #dc2626;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 20px;
                font-size: 14px;
            }
            
            @media (max-width: 480px) {
                .container {
                    padding: 30px 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">🔒</div>
            <h1>Password Required</h1>
            <p>This link is password protected. Please enter the password to continue.</p>
            
            <div id="error" class="error" style="display: none;"></div>
            
            <form onsubmit="handleSubmit(event)">
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" id="submitBtn">Access Link</button>
            </form>
        </div>
        
        <script>
            function handleSubmit(event) {
                event.preventDefault();
                const password = document.getElementById('password').value;
                const submitBtn = document.getElementById('submitBtn');
                const errorDiv = document.getElementById('error');
                
                submitBtn.disabled = true;
                submitBtn.textContent = 'Accessing...';
                errorDiv.style.display = 'none';
                
                // Redirect with password parameter
                const url = new URL(window.location.href);
                url.searchParams.set('password', password);
                window.location.href = url.toString();
            }
        </script>
    </body>
    </html>
  `;
}
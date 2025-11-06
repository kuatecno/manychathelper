import { NextRequest, NextResponse } from 'next/server';

/**
 * Media Proxy Endpoint
 * Proxies images to hide original CDN sources (Instagram, TikTok, etc.)
 *
 * GET /api/v1/media/proxy?url=ENCODED_URL
 *
 * Security: Only allows whitelisted domains to prevent abuse
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'Missing URL parameter' },
      { status: 400 }
    );
  }

  // Decode the URL
  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid URL encoding' },
      { status: 400 }
    );
  }

  // Whitelist allowed CDN domains
  const allowedDomains = [
    'cdninstagram.com',
    'fbcdn.net',
    'tiktokcdn.com',
    'tiktokcdn-us.com',
    'bytedance.com',
    'googleusercontent.com',
    'ggpht.com',
  ];

  const isAllowed = allowedDomains.some(domain => decodedUrl.includes(domain));

  if (!isAllowed) {
    return NextResponse.json(
      { error: 'URL not allowed' },
      { status: 403 }
    );
  }

  try {
    // Fetch the image
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.instagram.com/',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch media' },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Create response with aggressive caching
    const proxyResponse = new NextResponse(Buffer.from(imageBuffer));

    proxyResponse.headers.set('Content-Type', contentType);
    proxyResponse.headers.set('Cache-Control', 'public, max-age=86400, immutable');
    proxyResponse.headers.set('X-Content-Type-Options', 'nosniff');

    // Remove headers that could reveal source
    // (NextResponse doesn't include upstream headers by default)

    return proxyResponse;
  } catch (error) {
    console.error('Error proxying media:', error);
    return NextResponse.json(
      { error: 'Failed to proxy media' },
      { status: 500 }
    );
  }
}

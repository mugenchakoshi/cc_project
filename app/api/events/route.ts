import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js API Route プロキシ
 * AWS API Gatewayへのリクエストを中継してCORS問題を回避
 */

const API_GATEWAY_URL = 'https://n3j0j9wpk7.execute-api.us-east-1.amazonaws.com/api/events';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // AWS API Gatewayに転送
    const response = await fetch(API_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Gateway Error:', response.status, errorText);
      return NextResponse.json(
        { error: `API Gateway Error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

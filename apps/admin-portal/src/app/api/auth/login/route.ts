import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Call BE API for admin login
    const beResponse = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await beResponse.json();

    if (!beResponse.ok) {
      // Extract error message properly (BE returns { error: { code, message } })
      const errorMsg = data.error?.message || data.message || 'Invalid username or password';
      return NextResponse.json(
        { error: errorMsg },
        { status: beResponse.status }
      );
    }

    // Extract token from response
    const token = data.data?.accessToken || data.accessToken;
    const admin = data.data?.admin || data.admin;

    if (!token) {
      return NextResponse.json(
        { error: 'No access token received' },
        { status: 500 }
      );
    }

    // Set cookies in response headers (required for Next.js)
    const nextResponse = NextResponse.json({
      success: true,
      admin: admin || {
        username,
        role: 'ADMIN',
      },
      accessToken: token, // Return token for client-side to store in localStorage
    });

    // Set JWT token cookie for server-side API calls
    nextResponse.cookies.set('admin_token', token, {
      httpOnly: false, // Set to false so Server Components can read it
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Also set session cookie for backward compatibility
    const sessionToken = Buffer.from(JSON.stringify({
      id: admin?.id || '',
      username: admin?.username || username,
      role: admin?.role || 'ADMIN',
    })).toString('base64');

    nextResponse.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return nextResponse;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}


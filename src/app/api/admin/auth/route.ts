import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = body;

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: 'ADMIN_PASSWORD not configured on the server.' },
        { status: 500 }
      );
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Constant-time comparison to prevent timing attacks
    const isValid =
      password.length === adminPassword.length &&
      crypto.timingSafeEqual(
        Buffer.from(password),
        Buffer.from(adminPassword)
      );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Generate a simple session token (SHA-256 hash of password + timestamp)
    // In production, use proper JWT or session management
    const token = crypto
      .createHash('sha256')
      .update(`${adminPassword}-${Date.now()}`)
      .digest('hex');

    return NextResponse.json({ success: true, token });
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

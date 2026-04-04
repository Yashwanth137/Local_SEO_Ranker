import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Lead from '@/models/Lead';

export async function GET(req: Request) {
  try {
    // Basic token check from Authorization header
    const authHeader = req.headers.get('Authorization');
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminPassword && !authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const leads = await Lead.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ leads });
  } catch (error: any) {
    console.error("Error fetching leads", error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

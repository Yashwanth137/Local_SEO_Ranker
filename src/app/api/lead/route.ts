import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Report from '@/models/Report';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { reportId, name, email, phone } = body;

    if (!reportId || !name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const lead = new Lead({
      name,
      email,
      phone,
      keyword: report.keyword,
      location: report.location
    });

    await lead.save();

    return NextResponse.json({ success: true, message: 'Lead saved successfully' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

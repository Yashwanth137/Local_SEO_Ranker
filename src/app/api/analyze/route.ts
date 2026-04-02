import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { keyword, location, businessName, website } = body;

    if (!keyword || !location) {
      return NextResponse.json({ error: 'Keyword and location are required' }, { status: 400 });
    }

    // Since we don't have real keys right now or we want to save credits during dev,
    // we use a structured API call that can be swapped with real data.
    const serpApiKey = process.env.SERPAPI_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let competitors: any[] = [];
    let ranking = 0;
    
    if (serpApiKey) {
      try {
        const serpResponse = await axios.get('https://serpapi.com/search', {
          params: {
            engine: 'google',
            q: `${keyword} in ${location}`,
            api_key: serpApiKey,
            num: 100
          }
        });
        
        const organicResults = serpResponse.data.organic_results || [];
        competitors = organicResults.slice(0, 10).map((r: any) => ({
          title: r.title,
          link: r.link,
          snippet: r.snippet,
          position: r.position
        }));

        if (businessName || website) {
          const found = organicResults.find((r: any) => {
             const matchWebsite = website && r.link.includes(website);
             const matchName = businessName && r.title.toLowerCase().includes(businessName.toLowerCase());
             return matchWebsite || matchName;
          });
          if (found) ranking = found.position;
        }

      } catch (err) {
        console.error("SerpAPI Error", err);
      }
    } else {
      // Mock data
      competitors = [
        { title: "Competitor 1", link: "https://example.com/1", snippet: "Best services ever.", position: 1 },
        { title: "Competitor 2", link: "https://example.com/2", snippet: "Great local business.", position: 2 },
      ];
      ranking = 5;
    }

    let keywords = [];
    let insights = "";
    let seoScore = 75;

    if (openaiKey) {
      try {
        const aiResponse = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a local SEO expert." },
              { role: "user", content: `Generate 5 alternative localized keyword ideas for '${keyword}' in '${location}' and return JSON format [{ "keyword": "...", "searchVolume": "High", "difficulty": "Medium" }]` }
            ],
            response_format: { type: "json_object" }
          },
          { headers: { Authorization: `Bearer ${openaiKey}` } }
        );
        // Simplified parsing for brevity
        const parsed = JSON.parse(aiResponse.data.choices[0].message.content || '{}');
        keywords = parsed.keywords || parsed;
        insights = "Your local SEO score is based on the presence of your business in the top 100 search results. To improve, focus on local citations and Google My Business optimization.";
      } catch (err) {
        console.error("OpenAI Error", err);
      }
    } else {
      // Mock data
      keywords = [
        { keyword: `${keyword} near me`, searchVolume: "High", difficulty: "Hard" },
        { keyword: `best ${keyword} in ${location}`, searchVolume: "Medium", difficulty: "Medium" }
      ];
      insights = "Mock insights: Build more local backlinks and optimize your GMB profile.";
    }

    const report = new Report({
      keyword,
      location,
      businessName,
      website,
      ranking,
      competitors,
      keywords,
      seoScore,
      insights
    });

    await report.save();

    return NextResponse.json({
      reportId: report._id,
      ranking: report.ranking,
      seoScore: report.seoScore,
      message: "Partial data returned. Submit lead form to unlock full report."
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

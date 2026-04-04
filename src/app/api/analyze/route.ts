import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';
import axios from 'axios';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * Calculates a dynamic SEO score (0-100) based on:
 * - Ranking position in search results (0-50 pts)
 * - Number of competitors found (0-20 pts)
 * - Whether business was found at all (0-15 pts)
 * - Website presence (0-15 pts)
 */
function calculateSeoScore(ranking: number, competitorCount: number, hasWebsite: boolean): number {
  let score = 0;

  // Ranking component (50 pts max) — closer to #1 = higher score
  if (ranking > 0 && ranking <= 100) {
    score += Math.round(50 * (1 - (ranking - 1) / 100));
  }
  // If not found at all, 0 pts for ranking

  // Competitor landscape (20 pts max) — more data = better analysis
  score += Math.min(20, competitorCount * 2);

  // Business visibility (15 pts) — found in results at all
  if (ranking > 0 && ranking <= 100) {
    score += 15;
  }

  // Website presence (15 pts)
  if (hasWebsite) {
    score += 15;
  }

  return Math.min(100, Math.max(0, score));
}

export async function POST(req: Request) {
  try {
    // Rate limit: 5 analyses per minute per IP
    const ip = getClientIp(req);
    const limit = checkRateLimit(ip, { maxRequests: 5, windowSeconds: 60 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${limit.resetInSeconds} seconds.` },
        { status: 429, headers: { 'Retry-After': String(limit.resetInSeconds) } }
      );
    }

    await dbConnect();
    const body = await req.json();
    const { keyword, location, businessName, website } = body;

    if (!keyword || !location) {
      return NextResponse.json({ error: 'Keyword and location are required' }, { status: 400 });
    }

    const tavilyApiKey = process.env.TAVILY_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    let competitors: any[] = [];
    let ranking = 0;
    
    // ── Step 1: Fetch search data using Tavily ──
    if (tavilyApiKey) {
      try {
        const tavilyResponse = await axios.post('https://api.tavily.com/search', {
          api_key: tavilyApiKey,
          query: `${keyword} in ${location}`,
          search_depth: "advanced",
          include_answer: false,
          include_images: false,
          include_raw_content: false,
          max_results: 20
        });
        
        const organicResults = tavilyResponse.data.results || [];
        competitors = organicResults.slice(0, 10).map((r: any, idx: number) => ({
          title: r.title,
          link: r.url,
          snippet: r.content,
          position: idx + 1
        }));

        if (businessName || website) {
          const found = organicResults.find((r: any) => {
             const matchWebsite = website && r.url.includes(website);
             const matchName = businessName && r.title.toLowerCase().includes(businessName.toLowerCase());
             return matchWebsite || matchName;
          });
          if (found) {
             const idx = organicResults.indexOf(found);
             ranking = idx + 1;
          }
        }

      } catch (err) {
        console.error("Tavily Error", err);
      }
    } else {
      // Mock data for development
      competitors = [
        { title: "Competitor 1 - Best Local Service", link: "https://example.com/1", snippet: "Top-rated local business with 5-star reviews and certified professionals.", position: 1 },
        { title: "Competitor 2 - Premium Solutions", link: "https://example.com/2", snippet: "Serving the community for over 20 years with reliable, affordable service.", position: 2 },
        { title: "Competitor 3 - Expert Services", link: "https://example.com/3", snippet: "Licensed and insured professionals available 24/7 for emergency calls.", position: 3 },
      ];
      ranking = 5;
    }

    // ── Step 2: Calculate dynamic SEO score ──
    const seoScore = calculateSeoScore(ranking, competitors.length, !!website);

    // ── Step 3: Generate AI keywords AND insights using Groq ──
    let keywords: any[] = [];
    let insights = "";

    if (groqApiKey) {
      try {
        // Single prompt that generates both keywords and insights
        const competitorSummary = competitors.slice(0, 5).map(c => `#${c.position}: ${c.title}`).join(', ');
        
        const aiResponse = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: "llama-3.3-70b-versatile",
            messages: [
              { 
                role: "system", 
                content: "You are a local SEO expert who provides actionable, specific advice. Output ONLY valid JSON." 
              },
              { 
                role: "user", 
                content: `Analyze this local SEO scenario and return a JSON response:

BUSINESS: "${businessName || 'Unknown Business'}"
KEYWORD: "${keyword}"  
LOCATION: "${location}"
CURRENT RANK: ${ranking > 0 ? `#${ranking} out of 20 results` : 'Not found in top 20 results'}
SEO SCORE: ${seoScore}/100
TOP COMPETITORS: ${competitorSummary || 'No competitors found'}
HAS WEBSITE: ${website ? 'Yes (' + website + ')' : 'No website provided'}

Return EXACTLY this JSON format:
{
  "keywords": [
    { "keyword": "a specific alternative keyword", "searchVolume": "High/Medium/Low", "difficulty": "Easy/Medium/Hard" }
  ],
  "insights": "Write 3-4 sentences of specific, actionable SEO advice. Reference the actual ranking position, competitors, and location. Be direct and helpful — explain exactly what they should do to improve. Do NOT be generic."
}

Generate exactly 5 keyword ideas. Make the insights specific to their situation.`
              }
            ],
            response_format: { type: "json_object" }
          },
          { headers: { Authorization: `Bearer ${groqApiKey}`, "Content-Type": "application/json" } }
        );
        
        const content = aiResponse.data.choices[0].message.content;
        const parsed = JSON.parse(content || '{}');
        keywords = parsed.keywords || [];
        insights = parsed.insights || "Analysis complete. Focus on improving local citations and optimizing your Google Business Profile.";
      } catch (err: any) {
        console.error("Groq Error", err.response?.data || err.message);
        // Fallback insights if Groq fails
        insights = ranking > 0
          ? `Your business was found at position #${ranking} for "${keyword}" in ${location}. To climb higher, focus on building local backlinks, collecting more Google reviews, and ensuring your NAP (Name, Address, Phone) is consistent across all directories.`
          : `Your business was not found in the top search results for "${keyword}" in ${location}. Start by claiming your Google Business Profile, building citations on Yelp, Yellow Pages, and industry directories, and creating location-specific content on your website.`;
      }
    } else {
      // Mock data for development
      keywords = [
        { keyword: `${keyword} near me`, searchVolume: "High", difficulty: "Hard" },
        { keyword: `best ${keyword} in ${location}`, searchVolume: "Medium", difficulty: "Medium" },
        { keyword: `affordable ${keyword} ${location}`, searchVolume: "Medium", difficulty: "Easy" },
        { keyword: `${keyword} services ${location}`, searchVolume: "High", difficulty: "Medium" },
        { keyword: `top rated ${keyword} near ${location}`, searchVolume: "Low", difficulty: "Easy" },
      ];
      insights = `Your business is currently ranking #${ranking} for "${keyword}" in ${location}, which puts you on the first page but below the top 3 positions where most clicks happen. Focus on earning more Google reviews (aim for 50+), optimizing your Google Business Profile with photos and posts, and building backlinks from local directories like Yelp and the ${location} Chamber of Commerce.`;
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

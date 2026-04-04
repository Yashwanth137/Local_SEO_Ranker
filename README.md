# Zorvexa Local Ranker

**AI-powered local SEO audit tool and B2B lead generation engine.**

Zorvexa Local Ranker lets business owners instantly check how they rank on Google for local searches. Behind the scenes, it captures their contact info as a warm lead — making it a powerful tool for marketing agencies.

## How It Works

```
Landing Page → Enter keyword + location → AI analyzes search results
    ↓
Teaser Score shown (rank + SEO health)
    ↓
Lead Gate Modal → User enters Name, Email, Phone to unlock full report
    ↓
Full Report revealed (competitors, AI keywords, expert insights)
    ↓
Lead saved to MongoDB + admin notified via email
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Serverless) |
| **Language** | TypeScript |
| **UI** | React 19 + TailwindCSS v4 + Framer Motion |
| **Database** | MongoDB via Mongoose (connection caching) |
| **Search API** | [Tavily](https://tavily.com) — live search results |
| **LLM** | [Groq](https://groq.com) — Llama 3.3 70B (keyword ideas + insights) |
| **Email** | [Resend](https://resend.com) — admin notifications on new leads |
| **Icons** | Lucide React |

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Yashwanth137/Local_SEO_Ranker.git
cd Local_SEO_Ranker
npm install
```

### 2. Configure Environment

Copy the example env file and fill in your keys:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description | Get it from |
|----------|-------------|-------------|
| `MONGODB_URI` | MongoDB connection string | [MongoDB Atlas](https://cloud.mongodb.com) (free tier works) |
| `TAVILY_API_KEY` | Search API key | [tavily.com](https://tavily.com) |
| `GROQ_API_KEY` | LLM API key | [console.groq.com](https://console.groq.com) |
| `RESEND_API_KEY` | Email notifications (optional) | [resend.com](https://resend.com) |
| `ADMIN_EMAIL` | Your email for lead alerts (optional) | — |

> **Note:** The app runs fully with mock data if API keys are missing — great for local development.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page with search form
│   ├── layout.tsx                  # Root layout (fonts, SEO meta, toaster)
│   ├── globals.css                 # Design system (dark theme, glassmorphism)
│   ├── results/[id]/page.tsx       # Report page with lead gate
│   ├── admin/page.tsx              # Internal lead dashboard
│   └── api/
│       ├── analyze/route.ts        # POST — Tavily search + Groq AI + save report
│       ├── lead/route.ts           # POST — Save lead + email notification
│       ├── reports/[id]/route.ts   # GET  — Fetch single report
│       └── admin/leads/route.ts    # GET  — Fetch all leads
├── components/
│   ├── LeadGateModal.tsx           # Animated lead capture overlay
│   ├── ScoreIndicator.tsx          # SVG circular progress ring
│   └── ui/                         # Button, Card, Input, Toaster
├── lib/
│   ├── mongodb.ts                  # Mongoose connection with global caching
│   ├── email.ts                    # Resend email notifications
│   └── utils.ts                    # cn() utility
├── models/
│   ├── Report.ts                   # SEO report schema
│   └── Lead.ts                     # Captured lead schema
└── types/
    └── mongoose.d.ts               # Global type augmentation
```

## Features

- **Instant SEO Audit** — Enter a keyword and location, get live ranking data
- **AI Keyword Ideas** — Groq (Llama 3.3) generates 5 localized keyword opportunities  
- **Dynamic SEO Score** — Calculated from ranking position, competitor data, and website presence
- **Lead Gate** — Blur-locked premium content forces contact info submission
- **Admin Dashboard** — View all captured leads at `/admin`
- **Email Alerts** — Get notified instantly when a new lead comes in
- **Mock Mode** — Full functionality without API keys for development
- **Glassmorphism UI** — Dark-mode design with frosted-glass cards and smooth animations

## Deploy

One-click deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Yashwanth137/Local_SEO_Ranker)

Set your environment variables in the Vercel dashboard after deploying.

## License

MIT

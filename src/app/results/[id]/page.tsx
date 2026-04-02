"use client";

import { useEffect, useState, use } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, Trophy, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LeadGateModal } from "@/components/LeadGateModal";
import { ScoreIndicator } from "@/components/ScoreIndicator";

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [reportData, setReportData] = useState<any>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports/${resolvedParams.id}`);
        const data = await res.json();
        if (data.report) {
          setReportData(data.report);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [resolvedParams.id, unlocked]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading Analysis...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return <div className="min-h-screen flex items-center justify-center">Report not found.</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 relative">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Local SEO Analysis</h1>
            <p className="text-muted-foreground mt-2 flex items-center">
              Targeting <span className="font-semibold text-primary mx-1">{reportData.keyword}</span> in <span className="font-semibold text-primary ml-1">{reportData.location}</span>
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-sm text-muted-foreground">
            {reportData.businessName && <p>Business: {reportData.businessName}</p>}
          </div>
        </header>

        {/* Top Cards (Always Visible) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Trophy className="text-yellow-500 w-6 h-6" />
                Current Local Rank
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pb-8">
              {reportData.ranking && reportData.ranking > 0 && reportData.ranking <= 100 ? (
                <>
                  <span className="text-6xl font-extrabold text-foreground">{reportData.ranking}</span>
                  <span className="text-green-500 flex items-center mt-2 font-medium">
                    <CheckCircle className="w-4 h-4 mr-1" /> Found in Top 100
                  </span>
                </>
              ) : (
                <>
                  <span className="text-6xl font-extrabold text-muted-foreground">100+</span>
                  <span className="text-red-400 flex items-center mt-2 font-medium">
                    <AlertTriangle className="w-4 h-4 mr-1" /> Not found in Top 100
                  </span>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-center">Overall SEO Health</CardTitle>
            </CardHeader>
            <CardContent className="pb-8">
              <ScoreIndicator score={reportData.seoScore} />
            </CardContent>
          </Card>
        </div>

        {/* Premium Content Area (Blurred if locked) */}
        <div className="relative">
          {!unlocked && <LeadGateModal reportId={resolvedParams.id} onUnlock={() => setUnlocked(true)} />}

          <div className={`space-y-8 ${!unlocked ? 'filter blur-[8px] select-none pointer-events-none opacity-50' : ''}`}>
            
            {/* Competitors */}
            <Card>
              <CardHeader>
                <CardTitle>Top Local Competitors</CardTitle>
                <CardDescription>The businesses currently dominating this search.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.competitors.slice(0, 5).map((comp: any, i: number) => (
                    <div key={i} className="flex items-start p-4 rounded-lg bg-white/5 border border-white/5 transition-colors hover:border-primary/50">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold mr-4">
                        {comp.position}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-lg">{comp.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{comp.snippet}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Keyword Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle>AI Keyword Opportunities</CardTitle>
                <CardDescription>Alternative searches with high intent.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {reportData.keywords.map((kw: any, i: number) => (
                    <div key={i} className="px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-sm font-medium">
                      {kw.keyword}
                      <span className="ml-2 text-xs text-muted-foreground">({kw.searchVolume})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="border-indigo-500/30">
              <CardHeader>
                <CardTitle className="text-indigo-400">Expert AI Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {reportData.insights}
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Users, Search, RefreshCcw, Lock, LogOut, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";

export default function AdminDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setAuthLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthenticated(true);
        sessionStorage.setItem("admin_token", data.token);
        toast("Welcome to the admin dashboard", "success");
        fetchLeads(data.token);
      } else {
        toast(data.error || "Invalid password", "error");
      }
    } catch {
      toast("Authentication failed", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchLeads = async (token?: string) => {
    setLoading(true);
    const authToken = token || sessionStorage.getItem("admin_token");
    try {
      const res = await fetch("/api/admin/leads", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401) {
        setAuthenticated(false);
        sessionStorage.removeItem("admin_token");
        toast("Session expired. Please log in again.", "error");
        return;
      }
      const data = await res.json();
      if (data.leads) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.error("Failed to fetch leads", err);
      toast("Failed to load leads", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setLeads([]);
    setPassword("");
    sessionStorage.removeItem("admin_token");
    toast("Logged out successfully", "info");
  };

  // Check for existing session on mount
  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (token) {
      setAuthenticated(true);
      fetchLeads(token);
    }
  }, []);

  // ── Login Gate ──
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="glass-card rounded-2xl p-8 shadow-2xl border border-primary/10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-indigo-400 rounded-t-2xl" />
            
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Admin Access</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Enter your admin password to view captured leads.
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  required
                  placeholder="Admin Password"
                  className="pl-9 h-12 bg-white/5 border-white/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full h-12" disabled={authLoading}>
                {authLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Authenticate"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated Dashboard ──
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="text-primary w-8 h-8" />
              Lead Generation Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Manage and view captured leads from the Local SEO tool.</p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <Button onClick={() => fetchLeads()} variant="outline" className="gap-2" disabled={loading}>
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="gap-2 text-muted-foreground hover:text-red-400">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle>Recent Leads ({leads.length})</CardTitle>
              <CardDescription>All prospects captured by the system.</CardDescription>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  No leads captured yet. Run some traffic to your tool!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-white/5">
                      <tr>
                        <th className="px-6 py-3 rounded-tl-lg">Date</th>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Phone</th>
                        <th className="px-6 py-3">Keyword & Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead: any) => (
                        <tr key={lead._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                            {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 font-medium text-foreground">{lead.name}</td>
                          <td className="px-6 py-4">{lead.email}</td>
                          <td className="px-6 py-4">{lead.phone || 'N/A'}</td>
                          <td className="px-6 py-4 text-primary">
                            {lead.keyword} in {lead.location}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  LayoutDashboard,
  Users,
  Star as StarIcon,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Search,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ReviewTrendsChart } from "@/components/charts/review-trends";
import { PriorityDistributionChart } from "@/components/charts/priority-distribution";
import { CategoryMetricsChart } from "@/components/charts/category-metrics";
import { TeamDistributionChart } from "@/components/charts/team-distribution";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RecommendedAction {
  action: string;
  priority: string;
  owner: string;
}

interface Submission {
  id: string;
  rating: number;
  review_text: string;
  user_response: string | null;
  admin_summary: string | null;
  admin_recommended_actions: RecommendedAction[] | null;
  created_at: string;
}

interface SubmissionsResponse {
  submissions: Submission[];
  total: number;
}

interface RatingCount {
  rating: number;
  count: number;
  percentage: number;
}

interface DailyVolume {
  date: string;
  count: number;
}

interface AnalyticsData {
  total_submissions: number;
  rating_distribution: RatingCount[];
  average_rating: number;
  daily_volume: DailyVolume[];
  today_count: number;
  this_week_count: number;
}

export default function Home() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");

  const apiUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const fetchSubmissions = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/v1/submissions`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SubmissionsResponse = await response.json();
      setSubmissions(data.submissions);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch submissions"
      );
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/v1/analytics`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AnalyticsData = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchSubmissions();
    fetchAnalytics();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchSubmissions();
      fetchAnalytics();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchSubmissions, fetchAnalytics]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-900";
      case "low":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  // Transform data for advanced charts
  const getReviewTrendsData = () => {
    if (!analytics?.daily_volume) return [];
    return analytics.daily_volume.map((day) => ({
      date: day.date,
      positive: submissions.filter((s) => {
        const submissionDate = new Date(s.created_at)
          .toISOString()
          .split("T")[0];
        return submissionDate === day.date && s.rating >= 4;
      }).length,
      negative: submissions.filter((s) => {
        const submissionDate = new Date(s.created_at)
          .toISOString()
          .split("T")[0];
        return submissionDate === day.date && s.rating <= 2;
      }).length,
      total: day.count,
    }));
  };

  const getPriorityDistributionData = () => {
    if (!analytics?.daily_volume) return [];
    return analytics.daily_volume.map((day) => {
      const daySubmissions = submissions.filter((s) => {
        const submissionDate = new Date(s.created_at)
          .toISOString()
          .split("T")[0];
        return submissionDate === day.date;
      });

      let high = 0,
        medium = 0,
        low = 0;
      daySubmissions.forEach((sub) => {
        sub.admin_recommended_actions?.forEach((action) => {
          const priority = action.priority.toLowerCase();
          if (priority === "high") high++;
          else if (priority === "medium") medium++;
          else if (priority === "low") low++;
        });
      });

      return { date: day.date, high, medium, low };
    });
  };

  const getRatingDistributionData = () => {
    if (!analytics?.rating_distribution) return [];
    return analytics.rating_distribution.map((item) => ({
      category: `${item.rating} Star`,
      value: item.count,
      fill: `hsl(var(--chart-${item.rating}))`,
    }));
  };

  const getTeamDistributionData = () => {
    const teamCounts: Record<string, number> = {};

    submissions.forEach((sub) => {
      sub.admin_recommended_actions?.forEach((action) => {
        const team = action.owner;
        teamCounts[team] = (teamCounts[team] || 0) + 1;
      });
    });

    return Object.entries(teamCounts)
      .map(([team, actions]) => ({ team, actions }))
      .sort((a, b) => b.actions - a.actions);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <LayoutDashboard className="mr-2 h-6 w-6" />
            <span className="font-bold sm:inline-block">Fynd Admin</span>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="flex items-center space-x-2">
              {lastUpdated && (
                <span className="text-xs text-muted-foreground hidden sm:inline-block">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        {/* Error Banner */}
        {error && (
          <div className="rounded-md bg-destructive/15 p-4 border border-destructive/20">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle
                  className="h-5 w-5 text-destructive"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-destructive">
                  Error loading data
                </h3>
                <div className="mt-2 text-sm text-destructive/90">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={fetchSubmissions}
                    className="rounded-md bg-destructive/10 px-2 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overview Cards */}
        {analytics && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
              <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">
                  Total Reviews
                </h3>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="p-6 pt-0">
                <div className="text-2xl font-bold">
                  {analytics.total_submissions}
                </div>
                <p className="text-xs text-muted-foreground">
                  All time submissions
                </p>
              </div>
            </div>
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
              <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">
                  Average Rating
                </h3>
                <StarIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="p-6 pt-0">
                <div className="text-2xl font-bold">
                  {analytics.average_rating.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground flex items-center mt-1">
                  <div className="flex text-yellow-500 mr-2">
                    {"★".repeat(Math.round(analytics.average_rating))}
                    <span className="text-muted-foreground/30">
                      {"★".repeat(5 - Math.round(analytics.average_rating))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
              <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Today</h3>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="p-6 pt-0">
                <div className="text-2xl font-bold">
                  {analytics.today_count}
                </div>
                <p className="text-xs text-muted-foreground">
                  Submissions today
                </p>
              </div>
            </div>
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
              <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">
                  This Week
                </h3>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="p-6 pt-0">
                <div className="text-2xl font-bold">
                  {analytics.this_week_count}
                </div>
                <p className="text-xs text-muted-foreground">
                  Submissions last 7 days
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs for Analytics Views */}
        <div className="space-y-4">
          <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <button
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                activeTab === "overview"
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-background/50"
              )}
              onClick={() => setActiveTab("overview")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </button>
            <button
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                activeTab === "trends"
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-background/50"
              )}
              onClick={() => setActiveTab("trends")}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Detailed Analytics
            </button>
          </div>

          <div
            className={activeTab === "overview" ? "block space-y-4" : "hidden"}
          >
            {/* Charts Section */}
            {analytics && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm">
                  <div className="p-6 flex flex-col space-y-3">
                    <h3 className="font-semibold leading-none tracking-tight">
                      Recent Volume
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Daily submission count for the last 7 days.
                    </p>
                  </div>
                  <div className="p-6 pt-0 pl-2">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics.daily_volume}>
                        <XAxis
                          dataKey="date"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) =>
                            new Date(value).toLocaleDateString("en-US", {
                              weekday: "short",
                            })
                          }
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                          itemStyle={{ color: "hsl(var(--foreground))" }}
                          labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ r: 4, fill: "hsl(var(--primary))" }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm">
                  <div className="p-6 flex flex-col space-y-3">
                    <h3 className="font-semibold leading-none tracking-tight">
                      Rating Distribution
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Breakdown of submission ratings.
                    </p>
                  </div>
                  <div className="p-6 pt-0 pl-2">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={analytics.rating_distribution}
                        layout="vertical"
                        margin={{ left: 0 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="rating"
                          type="category"
                          width={30}
                          tickFormatter={(value) => `${value}★`}
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "transparent" }}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                          itemStyle={{ color: "hsl(var(--foreground))" }}
                        />
                        <Bar
                          dataKey="count"
                          fill="hsl(var(--primary))"
                          radius={[0, 4, 4, 0]}
                          barSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className={activeTab === "trends" ? "block space-y-4" : "hidden"}
          >
            {analytics && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <ReviewTrendsChart data={getReviewTrendsData()} />
                  <PriorityDistributionChart
                    data={getPriorityDistributionData()}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <CategoryMetricsChart
                    data={getRatingDistributionData()}
                    title="Rating Distribution"
                    description="Breakdown by star ratings"
                  />
                  <TeamDistributionChart data={getTeamDistributionData()} />
                  <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-2">Quick Stats</h3>
                    <div className="space-y-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Total Submissions
                        </span>
                        <span className="text-2xl font-bold">
                          {analytics.total_submissions}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Average Rating
                        </span>
                        <span className="text-2xl font-bold">
                          {analytics.average_rating.toFixed(1)} ★
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          This Week
                        </span>
                        <span className="text-2xl font-bold">
                          {analytics.this_week_count}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Today
                        </span>
                        <span className="text-2xl font-bold">
                          {analytics.today_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Submissions List */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-col space-y-3">
            <h3 className="font-semibold leading-none tracking-tight">
              Recent Submissions
            </h3>
            <p className="text-sm text-muted-foreground">
              A list of recent reviews and their AI-generated insights.
            </p>
          </div>
          <div className="p-0">
            {loading && (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading...
              </div>
            )}

            {!loading && submissions.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No submissions found</h3>
                <p className="text-muted-foreground mt-1 max-w-sm">
                  No reviews have been submitted yet. New submissions will
                  appear here automatically.
                </p>
              </div>
            )}

            <div className="border-t">
              {submissions.map((item) => (
                <div
                  key={item.id}
                  className="p-6 border-b last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          "flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                          item.rating >= 4
                            ? "bg-green-100 text-green-800"
                            : item.rating === 3
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        )}
                      >
                        {item.rating} ★
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ID: {item.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(item.created_at)}
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="col-span-1 lg:col-span-2 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-1">
                          Customer Review
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.review_text}
                        </p>
                      </div>

                      {item.admin_summary && (
                        <div className="bg-muted/50 p-3 rounded-lg border border-muted">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                            <Users className="h-3 w-3" /> AI Summary
                          </h4>
                          <p className="text-sm text-foreground/90">
                            {item.admin_summary}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="col-span-1">
                      {item.admin_recommended_actions &&
                        item.admin_recommended_actions.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-foreground">
                              Recommended Actions
                            </h4>
                            <div className="space-y-2">
                              {item.admin_recommended_actions.map(
                                (action, idx) => (
                                  <div
                                    key={idx}
                                    className="flex flex-col p-3 rounded-lg border bg-card shadow-sm text-sm"
                                  >
                                    <span className="font-medium text-foreground">
                                      {action.action}
                                    </span>
                                    <div className="flex items-center justify-between mt-2 text-xs">
                                      <span
                                        className={cn(
                                          "px-2 py-0.5 rounded-full font-medium border",
                                          getPriorityColor(action.priority)
                                        )}
                                      >
                                        {action.priority}
                                      </span>
                                      <span className="text-muted-foreground font-medium uppercase tracking-wide text-[10px]">
                                        {action.owner}
                                      </span>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

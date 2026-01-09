"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import { AnimatedStarRating } from "@/components/animated-star-rating";
import { TypewriterText } from "@/components/typewriter-text";
import { CharacterCounter } from "@/components/character-counter";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface SubmissionResponse {
  id: string;
  rating: number;
  review_text: string;
  user_response: string | null;
  admin_summary: string | null;
  admin_recommended_actions: Array<{
    action: string;
    priority: string;
    owner: string;
  }> | null;
  created_at: string;
}

interface Banner {
  type: "success" | "error";
  message: string;
}

export default function Home() {
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [lastSubmission, setLastSubmission] =
    useState<SubmissionResponse | null>(null);
  const [showTypewriter, setShowTypewriter] = useState(false);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);

    if (rating < 1 || rating > 5) {
      setBanner({
        type: "error",
        message: "Please select a rating between 1 and 5",
      });
      return;
    }

    if (!reviewText.trim()) {
      setBanner({ type: "error", message: "Please enter your review" });
      return;
    }

    if (reviewText.length > 2000) {
      setBanner({
        type: "error",
        message: "Review text must be 2000 characters or less",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${apiUrl}/v1/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          review_text: reviewText.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail?.message || `HTTP error! status: ${response.status}`
        );
      }

      const data: SubmissionResponse = await response.json();
      setLastSubmission(data);
      setShowTypewriter(true);
      setBanner({
        type: "success",
        message: "🎉 Review submitted successfully!",
      });

      // Trigger confetti celebration
      triggerConfetti();

      setRating(0);
      setReviewText("");
    } catch (err) {
      setBanner({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to submit review. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted/40">
      {/* Header with Theme Toggle */}
      <div className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 flex h-14 items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="mr-2 h-6 w-6" />
            <h1 className="text-xl font-bold">Fynd Review</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex items-center justify-center p-4 pt-12">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              AI-Powered Feedback
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-foreground">
              Share Your Feedback
            </h2>
            <p className="text-muted-foreground text-lg">
              Your insights help us improve. Get instant AI-powered responses!
            </p>
          </div>

          {banner && (
            <div
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border text-sm font-medium animate-in fade-in slide-in-from-top-2 shadow-lg",
                banner.type === "success"
                  ? "bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-50 dark:border-green-800"
                  : "bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-50 dark:border-red-800"
              )}
            >
              {banner.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              {banner.message}
            </div>
          )}

          <div className="rounded-xl border bg-card text-card-foreground shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-base font-semibold leading-none">
                    How would you rate your experience?
                  </label>
                  <div className="flex justify-center py-4">
                    <AnimatedStarRating value={rating} onChange={setRating} />
                  </div>
                  {rating > 0 && (
                    <p className="text-center text-sm text-muted-foreground animate-in fade-in slide-in-from-top-1">
                      {rating === 5 && "⭐ Excellent!"}
                      {rating === 4 && "😊 Great!"}
                      {rating === 3 && "👍 Good"}
                      {rating === 2 && "😕 Could be better"}
                      {rating === 1 && "😞 Needs improvement"}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-base font-semibold leading-none">
                    Tell us more about your experience
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your thoughts, suggestions, or concerns..."
                    className="min-h-[150px] w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all"
                    maxLength={2000}
                    disabled={submitting}
                  />
                  <CharacterCounter current={reviewText.length} max={2000} />
                </div>

                <button
                  type="submit"
                  disabled={submitting || rating === 0 || !reviewText.trim()}
                  className={cn(
                    "w-full h-12 px-6 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]",
                    "bg-primary text-primary-foreground shadow-lg hover:shadow-xl",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Submit Review
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {lastSubmission && (
            <div className="rounded-xl border bg-card text-card-foreground shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      AI Response Received!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Here's what we think
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        Our Response
                      </p>
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        {showTypewriter ? (
                          <TypewriterText
                            text={
                              lastSubmission.user_response ||
                              "Thank you for your feedback!"
                            }
                            speed={20}
                            onComplete={() => setShowTypewriter(false)}
                          />
                        ) : (
                          lastSubmission.user_response ||
                          "Thank you for your feedback!"
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Rating
                    </span>
                    <div className="flex text-yellow-500 text-lg">
                      {"★".repeat(lastSubmission.rating)}
                      <span className="text-muted-foreground/30">
                        {"★".repeat(5 - lastSubmission.rating)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      ID
                    </span>
                    <span className="font-mono text-sm font-medium text-foreground block">
                      {lastSubmission.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

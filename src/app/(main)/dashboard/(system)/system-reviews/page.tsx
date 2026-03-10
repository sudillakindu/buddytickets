// app/(main)/dashboard/(system)/system-reviews/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import {
  getReviews,
  toggleReviewVisibility,
} from "@/lib/actions/system_reviews-actions";
import type { SystemReview } from "@/lib/types/system";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export default function SystemReviewsPage() {
  const [reviews, setReviews] = useState<SystemReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [visibilityFilter, setVisibilityFilter] = useState<string>("");
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getReviews({
        is_visible:
          visibilityFilter === "" ? undefined : visibilityFilter === "true",
        rating: ratingFilter ? parseInt(ratingFilter, 10) : undefined,
      });
      if (!cancelled) {
        if (result.success && result.data) {
          setReviews(result.data);
        }
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [visibilityFilter, ratingFilter, refreshKey]);

  async function handleToggleVisibility(reviewId: string) {
    setActionLoading(true);
    const result = await toggleReviewVisibility(reviewId);
    if (result.success) {
      Toast("Updated", result.message, "success");
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-primary text-2xl font-semibold text-gray-900">
          Reviews Moderation
        </h1>
        <p className="font-secondary text-sm text-gray-500 mt-1">
          Moderate user reviews across events
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={visibilityFilter}
          onChange={(e) => setVisibilityFilter(e.target.value)}
          className="h-10 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
        >
          <option value="">All Reviews</option>
          <option value="true">Visible</option>
          <option value="false">Hidden</option>
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="h-10 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
        >
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} Star{r !== 1 && "s"}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  User
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Event
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Rating
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Review
                </th>
                <th className="text-center px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Visible
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Date
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : reviews.map((r) => (
                    <tr
                      key={r.review_id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 font-secondary text-gray-900">
                        {r.user_name}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-600 max-w-[150px] truncate">
                        {r.event_name}
                      </td>
                      <td className="px-4 py-3">
                        <StarRating rating={r.rating} />
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-600 max-w-[250px] truncate">
                        {r.review_text || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            handleToggleVisibility(r.review_id)
                          }
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${r.is_visible ? "bg-green-500" : "bg-gray-300"}`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${r.is_visible ? "translate-x-4.5" : "translate-x-0.5"}`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-500 text-xs whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("en-LK", { timeZone: "Asia/Colombo" })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() =>
                            handleToggleVisibility(r.review_id)
                          }
                        >
                          {r.is_visible ? "Hide" : "Show"}
                        </Button>
                      </td>
                    </tr>
                  ))}
              {!loading && reviews.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No reviews found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

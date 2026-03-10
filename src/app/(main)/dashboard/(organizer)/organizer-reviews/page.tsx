// app/(main)/dashboard/(organizer)/organizer-reviews/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { getReviews } from "@/lib/actions/organizer_reviews-actions";
import { getEvents } from "@/lib/actions/organizer_events-actions";
import type {
  OrganizerReview,
  OrganizerEvent,
} from "@/lib/types/organizer_dashboard";

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

export default function OrganizerReviewsPage() {
  const [reviews, setReviews] = useState<OrganizerReview[]>([]);
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [eventFilter, setEventFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  useEffect(() => {
    async function loadEvents() {
      const r = await getEvents({ per_page: 100 });
      if (r.success && r.data) setEvents(r.data);
    }
    loadEvents();
  }, []);

  useEffect(() => {
    async function loadReviews() {
      setLoading(true);
      const r = await getReviews({
        event_id: eventFilter || undefined,
        rating: ratingFilter ? parseInt(ratingFilter, 10) : undefined,
      });
      if (r.success && r.data) setReviews(r.data);
      setLoading(false);
    }
    loadReviews();
  }, [eventFilter, ratingFilter]);

  // Average rating
  const avgRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10,
        ) / 10
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-primary text-2xl font-semibold text-gray-900">
          Reviews
        </h1>
        <p className="font-secondary text-sm text-gray-500 mt-1">
          See what attendees think about your events
        </p>
      </div>

      {avgRating !== null && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm inline-flex items-center gap-3">
          <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
          <div>
            <p className="font-primary text-xl font-semibold text-gray-900">
              {avgRating} / 5
            </p>
            <p className="font-secondary text-xs text-gray-500">
              Average from {reviews.length} review{reviews.length !== 1 && "s"}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="h-10 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
        >
          <option value="">All Events</option>
          {events.map((ev) => (
            <option key={ev.event_id} value={ev.event_id}>
              {ev.name}
            </option>
          ))}
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

      {/* Reviews List */}
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
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array.from({ length: 5 }).map((_, j) => (
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
                      <td className="px-4 py-3 font-secondary text-gray-500 text-xs whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("en-LK", {
                          timeZone: "Asia/Colombo",
                        })}
                      </td>
                    </tr>
                  ))}
              {!loading && reviews.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No reviews yet.
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

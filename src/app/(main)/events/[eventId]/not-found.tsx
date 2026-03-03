// app/(main)/events/[eventId]/not-found.tsx
import Link from "next/link";
import { CalendarX } from "lucide-react";

export default function EventNotFound() {
  return (
    <main className="w-full min-h-[70vh] flex items-center justify-center px-4 bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)]">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-[hsl(270,70%,50%)]/10 flex items-center justify-center mb-6">
          <CalendarX
            className="w-10 h-10 text-[hsl(270,70%,50%)]"
            aria-hidden="true"
          />
        </div>

        <h1 className="font-primary font-black text-3xl sm:text-4xl uppercase text-[hsl(222.2,47.4%,11.2%)] mb-3">
          Event Not Found
        </h1>

        <div className="h-1 w-16 rounded-full mb-5 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />

        <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)] text-base sm:text-lg mb-8 leading-relaxed">
          This event doesn&apos;t exist or may have been removed. Browse our
          other upcoming events below.
        </p>

        <Link
          href="/events"
          className="inline-flex items-center justify-center font-primary font-bold text-sm uppercase tracking-wider text-white bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] px-8 py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(270,70%,50%)]"
        >
          Browse All Events
        </Link>
      </div>
    </main>
  );
}
'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Ticket, ImageOff, Crown } from 'lucide-react';

import { Button } from './button';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ON_SALE'
  | 'SOLD_OUT'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Event {
  event_id: string;
  name: string;
  start_at: string;
  end_at: string;
  location: string;
  primary_image: string;
  category: string;
  start_ticket_price: string;
  status: EventStatus;
  is_vip: boolean;
}

interface StatusUI {
  text: string;
  className: string;
  disabled: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_UI: Record<EventStatus, StatusUI> = {
  ON_SALE: {
    text: 'Book Ticket',
    className:
      'bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] hover:bg-[position:100%_0] transition-[background-position] duration-500',
    disabled: false,
  },
  SOLD_OUT: {
    text: 'Sold Out',
    className: 'bg-[#333333]',
    disabled: true,
  },
  ONGOING: {
    text: 'Live Now',
    className: 'bg-emerald-500',
    disabled: true,
  },
  COMPLETED: {
    text: 'Completed',
    className: 'bg-[#333333]',
    disabled: true,
  },
  CANCELLED: {
    text: 'Cancelled',
    className: 'bg-[#333333]',
    disabled: true,
  },
  DRAFT: {
    text: 'Upcoming',
    className: 'bg-[#C76E00]',
    disabled: true,
  },
  PUBLISHED: {
    text: 'Upcoming',
    className: 'bg-[#C76E00]',
    disabled: true,
  },
};

const FALLBACK_STATUS: StatusUI = {
  text: 'Coming Soon',
  className: 'bg-[#333333]',
  disabled: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusUI(status: EventStatus): StatusUI {
  return STATUS_UI[status] ?? FALLBACK_STATUS;
}

function formatEventDate(isoString: string): { date: string; time: string } {
  const dt = new Date(isoString);
  return {
    date: dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
    time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ImageSectionProps {
  src: string;
  alt: string;
  isHovered: boolean;
  category: string;
  isVip: boolean;
  onError: () => void;
  hasError: boolean;
}

const ImageSection = ({
  src, alt, isHovered, category, isVip, onError, hasError,
}: ImageSectionProps) => (
  <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
    {hasError || !src ? (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2 bg-gray-50">
        <ImageOff className="w-6 h-6" aria-hidden="true" />
        <span className="text-[10px] font-secondary">Image unavailable</span>
      </div>
    ) : (
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        animate={{ scale: isHovered ? 1.05 : 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        loading="lazy"
        onError={onError}
      />
    )}

    {isVip && (
      <div className="absolute top-3 left-3">
        <span className="bg-yellow-400/90 text-yellow-900 px-2 py-1 rounded-lg backdrop-blur-md shadow-sm border border-yellow-300 flex items-center gap-1">
          <Crown className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-wide">VIP</span>
        </span>
      </div>
    )}

    <div className="absolute top-3 right-3">
      <span className="event-category px-2.5 py-1 text-[10px] font-bold bg-white/90 backdrop-blur-md rounded-lg text-[hsl(222.2,47.4%,11.2%)] shadow-sm uppercase tracking-wider">
        {category}
      </span>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const [isHovered, setIsHovered]   = useState(false);
  const [imgError, setImgError]     = useState(false);

  const handleMouseEnter = useCallback(() => setIsHovered(true),  []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleImgError   = useCallback(() => setImgError(true),   []);

  const { date: displayDate, time: displayTime } = formatEventDate(event.start_at);
  const ui = getStatusUI(event.status);

  return (
    <article
      className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ImageSection
        src={event.primary_image}
        alt={`${event.name} cover`}
        isHovered={isHovered}
        category={event.category}
        isVip={event.is_vip}
        onError={handleImgError}
        hasError={imgError}
      />

      <div className="p-4 flex flex-col flex-grow gap-2.5">
        {/* Date & Time */}
        <div className="event-meta flex items-center justify-between w-full text-[hsl(270,70%,50%)] text-[11px] font-medium tracking-tight">
          <div className="flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <time dateTime={event.start_at}>{displayDate}</time>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <time dateTime={event.start_at}>{displayTime}</time>
          </div>
        </div>

        {/* Name & Location */}
        <div className="flex flex-col gap-1">
          <h3 className="event-title text-base font-black text-[hsl(222.2,47.4%,11.2%)] uppercase leading-tight line-clamp-2">
            {event.name}
          </h3>
          <div className="event-location flex items-start gap-1 text-gray-500 text-[11px]">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" aria-hidden="true" />
            <span className="line-clamp-2">{event.location}</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-end justify-between mt-auto pt-3 border-t-2 border-gray-100">
          <div>
            <p className="event-label text-[9px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
              Starting from
            </p>
            <p className="event-price text-base font-bold text-[hsl(222.2,47.4%,11.2%)]">
              {event.start_ticket_price}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Button
          aria-label={`${event.name} — ${ui.text}`}
          disabled={ui.disabled}
          className={[
            'event-button w-full relative overflow-hidden py-3 h-auto rounded-xl',
            'text-xs text-white shadow-md mt-2',
            'transition-all duration-500',
            'group-hover:shadow-lg group-hover:-translate-y-0.5',
            ui.className,
          ].join(' ')}
        >
          <span className="flex items-center justify-center gap-1.5 relative z-10">
            {event.status === 'ON_SALE' && (
              <Ticket className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {ui.text}
          </span>
        </Button>
      </div>
    </article>
  );
};

export default EventCard;
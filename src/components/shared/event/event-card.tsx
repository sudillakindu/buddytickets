// components/shared/event/event-card.tsx
'use client';

import React, { useState, memo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Ticket, ImageOff, Crown } from 'lucide-react';

import { cn } from '@/lib/ui/utils';
import { Button } from '@/components/ui/button';
import type { Event } from '@/lib/types/event';

export interface EventCardProps {
  event: Event;
  index?: number;
}

const formatDate = (iso: string): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const formatTime = (iso: string): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatPrice = (price: number | null): string => {
  if (price === null) return '—';
  if (price === 0) return 'Free';
  return `LKR ${price.toLocaleString()}`;
};

export const EventCard: React.FC<EventCardProps> = memo(({ event, index = 0 }) => {
  const [imgError, setImgError] = useState(false);

  const getStatusUI = () => {
    switch (event.status) {
      case 'ON_SALE': return { text: 'Book Ticket', className: 'bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] hover:bg-[position:100%_0] transition-[background-position] duration-500', disabled: false };
      case 'SOLD_OUT': return { text: 'Sold Out', className: 'bg-[#333333]', disabled: true };
      case 'ONGOING': return { text: 'Live Now', className: 'bg-emerald-500', disabled: true };
      case 'COMPLETED': return { text: 'Completed', className: 'bg-[#333333]', disabled: true };
      case 'CANCELLED': return { text: 'Cancelled', className: 'bg-[#333333]', disabled: true };
      case 'DRAFT': return { text: 'Upcoming', className: 'bg-[#C76E00]', disabled: true };
      case 'PUBLISHED': return { text: 'Upcoming', className: 'bg-[#C76E00]', disabled: true };
      default: return { text: 'Book Ticket', className: 'bg-[#333333]', disabled: false };
    }
  };

  const status = getStatusUI();

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 relative w-full"
    >
      <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
        {imgError || !event.primary_image ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2 bg-gray-50">
            <ImageOff className="w-6 h-6" aria-hidden="true" />
            <span className="text-[10px] font-secondary">Image unavailable</span>
          </div>
        ) : (
          <Image
            src={event.primary_image}
            alt={`${event.name} cover`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized
            className="w-full h-full object-cover transition-transform duration-600 ease-out group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        )}

        {event.is_vip && (
          <div className="absolute top-3 left-3">
            <span className="bg-yellow-400/90 text-yellow-900 px-2 py-1 rounded-lg backdrop-blur-md shadow-sm border border-yellow-300 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-[10px] font-bold uppercase tracking-wide">VIP</span>
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 text-[10px] font-primary font-bold bg-white/90 backdrop-blur-md rounded-lg text-[hsl(222.2,47.4%,11.2%)] shadow-sm uppercase tracking-wider">
            {event.category}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow gap-2.5">
        <div className="flex items-center justify-between w-full font-secondary text-[hsl(270,70%,50%)] text-[11px] font-medium tracking-tight">
          <div className="flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <time dateTime={event.start_at}>{formatDate(event.start_at)}</time>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <time dateTime={event.start_at}>{formatTime(event.start_at)}</time>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="font-primary text-base font-black text-[hsl(222.2,47.4%,11.2%)] uppercase leading-tight line-clamp-2">
            {event.name}
          </h3>
          <div className="font-secondary flex items-start gap-1 text-gray-500 text-[11px]">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" aria-hidden="true" />
            <span className="line-clamp-2">{event.location}</span>
          </div>
        </div>

        <div className="flex items-end justify-between mt-auto pt-3 border-t-2 border-gray-100">
          <div>
            <p className="font-secondary text-[9px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
              Starting from
            </p>
            <p className="font-primary text-base font-bold text-[hsl(222.2,47.4%,11.2%)]">
              {formatPrice(event.start_ticket_price)}
            </p>
          </div>
        </div>

        <Button
          aria-label={`${event.name} — ${status.text}`}
          disabled={status.disabled}
          className={cn(
            'font-primary w-full relative overflow-hidden py-3 h-auto rounded-xl text-xs text-white shadow-md mt-2 transition-all duration-500 group-hover:shadow-lg group-hover:-translate-y-0.5',
            status.className
          )}
        >
          <span className="flex items-center justify-center gap-1.5 relative z-10">
            {event.status === 'ON_SALE' && <Ticket className="w-3.5 h-3.5" aria-hidden="true" />}
            {status.text}
          </span>
        </Button>
      </div>
    </motion.article>
  );
});

EventCard.displayName = 'EventCard';
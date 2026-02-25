'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Ticket, ImageOff, Crown } from 'lucide-react';

import { Button } from './button';

export interface Event {
    event_id: string;
    name: string;
    start_at: string;
    end_at: string;
    location: string;
    primary_image: string;
    category: string;
    start_ticket_price: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ON_SALE' | 'SOLD_OUT' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    is_vip: boolean;
}

function getStatusUI(status: Event['status']) {
    switch (status) {
        case 'ON_SALE':
            return { text: 'Book Ticket', color: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%), hsl(222.2 47.4% 11.2%))', disabled: false };
        case 'SOLD_OUT':
            return { text: 'Sold Out', color: '#333333ff', disabled: true };
        case 'ONGOING':
            return { text: 'Live Now', color: '#10b981', disabled: true };
        case 'COMPLETED':
            return { text: 'Completed', color: '#333333ff', disabled: true };
        case 'CANCELLED':
            return { text: 'Cancelled', color: '#333333ff', disabled: true };
        case 'DRAFT':
        case 'PUBLISHED':
            return { text: 'Upcoming', color: '#C76E00', disabled: true };
        default:
            return { text: 'Coming Soon', color: '#333333ff', disabled: true };
    }
}

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isButtonHovered, setIsButtonHovered] = useState(false);
    const [imgError, setImgError] = useState(false);

    const startDateTime = new Date(event.start_at);
    const displayDate = startDateTime.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
    const displayTime = startDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const ui = getStatusUI(event.status);

    return (
        <article
            className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                {imgError || !event.primary_image ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2 bg-gray-50">
                        <ImageOff className="w-6 h-6" aria-hidden="true" />
                        <span className="text-[10px] font-secondary">Image unavailable</span>
                    </div>
                ) : (
                    <motion.img
                        src={event.primary_image}
                        alt={`${event.name} cover`}
                        className="w-full h-full object-cover"
                        animate={{ scale: isHovered ? 1.05 : 1 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        loading="lazy"
                        onError={() => setImgError(true)}
                    />
                )}

                {event.is_vip && (
                    <div className="absolute top-3 left-3 flex items-center">
                        <span className="bg-yellow-400/90 text-yellow-900 px-2 py-1 rounded-lg backdrop-blur-md shadow-sm border border-yellow-300 flex items-center gap-1">
                            <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">VIP</span>
                        </span>
                    </div>
                )}

                <div className="absolute top-3 right-3 flex items-center">
                    <span className="event-category px-2.5 py-1 text-[10px] font-bold bg-white/90 backdrop-blur-md rounded-lg text-[hsl(222.2,47.4%,11.2%)] shadow-sm uppercase tracking-wider">
                        {event.category}
                    </span>
                </div>
            </div>

            <div className="p-4 flex flex-col flex-grow gap-2.5">
                <div className="event-meta flex items-center justify-between w-full text-[hsl(270,70%,50%)] text-[11px] font-medium tracking-tight">
                    <div className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <time>{displayDate}</time>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <time>{displayTime}</time>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <h3 className="event-title text-base font-black text-[hsl(222.2,47.4%,11.2%)] uppercase leading-tight line-clamp-2">
                        {event.name}
                    </h3>
                    <div className="event-location flex items-start gap-1 text-gray-500 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                        <span className="line-clamp-2">{event.location}</span>
                    </div>
                </div>

                <div className="flex items-end justify-between mt-auto pt-3 border-t-2 border-gray-100">
                    <div>
                        <p className="event-label text-[9px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">Starting from</p>
                        <p className="event-price text-base font-bold text-[hsl(222.2,47.4%,11.2%)]">{event.start_ticket_price}</p>
                    </div>
                </div>

                <Button
                    aria-label={`${event.name} status: ${event.status}`}
                    disabled={ui.disabled}
                    className="event-button w-full relative overflow-hidden py-3 h-auto rounded-xl text-xs text-white shadow-md transition-all group-hover:shadow-lg mt-2 group-hover:-translate-y-0.5"
                    onMouseEnter={() => setIsButtonHovered(true)}
                    onMouseLeave={() => setIsButtonHovered(false)}
                    style={{
                        background: ui.color,
                        backgroundSize: '200% auto',
                        backgroundPosition: isButtonHovered ? '100% 0' : '0 0',
                        transition: 'background-position 0.5s ease',
                    }}
                >
                    <span className="flex items-center justify-center gap-1.5 relative z-10">
                        {event.status === 'ON_SALE' && <Ticket className="w-3.5 h-3.5" aria-hidden="true" />}
                        {ui.text}
                    </span>
                </Button>
            </div>
        </article>
    );
};

export default EventCard;
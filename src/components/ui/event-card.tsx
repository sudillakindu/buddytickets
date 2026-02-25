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
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-[8px] bg-gray-50">
                        <ImageOff className="w-[24px] h-[24px]" aria-hidden="true" />
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
                    <div className="absolute top-[12px] left-[12px] flex items-center">
                        <span className="bg-yellow-400/90 text-yellow-900 px-[8px] py-[4px] rounded-lg backdrop-blur-md shadow-sm border border-yellow-300 flex items-center gap-[4px]">
                            <Crown className="w-[14px] h-[14px]" aria-hidden="true" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">VIP</span>
                        </span>
                    </div>
                )}

                <div className="absolute top-[12px] right-[12px] flex items-center">
                    <span className="event-category px-[10px] py-[4px] text-[10px] font-bold bg-white/90 backdrop-blur-md rounded-lg text-[hsl(222.2,47.4%,11.2%)] shadow-sm uppercase tracking-wider">
                        {event.category}
                    </span>
                </div>
            </div>

            <div className="p-[16px] flex flex-col flex-grow gap-[10px]">
                <div className="event-meta flex items-center justify-between w-full text-[hsl(270,70%,50%)] text-[11px] font-medium tracking-tight">
                    <div className="flex items-center gap-[4px] shrink-0">
                        <Calendar className="w-[14px] h-[14px] shrink-0" aria-hidden="true" />
                        <time>{displayDate}</time>
                    </div>
                    <div className="flex items-center gap-[4px] shrink-0">
                        <Clock className="w-[14px] h-[14px] shrink-0" aria-hidden="true" />
                        <time>{displayTime}</time>
                    </div>
                </div>

                <div className="flex flex-col gap-[4px]">
                    <h3 className="event-title text-[16px] font-black text-[hsl(222.2,47.4%,11.2%)] uppercase leading-tight line-clamp-2">
                        {event.name}
                    </h3>
                    <div className="event-location flex items-start gap-[4px] text-gray-500 text-[11px]">
                        <MapPin className="w-[14px] h-[14px] mt-[2px] flex-shrink-0 text-gray-400" aria-hidden="true" />
                        <span className="line-clamp-2">{event.location}</span>
                    </div>
                </div>

                <div className="flex items-end justify-between mt-auto pt-[12px] border-t-2 border-gray-100">
                    <div>
                        <p className="event-label text-[9px] uppercase tracking-wide text-gray-400 font-semibold mb-[2px]">Starting from</p>
                        <p className="event-price text-[16px] font-bold text-[hsl(222.2,47.4%,11.2%)]">{event.start_ticket_price}</p>
                    </div>
                </div>

                <Button
                    aria-label={`${event.name} status: ${event.status}`}
                    disabled={ui.disabled}
                    className="event-button w-full relative overflow-hidden py-[12px] h-auto rounded-xl text-[12px] text-white shadow-md transition-all group-hover:shadow-lg mt-[8px] group-hover:-translate-y-0.5"
                    onMouseEnter={() => setIsButtonHovered(true)}
                    onMouseLeave={() => setIsButtonHovered(false)}
                    style={{
                        background: ui.color,
                        backgroundSize: '200% auto',
                        backgroundPosition: isButtonHovered ? '100% 0' : '0 0',
                        transition: 'background-position 0.5s ease',
                    }}
                >
                    <span className="flex items-center justify-center gap-[6px] relative z-10">
                        {event.status === 'ON_SALE' && <Ticket className="w-[14px] h-[14px]" aria-hidden="true" />}
                        {ui.text}
                    </span>
                </Button>
            </div>
        </article>
    );
};

export default EventCard;
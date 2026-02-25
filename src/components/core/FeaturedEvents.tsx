'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight, CalendarX, Loader2 } from 'lucide-react';

import { MOCK_EVENTS } from '@/lib/api/event';
import { Button } from '@/components/ui/button';
import EventCard, { type Event } from '@/components/ui/event-card';
import { Toast } from '@/components/ui/toast';

interface SectionHeaderProps {
    highlight: string;
    title: string;
    link: string;
}

function SectionHeader({ highlight, title, link }: SectionHeaderProps) {
    const router = useRouter();

    return (
        <div className="flex flex-row items-center justify-between mb-[32px]">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="font-primary font-semibold text-[30px] text-[hsl(222.2,47.4%,11.2%)]">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
                        {highlight}
                    </span>{' '}
                    {title}
                </h2>
                <div className="h-[6px] w-[96px] bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] rounded-full mt-[8px]" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="self-center"
            >
                <Button
                    variant="ghost"
                    onClick={() => router.push(link)}
                    className="font-secondary group flex items-center gap-[4px] text-[14px] font-semibold text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(270,70%,50%)] hover:bg-transparent transition-colors p-0 h-auto"
                >
                    View All
                    <ChevronRight className="w-[16px] h-[16px] group-hover:translate-x-1 transition-transform" />
                </Button>
            </motion.div>
        </div>
    );
}

export default function FeaturedEvents() {
    const [eventsList, setEventsList] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHighlights = async () => {
            setIsLoading(true);
            try {
                await new Promise((resolve) => setTimeout(resolve, 400));
                setEventsList(MOCK_EVENTS);
            } catch {
                Toast('Connection Error', 'Something went wrong while connecting to the server.', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchHighlights();
    }, []);

    const activeEvents = useMemo(
        () => eventsList.filter(e => ['ON_SALE', 'PUBLISHED', 'ONGOING'].includes(e.status)),
        [eventsList]
    );
    const upcomingEvents = useMemo(
        () => eventsList.filter(e => e.status === 'DRAFT'),
        [eventsList]
    );

    return (
        <section id="events" className="py-[80px] relative overflow-hidden bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[-5%] w-[300px] h-[300px] bg-[hsl(222.2,47.4%,11.2%)]/5 rounded-full blur-[80px]" />
                <div className="absolute bottom-[20%] right-[-5%] w-[300px] h-[300px] bg-[hsl(270,70%,50%)]/5 rounded-full blur-[80px]" />
            </div>

            <div className="max-w-[1280px] mx-auto px-[16px] relative z-10 space-y-16 [&_.event-title]:font-primary [&_.event-category]:font-primary [&_.event-price]:font-primary [&_.event-button]:font-primary [&_.event-meta]:font-secondary [&_.event-overlay]:font-secondary [&_.event-location]:font-secondary [&_.event-label]:font-secondary">

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-[80px] text-[hsl(215.4,16.3%,46.9%)]">
                        <Loader2
                            className="w-[32px] h-[32px] animate-spin relative z-10"
                            style={{ color: 'hsl(270,70%,50%)' }}
                        />
                    </div>
                ) : eventsList.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-[80px] text-center"
                    >
                        <CalendarX className="w-[64px] h-[64px] mb-[16px] text-[hsl(215.4,16.3%,46.9%)] opacity-50" />
                        <h3 className="font-primary text-[24px] font-semibold text-[hsl(222.2,47.4%,11.2%)] mb-[8px]">No Events Right Now</h3>
                        <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)] max-w-[448px]">
                            We&apos;re currently planning our next exciting events. Check back soon!
                        </p>
                    </motion.div>
                ) : (
                    <>
                        {activeEvents.length > 0 && (
                            <div>
                                <SectionHeader highlight="Latest" title="Events" link="/events?filter=latest" />
                                <div className="grid grid-cols-4 gap-[24px]">
                                    {activeEvents.map((event, index) => (
                                        <motion.div
                                            key={event.event_id || index}
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                        >
                                            <EventCard event={event} />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {upcomingEvents.length > 0 && (
                            <div>
                                <SectionHeader highlight="Upcoming" title="Events" link="/events?filter=upcoming" />
                                <div className="grid grid-cols-3 gap-[24px]">
                                    {upcomingEvents.map((event, index) => (
                                        <motion.div
                                            key={event.event_id || index}
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                        >
                                            <EventCard event={event} />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
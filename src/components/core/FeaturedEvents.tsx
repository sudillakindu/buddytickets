"use client";

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

import { MOCK_EVENTS } from '@/lib/api/event';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import EventCard, { type Event } from '@/components/ui/event-card';

interface SectionHeaderProps {
    highlight: string;
    title: string;
}

const SectionHeader = ({ highlight, title }: SectionHeaderProps) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 md:mb-10 gap-4">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="font-primary font-semibold text-3xl md:text-4xl text-[hsl(222.2,47.4%,11.2%)]">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
                        {highlight}
                    </span>{' '}
                    {title}
                </h2>
                <div className="h-1.5 w-24 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] rounded-full mt-2" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="self-start sm:self-auto"
            >
                <Button
                    variant="ghost"
                    onClick={() => Toast('Feature Coming Soon', 'Full event listing is launching soon. Stay tuned!', 'warning')}
                    className="font-secondary group flex items-center gap-1 text-sm font-semibold text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(270,70%,50%)] hover:bg-transparent transition-colors p-0 h-auto"
                >
                    View All
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
            </motion.div>
        </div>
    );
};

export default function FeaturedEvents() {
    // ON_SALE and ONGOING events are currently active; PUBLISHED events are announced but not yet on sale
    const activeEvents = MOCK_EVENTS.filter((event: Event) => ['ON_SALE', 'ONGOING'].includes(event.status));
    const upcomingEvents = MOCK_EVENTS.filter((event: Event) => event.status === 'PUBLISHED');

    return (
        <section id="events" className="py-20 md:py-32 relative overflow-hidden bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[-5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[hsl(222.2,47.4%,11.2%)]/5 rounded-full blur-[80px] md:blur-[100px]" />
                <div className="absolute bottom-[20%] right-[-5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[hsl(270,70%,50%)]/5 rounded-full blur-[80px] md:blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16 md:space-y-24 [&_.event-title]:font-primary [&_.event-category]:font-primary [&_.event-price]:font-primary [&_.event-button]:font-primary [&_.event-meta]:font-secondary [&_.event-overlay]:font-secondary [&_.event-location]:font-secondary [&_.event-label]:font-secondary">

                {activeEvents.length > 0 && (
                    <div>
                        <SectionHeader highlight="Latest" title="Events" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                            {activeEvents.map((event, index) => (
                                <motion.div
                                    key={event.event_id}
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
                        <SectionHeader highlight="Upcoming" title="Events" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                            {upcomingEvents.map((event, index) => (
                                <motion.div
                                    key={event.event_id}
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
            </div>
        </section>
    );
}
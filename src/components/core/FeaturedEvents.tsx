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
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between mb-5 sm:mb-7 lg:mb-10 gap-4 sm:gap-6 lg:gap-8 w-full text-center sm:text-left">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center sm:items-start"
            >
                <h2 className="font-primary font-semibold text-xl sm:text-2xl lg:text-4xl text-[hsl(222.2,47.4%,11.2%)]">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
                        {highlight}
                    </span>{' '}
                    {title}
                </h2>
                <div className="h-1 sm:h-1.5 lg:w-40 w-20 sm:w-28 lg:h-2 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] rounded-full mt-2 sm:mt-3 lg:mt-4" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex justify-center items-center"
            >
                <Button
                    variant="ghost"
                    onClick={() => Toast('Feature Coming Soon', 'Full event listing is launching soon. Stay tuned!', 'warning')}
                    className="font-secondary group flex items-center justify-center gap-1.5 sm:gap-2 lg:gap-3 text-[11px] sm:text-sm lg:text-base font-semibold text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(270,70%,50%)] hover:bg-transparent transition-colors p-0 h-auto"
                >
                    View All
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 group-hover:translate-x-2 transition-transform" />
                </Button>
            </motion.div>
        </div>
    );
};

export default function FeaturedEvents() {
    const activeEvents = MOCK_EVENTS.filter((event: Event) => ['ON_SALE', 'ONGOING'].includes(event.status));
    const upcomingEvents = MOCK_EVENTS.filter((event: Event) => event.status === 'PUBLISHED');

    return (
        <section 
            id="events" 
            className="min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] flex flex-col justify-center items-center py-10 sm:py-16 lg:py-24 relative overflow-hidden bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)]"
        >
            <div className="absolute inset-0 overflow-hidden pointer-events-none flex justify-center items-center">
                <div className="absolute top-[20%] left-[-5%] w-[300px] sm:w-[500px] lg:w-[700px] h-[300px] sm:h-[500px] lg:h-[700px] bg-[hsl(222.2,47.4%,11.2%)]/5 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[140px]" />
                <div className="absolute bottom-[20%] right-[-5%] w-[300px] sm:w-[500px] lg:w-[700px] h-[300px] sm:h-[500px] lg:h-[700px] bg-[hsl(270,70%,50%)]/5 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[140px]" />
            </div>

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col justify-center items-center space-y-12 sm:space-y-16 lg:space-y-24 [&_.event-title]:font-primary [&_.event-category]:font-primary [&_.event-price]:font-primary [&_.event-button]:font-primary [&_.event-meta]:font-secondary [&_.event-overlay]:font-secondary [&_.event-location]:font-secondary [&_.event-label]:font-secondary">
                {activeEvents.length > 0 && (
                    <div className="w-full flex flex-col justify-center items-center">
                        <SectionHeader highlight="Latest" title="Events" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-14 w-full justify-items-center">
                            {activeEvents.map((event, index) => (
                                <motion.div
                                    key={event.event_id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="w-full flex justify-center"
                                >
                                    <EventCard event={event} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {upcomingEvents.length > 0 && (
                    <div className="w-full flex flex-col justify-center items-center">
                        <SectionHeader highlight="Upcoming" title="Events" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-14 w-full justify-items-center">
                            {upcomingEvents.map((event, index) => (
                                <motion.div
                                    key={event.event_id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="w-full flex justify-center"
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
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin, ArrowRight } from 'lucide-react';

import LogoSrc from '@/app/assets/images/logo/upscale_media_logo.png';

// --- Types & Constants ---
type SocialLink = { icon: React.ElementType; href: string; label: string };
type NavLink = { href: string; label: string };

const CURRENT_YEAR = new Date().getFullYear();

const SOCIAL_LINKS: SocialLink[] = [
  { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
];

const QUICK_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/organizers', label: 'Organizers' },
  { href: '/about', label: 'About Us' },
];

const LEGAL_LINKS: NavLink[] = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/refunds', label: 'Refund Policy' },
];

const STYLES = {
  textPrimary: 'text-[hsl(222.2,47.4%,11.2%)]',
  textMuted: 'text-[hsl(215.4,16.3%,46.9%)]',
  textAccent: 'text-[hsl(270,70%,50%)]',
  hoverAccent: 'hover:text-[hsl(270,70%,50%)]',
};

// --- Subcomponents ---
const FooterNavGroup = ({ title, links, delay }: { title: string; links: NavLink[]; delay: number }) => (
  <motion.nav
    className="space-y-4 flex flex-col items-start text-left"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    aria-label={`${title} links`}
  >
    <h3 className={`font-primary text-base font-bold ${STYLES.textPrimary}`}>
      {title}
    </h3>
    <ul className="space-y-2.5 text-sm w-full" role="list">
      {links.map(({ href, label }) => (
        <motion.li
          key={label}
          whileHover={{ x: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="flex justify-start"
        >
          <Link
            href={href}
            className={`font-secondary ${STYLES.textMuted} ${STYLES.hoverAccent} transition-colors flex items-center gap-2 group`}
          >
            <ArrowRight className={`w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 ${STYLES.textAccent}`} />
            {label}
          </Link>
        </motion.li>
      ))}
    </ul>
  </motion.nav>
);

const ContactItem = ({ icon: Icon, text, href }: { icon: React.ElementType; text: string; href?: string }) => {
  const content = (
    <>
      <div className={`w-8 h-8 rounded-lg bg-[hsl(222.2,47.4%,11.2%)]/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(270,70%,50%)]/10 transition-colors`}>
        <Icon className={`w-4 h-4 ${STYLES.textPrimary} group-hover:text-[hsl(270,70%,50%)] transition-colors`} />
      </div>
      <span className={`font-secondary ${STYLES.textMuted} ${href ? STYLES.hoverAccent : ''} transition-colors text-left text-sm`}>
        {text}
      </span>
    </>
  );

  return (
    <motion.li
      className="flex flex-row items-center justify-start gap-3 group"
      whileHover={{ x: 5 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {href ? <a href={href} className="flex items-center gap-3">{content}</a> : <div className="flex items-center gap-3">{content}</div>}
    </motion.li>
  );
};

// --- Main Component ---
export function Footer() {
  return (
    <footer
      className="bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pt-16 pb-8 border-t border-[hsl(222.2,47.4%,11.2%)]/5"
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-[1.7fr_1fr_1fr_1.5fr] gap-12 mb-12">

          {/* Brand & Socials */}
          <motion.div
            className="space-y-5 flex flex-col items-start text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Link href="/" className="flex items-center gap-2.5 group" aria-label="BuddyTickets Home">
              <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.95 }} className="relative">
                <Image
                  src={LogoSrc}
                  alt="BuddyTickets Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain drop-shadow-sm"
                />
              </motion.div>
              <span className="font-special transition-all duration-500 text-xl text-transparent bg-clip-text bg-[linear-gradient(to_right,hsl(222.2,47.4%,11.2%),hsl(270,70%,50%),hsl(222.2,47.4%,11.2%))] bg-[length:200%_auto] bg-[position:0_0] group-hover:bg-[position:100%_0]">
                BuddyTickets
              </span>
            </Link>

            <p className={`font-secondary ${STYLES.textMuted} text-sm leading-relaxed max-w-none`}>
              Your premier platform for discovering, creating, and managing events in Sri Lanka.
              Connect with experiences that matter.
            </p>

            <div className="flex space-x-3 pt-1 justify-start w-full" role="list" aria-label="Social media links">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }, index) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center ${STYLES.textMuted} ${STYLES.hoverAccent} hover:border-[hsl(270,70%,50%)]/20 transition-colors`}
                  aria-label={`Follow us on ${label}`}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links */}
          <FooterNavGroup title="Quick Links" links={QUICK_LINKS} delay={0.1} />
          <FooterNavGroup title="Legal" links={LEGAL_LINKS} delay={0.2} />

          {/* Contact Info */}
          <motion.div
            className="space-y-4 flex flex-col items-start text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            aria-label="Contact information"
          >
            <h3 className={`font-primary text-base font-bold ${STYLES.textPrimary}`}>
              Contact Info
            </h3>
            <ul className="space-y-3 text-sm w-full" role="list">
              <ContactItem icon={MapPin} text="Buddy Tickets, Matara, Sri Lanka" />
              <ContactItem icon={Phone} text="+94 72 33 56 907" href="tel:+94763356907" />
              <ContactItem icon={Mail} text="info@buddytickets.lk" href="mailto:info@buddyticket.lk" />
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          className="border-t border-gray-200/60 pt-4 flex flex-row justify-between items-center gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className={`font-secondary text-sm ${STYLES.textMuted} text-left`}>
            © {CURRENT_YEAR} BuddyTickets. All rights reserved.
          </p>
          <p className={`font-secondary text-sm ${STYLES.textMuted} text-right flex flex-row items-center justify-end gap-1`}>
            Digitally crafted by{' '}
            <a
              href="https://sudillakindu.online"
              target="_blank"
              rel="noopener noreferrer"
              className={`font-semibold ${STYLES.textPrimary} ${STYLES.hoverAccent} transition-colors`}
            >
              Sudil Lakindu M. Arachchi
            </a>
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
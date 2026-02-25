'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin, ArrowRight } from 'lucide-react';

import LogoSrc from '@/app/assets/images/logo/upscale_media_logo.png';

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

export function Footer() {
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  return (
    <footer
      className="bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pt-12 pb-6 border-t border-[hsl(222.2,47.4%,11.2%)]/5"
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand Col */}
          <motion.div
            className="space-y-5 flex flex-col items-start text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Link
              href="/"
              className="flex items-center gap-2.5 text-lg group"
              aria-label="BuddyTicket.lk Home"
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Image
                  src={LogoSrc}
                  alt="BuddyTicket.lk Logo"
                  width={40}
                  height={40}
                  className="w-9 h-9 object-contain drop-shadow-sm"
                />
              </motion.div>
              <span
                className="font-special transition-all duration-300 text-lg"
                style={{
                  backgroundImage: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%), hsl(222.2 47.4% 11.2%))',
                  backgroundSize: '200% auto',
                  backgroundPosition: isLogoHovered ? '100% 0' : '0 0',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                BuddyTickets
              </span>
            </Link>

            <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)] text-xs leading-relaxed">
              Your premier platform for discovering, creating, and managing events in Sri Lanka.
              Connect with experiences that matter.
            </p>

            <div
              className="flex space-x-3 pt-1 justify-start w-full"
              role="list"
              aria-label="Social media links"
            >
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }, index) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(270,70%,50%)] hover:border-[hsl(270,70%,50%)]/20 transition-colors"
                  aria-label={`Follow us on ${label}`}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Nav Cols */}
          <motion.nav
            className="space-y-4 flex flex-col items-start text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            aria-label="Quick links"
          >
            <h3 className="font-primary text-sm font-bold text-[hsl(222.2,47.4%,11.2%)]">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-xs w-full" role="list">
              {QUICK_LINKS.map(({ href, label }) => (
                <motion.li
                  key={label}
                  whileHover={{ x: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="flex justify-start"
                >
                  <Link
                    href={href}
                    className="font-secondary text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(270,70%,50%)] transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-[hsl(270,70%,50%)]" />
                    {label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.nav>

          <motion.nav
            className="space-y-4 flex flex-col items-start text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            aria-label="Legal links"
          >
            <h3 className="font-primary text-sm font-bold text-[hsl(222.2,47.4%,11.2%)]">
              Legal
            </h3>
            <ul className="space-y-2.5 text-xs w-full" role="list">
              {LEGAL_LINKS.map(({ href, label }) => (
                <motion.li
                  key={label}
                  whileHover={{ x: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="flex justify-start"
                >
                  <Link
                    href={href}
                    className="font-secondary text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(270,70%,50%)] transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-[hsl(270,70%,50%)]" />
                    {label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.nav>

          {/* Contact Col */}
          <motion.div
            className="space-y-4 flex flex-col items-start text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            aria-label="Contact information"
          >
            <h3 className="font-primary text-sm font-bold text-[hsl(222.2,47.4%,11.2%)]">
              Contact Info
            </h3>
            <ul className="space-y-3 text-xs w-full" role="list">
              <motion.li
                className="flex flex-row items-center justify-start gap-3 group"
                whileHover={{ x: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="w-7 h-7 rounded-lg bg-[hsl(222.2,47.4%,11.2%)]/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(270,70%,50%)]/10 transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-[hsl(222.2,47.4%,11.2%)] group-hover:text-[hsl(270,70%,50%)] transition-colors" />
                </div>
                <span className="font-secondary text-[hsl(215.4,16.3%,46.9%)] text-left">
                  Buddy Ticket, Matara, Sri Lanka
                </span>
              </motion.li>

              <motion.li
                className="flex flex-row items-center justify-start gap-3 group"
                whileHover={{ x: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="w-7 h-7 rounded-lg bg-[hsl(222.2,47.4%,11.2%)]/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(270,70%,50%)]/10 transition-colors">
                  <Phone className="w-3.5 h-3.5 text-[hsl(222.2,47.4%,11.2%)] group-hover:text-[hsl(270,70%,50%)] transition-colors" />
                </div>
                <a
                  href="tel:+94763356907"
                  className="font-secondary text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(270,70%,50%)] transition-colors text-left"
                >
                  +94 72 33 56 907
                </a>
              </motion.li>

              <motion.li
                className="flex flex-row items-center justify-start gap-3 group"
                whileHover={{ x: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="w-7 h-7 rounded-lg bg-[hsl(222.2,47.4%,11.2%)]/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(270,70%,50%)]/10 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-[hsl(222.2,47.4%,11.2%)] group-hover:text-[hsl(270,70%,50%)] transition-colors" />
                </div>
                <a
                  href="mailto:info@buddyticket.lk"
                  className="font-secondary text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(270,70%,50%)] transition-colors text-left"
                >
                  info@buddyticket.lk
                </a>
              </motion.li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          className="border-t border-gray-200/60 pt-5 flex flex-col md:flex-row justify-between items-center gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] text-center">
            © {CURRENT_YEAR} BuddyTickets. All rights reserved.
          </p>
          <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] text-center flex flex-row items-center gap-1">
            Digitally crafted by{' '}
            <a
              href="https://sudillakindu.online"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[hsl(222.2,47.4%,11.2%)] hover:text-[hsl(270,70%,50%)] transition-colors"
            >
              Sudil Lakindu M. Arachchi
            </a>
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
'use client';

import React from 'react';
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Button } from './button';

type Variant = 'default' | 'success' | 'error' | 'warning';
type Position = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

interface ToastOptions {
  duration?: number;
  position?: Position;
  action?: ActionButton;
  onDismiss?: () => void;
  highlightTitle?: boolean;
}

const variantStyles: Record<Variant, string> = {
  default: 'bg-white border-gray-200 text-gray-900',
  success: 'bg-white border-green-600/30 text-gray-900',
  error: 'bg-white border-red-500/30 text-gray-900',
  warning: 'bg-white border-amber-500/30 text-gray-900',
};

const titleColor: Record<Variant, string> = {
  default: 'text-gray-900',
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-amber-600',
};

const iconColor: Record<Variant, string> = {
  default: 'text-gray-500',
  success: 'text-green-600',
  error: 'text-red-500',
  warning: 'text-amber-500',
};

const variantIcons: Record<Variant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
};

const toastAnimation = {
  initial: { opacity: 0, y: -16, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.96 },
};

interface ToasterProps {
  defaultPosition?: Position;
}

export const Toaster: React.FC<ToasterProps> = ({ defaultPosition = 'top-right' }) => (
  <SonnerToaster
    position={defaultPosition}
    expand={false}
    visibleToasts={3}
    gap={8}
    style={{ zIndex: 9999 }}
    toastOptions={{
      unstyled: true,
      className: 'flex justify-end w-full mb-[8px]',
    }}
  />
);

export const Toast = (
  title: string,
  message: string,
  variant: Variant = 'default',
  options?: ToastOptions
): void => {
  const {
    duration = 4000,
    position,
    action,
    onDismiss,
    highlightTitle,
  } = options ?? {};

  const Icon = variantIcons[variant];

  sonnerToast.custom(
    (toastId) => (
      <motion.div
        variants={toastAnimation}
        initial="initial"
        animate="animate"
        exit="exit"
        layout
        transition={{ duration: 0.28, type: 'spring', stiffness: 220, damping: 22 }}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className={cn(
          'flex items-start w-[420px] p-[16px] rounded-xl border shadow-xl backdrop-blur-md bg-white/95 select-none pointer-events-auto',
          variantStyles[variant]
        )}
      >
        <div className="flex-shrink-0 pt-[2px]" aria-hidden="true">
          <Icon className={cn('h-[20px] w-[20px]', iconColor[variant])} />
        </div>

        <div className="flex-1 ml-[12px] mr-[8px] space-y-[2px]">
          {title && (
            <h3
              className={cn(
                'font-primary text-[14px] leading-tight',
                highlightTitle ? 'text-green-600' : titleColor[variant]
              )}
            >
              {title}
            </h3>
          )}
          <p className="font-secondary text-[14px] text-gray-600 leading-snug opacity-90">
            {message}
          </p>
        </div>

        <div className="flex flex-col gap-[8px] items-end flex-shrink-0 ml-[4px]">
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => {
              sonnerToast.dismiss(toastId);
              onDismiss?.();
            }}
            className="p-[4px] rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-[16px] w-[16px]" />
          </button>

          {action?.label && (
            <Button
              variant={action.variant ?? 'outline'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
                sonnerToast.dismiss(toastId);
              }}
              className="text-[12px] h-[28px] px-[12px] mt-[4px]"
            >
              {action.label}
            </Button>
          )}
        </div>
      </motion.div>
    ),
    { duration, position }
  );
};
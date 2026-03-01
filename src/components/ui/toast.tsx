'use client';

import React from 'react';
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X, LucideIcon } from 'lucide-react';

import { cn } from '@/lib/ui/utils';
import { Button } from './button';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

export interface ToastOptions {
  duration?: number;
  position?: ToastPosition;
  action?: ActionButton;
  onDismiss?: () => void;
  highlightTitle?: boolean;
}

export interface ToasterProps {
  defaultPosition?: ToastPosition;
}

const VARIANT_CONTAINER: Record<ToastVariant, string> = {
  default: 'bg-white border-gray-200 text-gray-900',
  success: 'bg-white border-green-600/30 text-gray-900',
  error: 'bg-white border-red-500/30 text-gray-900',
  warning: 'bg-white border-amber-500/30 text-gray-900',
};

const VARIANT_TITLE: Record<ToastVariant, string> = {
  default: 'text-gray-900',
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-amber-600',
};

const VARIANT_ICON: Record<ToastVariant, string> = {
  default: 'text-gray-500',
  success: 'text-green-600',
  error: 'text-red-500',
  warning: 'text-amber-500',
};

const VARIANT_ICONS: Record<ToastVariant, LucideIcon> = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
};

const TOAST_ANIMATION = {
  initial: { opacity: 0, y: -16, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.96 },
} as const;

const TOAST_TRANSITION = {
  duration: 0.28,
  type: 'spring',
  stiffness: 220,
  damping: 22,
} as const;

const Toaster: React.FC<ToasterProps> = React.memo(({ defaultPosition = 'top-right' }) => {
  return (
    <SonnerToaster
      position={defaultPosition}
      expand={false}
      visibleToasts={3}
      gap={8}
      style={{ zIndex: 9999 }}
      toastOptions={{
        unstyled: true,
        className: 'flex justify-end w-full mb-2',
      }}
    />
  );
});

Toaster.displayName = 'Toaster';

const Toast = (
  title: string,
  message: string,
  variant: ToastVariant = 'default',
  options?: ToastOptions
): void => {
  const {
    duration = 4000,
    position,
    action,
    onDismiss,
    highlightTitle,
  } = options ?? {};

  const Icon = VARIANT_ICONS[variant];

  sonnerToast.custom(
    (toastId) => (
      <motion.div
        variants={TOAST_ANIMATION}
        initial="initial"
        animate="animate"
        exit="exit"
        layout
        transition={TOAST_TRANSITION}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className={cn(
          'flex items-start w-[min(420px,calc(100vw-2rem))] p-4 rounded-xl border shadow-xl backdrop-blur-md bg-white/95 select-none pointer-events-auto',
          VARIANT_CONTAINER[variant]
        )}
      >
        <div className="flex-shrink-0 pt-0.5" aria-hidden="true">
          <Icon className={cn('h-5 w-5', VARIANT_ICON[variant])} />
        </div>

        <div className="flex-1 ml-3 mr-2 space-y-0.5">
          {title && (
            <h3
              className={cn(
                'font-primary text-sm leading-tight',
                highlightTitle ? 'text-green-600' : VARIANT_TITLE[variant]
              )}
            >
              {title}
            </h3>
          )}
          <p className="font-secondary text-sm text-gray-600 leading-snug opacity-90">
            {message}
          </p>
        </div>

        <div className="flex flex-col gap-2 items-end flex-shrink-0 ml-1">
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => {
              sonnerToast.dismiss(toastId);
              onDismiss?.();
            }}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
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
              className="text-xs h-7 px-3 mt-1"
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

export { Toaster, Toast };
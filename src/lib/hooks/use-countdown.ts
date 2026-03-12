// lib/hooks/use-countdown.ts
"use client";

import { useState, useEffect, useCallback } from "react";

export function useCountdown(expiresAt: string) {
  const calc = useCallback(
    () => Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
    [expiresAt]
  );

  const [secondsLeft, setSecondsLeft] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = secondsLeft < 120;
  const isExpired = secondsLeft === 0;

  return { mins, secs, isUrgent, isExpired, secondsLeft };
}

"use client";

import { useEffect, useState } from "react";

export function useServerClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    let offset = 0;

    fetch("/api/get/server-time")
    .then(res => res.json())
    .then(data => {
        offset = data.serverTime - Date.now();
        setTime(new Date(Date.now() + offset));
    });

    const interval = setInterval(() => {
        setTime(new Date(Date.now() + offset));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return time;
}

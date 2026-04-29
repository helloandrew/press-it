"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { TAGLINES } from "@/lib/taglines";
import { getOrCreateUserUuid } from "@/lib/user";

type Stats = {
  today: number;
  allTime: number;
  globalTotal: number;
};

type BumpState = {
  today: boolean;
  allTime: boolean;
  globalTotal: boolean;
};

const INITIAL_STATS: Stats = { today: 0, allTime: 0, globalTotal: 0 };

function getNextThreshold() {
  return Math.floor(Math.random() * 3) + 3;
}

function playClickSound() {
  try {
    const AudioContextCtor = window.AudioContext;

    if (!AudioContextCtor) {
      return;
    }

    const ctx = new AudioContextCtor();
    const bufferSize = Math.floor(ctx.sampleRate * 0.025);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 4 - 1) * Math.pow(1 - i / bufferSize, 10);
    }

    const source = ctx.createBufferSource();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    source.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = 1800;
    source.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.7, ctx.currentTime);
    source.start();
    source.onended = () => {
      void ctx.close().catch(() => undefined);
    };
  } catch {
    // silently ignore if audio context is blocked
  }
}

function getNextTaglineIndex(currentIndex: number) {
  if (TAGLINES.length <= 1) {
    return currentIndex;
  }

  let nextIndex = currentIndex;
  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * TAGLINES.length);
  }

  return nextIndex;
}

function CounterNumber({ value, bump }: { value: number; bump: boolean }) {
  return (
    <span
      className={`inline-block font-extrabold transition-transform duration-150 ${
        bump ? "scale-[1.02]" : "scale-100"
      }`}
    >
      {value.toLocaleString()}
    </span>
  );
}

export default function Home() {
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [bumps, setBumps] = useState<BumpState>({
    today: false,
    allTime: false,
    globalTotal: false,
  });
  const userUuidRef = useRef<string | null>(null);
  const pressCountSinceRotationRef = useRef(0);
  const nextRotationThresholdRef = useRef(getNextThreshold());
  const statsRef = useRef<Stats>(INITIAL_STATS);

  const tagline = useMemo(() => TAGLINES[taglineIndex], [taglineIndex]);

  async function syncStats(userUuid: string) {
    const params = new URLSearchParams({
      userUuid,
      tzOffsetMinutes: String(new Date().getTimezoneOffset()),
    });

    const response = await fetch(`/api/stats?${params.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch stats");
    }

    const payload = (await response.json()) as { ok: boolean; stats: Stats };

    if (!payload.ok) {
      throw new Error("Stats API returned failure");
    }

    statsRef.current = payload.stats;
    setStats(payload.stats);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      const userUuid = getOrCreateUserUuid();
      userUuidRef.current = userUuid;

      try {
        const params = new URLSearchParams({
          userUuid,
          tzOffsetMinutes: String(new Date().getTimezoneOffset()),
        });

        const response = await fetch(`/api/stats?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }

        const payload = (await response.json()) as { ok: boolean; stats: Stats };

        if (!cancelled && payload.ok) {
          statsRef.current = payload.stats;
          setStats(payload.stats);
        }
      } catch (error) {
        console.error("Unable to load stats", error);
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bumps.today && !bumps.allTime && !bumps.globalTotal) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setBumps({ today: false, allTime: false, globalTotal: false });
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [bumps]);

  function rotateTaglineIfNeeded() {
    pressCountSinceRotationRef.current += 1;

    if (pressCountSinceRotationRef.current < nextRotationThresholdRef.current) {
      return;
    }

    pressCountSinceRotationRef.current = 0;
    nextRotationThresholdRef.current = getNextThreshold();
    setTaglineIndex((current) => getNextTaglineIndex(current));
  }

  async function handlePress() {
    playClickSound();

    const userUuid = userUuidRef.current ?? getOrCreateUserUuid();
    userUuidRef.current = userUuid;

    const optimisticStats = {
      today: statsRef.current.today + 1,
      allTime: statsRef.current.allTime + 1,
      globalTotal: statsRef.current.globalTotal + 1,
    };

    statsRef.current = optimisticStats;
    setStats(optimisticStats);
    setBumps({ today: true, allTime: true, globalTotal: true });
    rotateTaglineIfNeeded();

    try {
      const response = await fetch("/api/click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userUuid,
          tzOffsetMinutes: new Date().getTimezoneOffset(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to record click");
      }

      const payload = (await response.json()) as { ok: boolean; stats: Stats };

      if (!payload.ok) {
        throw new Error("API returned failure");
      }

      setStats((current) => {
        const nextStats = {
          today: Math.max(current.today, payload.stats.today),
          allTime: Math.max(current.allTime, payload.stats.allTime),
          globalTotal: Math.max(current.globalTotal, payload.stats.globalTotal),
        };
        const todayChanged = nextStats.today !== current.today;
        const allTimeChanged = nextStats.allTime !== current.allTime;
        const globalTotalChanged = nextStats.globalTotal !== current.globalTotal;

        statsRef.current = nextStats;

        if (todayChanged || allTimeChanged || globalTotalChanged) {
          setBumps({
            today: todayChanged,
            allTime: allTimeChanged,
            globalTotal: globalTotalChanged,
          });
        }

        return nextStats;
      });
    } catch (error) {
      console.error("Unable to record click", error);

      try {
        await syncStats(userUuid);
      } catch (syncError) {
        console.error("Unable to recover stats after click failure", syncError);
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10 text-center">
      <div className="flex w-full max-w-3xl flex-col items-center gap-6 sm:gap-8">
        <div className="space-y-3">
          <p className="text-sm font-extrabold tracking-[0.12em] text-[#20232D]/70">
            Press It
          </p>
          <p className="max-w-xl text-lg font-medium leading-8 text-[#20232D]/82 sm:text-xl">
            {tagline}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handlePress()}
          className="flex h-[60vw] w-[60vw] max-h-[280px] max-w-[280px] min-h-[220px] min-w-[220px] items-center justify-center rounded-full bg-[#FF6B6B] px-10 text-3xl font-bold text-white shadow-[0_22px_40px_rgba(255,107,107,0.22),inset_0_6px_14px_rgba(255,255,255,0.24),inset_0_-10px_18px_rgba(0,0,0,0.08)] transition-[transform,background-color,box-shadow] duration-75 ease-out hover:scale-[1.015] hover:bg-[#ff7474] hover:shadow-[0_26px_46px_rgba(255,107,107,0.24),inset_0_6px_14px_rgba(255,255,255,0.28),inset_0_-10px_18px_rgba(0,0,0,0.08)] active:scale-[0.97] active:bg-[#E05555] active:shadow-[0_12px_24px_rgba(224,85,85,0.18),inset_0_8px_18px_rgba(0,0,0,0.12)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF6B6B]/30 sm:h-[280px] sm:w-[280px]"
          aria-label="Press the stress release button"
        >
          Press
        </button>

        <p className="text-base font-medium text-[#20232D] sm:text-lg">
          Today: <CounterNumber value={stats.today} bump={bumps.today} />
          <span className="px-2 text-[#20232D]/45">·</span>
          All time: <CounterNumber value={stats.allTime} bump={bumps.allTime} />
        </p>

        <div className="flex w-full max-w-sm flex-col items-center gap-3">
          <div className="h-px w-full bg-[#20232D]/12" />
          <p className="text-sm font-medium text-[#20232D]/60 sm:text-base">
            <CounterNumber value={stats.globalTotal} bump={bumps.globalTotal} /> presses
            worldwide 🌍
          </p>
        </div>
      </div>
    </main>
  );
}

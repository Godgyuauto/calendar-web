"use client";

import { useEffect, useState } from "react";
import type { OverrideType, ShiftCode } from "@/modules/shift";

export interface ExistingOverride {
  id: string;
  date: string;
  overrideType: OverrideType;
  overrideShift: ShiftCode | null;
  label: string;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
  createdAt?: string;
}

interface UseExistingOverrideInput {
  open: boolean;
  dateKey: string;
  selectedOverrideId?: string | null;
}

interface UseExistingOverrideResult {
  existingOverride: ExistingOverride | null;
  existingLoading: boolean;
  existingError: string | null;
}

function toTimestamp(value?: string): number {
  if (!value) {
    return 0;
  }

  const unix = new Date(value).getTime();
  return Number.isNaN(unix) ? 0 : unix;
}

export function pickExistingOverride(
  overrides: ExistingOverride[],
  dateKey: string,
  selectedOverrideId?: string | null,
): ExistingOverride | null {
  const dayOverrides = overrides.filter((override) => override.date === dateKey);
  if (selectedOverrideId) {
    return dayOverrides.find((override) => override.id === selectedOverrideId) ?? null;
  }

  return (
    dayOverrides
      .slice()
      .sort((left, right) => toTimestamp(right.createdAt) - toTimestamp(left.createdAt))[0] ??
    null
  );
}

// Reads current-month overrides and picks the selected day entry.
export function useExistingOverride({
  open,
  dateKey,
  selectedOverrideId,
}: UseExistingOverrideInput): UseExistingOverrideResult {
  const [existingOverride, setExistingOverride] = useState<ExistingOverride | null>(null);
  const [existingLoading, setExistingLoading] = useState(false);
  const [existingError, setExistingError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let canceled = false;
    const [yearText, monthText] = dateKey.split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      return;
    }

    const load = async () => {
      setExistingLoading(true);
      setExistingError(null);
      // Clear previous-day selection immediately so the sheet never reuses stale detail.
      setExistingOverride(null);
      try {
        const response = await fetch(
          `/api/overrides?year=${year}&month=${month}&scope=mine`,
          {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          },
        );
        if (!response.ok) {
          if (!canceled) {
            setExistingError("기존 일정을 불러오지 못했습니다.");
            setExistingOverride(null);
          }
          return;
        }

        const body = (await response.json()) as { overrides?: ExistingOverride[] };
        const matched = pickExistingOverride(
          body.overrides ?? [],
          dateKey,
          selectedOverrideId,
        );
        if (!canceled) {
          setExistingOverride(matched);
        }
      } catch {
        if (!canceled) {
          setExistingError("기존 일정 조회 중 오류가 발생했습니다.");
          setExistingOverride(null);
        }
      } finally {
        if (!canceled) {
          setExistingLoading(false);
        }
      }
    };

    load();
    return () => {
      canceled = true;
    };
  }, [dateKey, open, selectedOverrideId]);

  return {
    existingOverride,
    existingLoading,
    existingError,
  };
}

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
  existingOverrides: ExistingOverride[];
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

function toStartTimestamp(value?: string | null): number {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const unix = new Date(value).getTime();
  return Number.isNaN(unix) ? Number.POSITIVE_INFINITY : unix;
}

export function pickExistingOverride(
  overrides: ExistingOverride[],
  dateKey: string,
  selectedOverrideId?: string | null,
): ExistingOverride | null {
  const dayOverrides = listExistingOverrides(overrides, dateKey);
  if (selectedOverrideId) {
    return dayOverrides.find((override) => override.id === selectedOverrideId) ?? null;
  }

  return dayOverrides[0] ?? null;
}

export function listExistingOverrides(
  overrides: ExistingOverride[],
  dateKey: string,
): ExistingOverride[] {
  return overrides
    .filter((override) => override.date === dateKey)
    .sort((left, right) => {
      const leftStart = toStartTimestamp(left.startTime);
      const rightStart = toStartTimestamp(right.startTime);
      if (leftStart !== rightStart) {
        return leftStart < rightStart ? -1 : 1;
      }
      return toTimestamp(right.createdAt) - toTimestamp(left.createdAt);
    });
}

// Reads current-month overrides and picks the selected day entry.
export function useExistingOverride({
  open,
  dateKey,
  selectedOverrideId,
}: UseExistingOverrideInput): UseExistingOverrideResult {
  const [existingOverride, setExistingOverride] = useState<ExistingOverride | null>(null);
  const [existingOverrides, setExistingOverrides] = useState<ExistingOverride[]>([]);
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
      setExistingOverrides([]);
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
            setExistingOverrides([]);
          }
          return;
        }

        const body = (await response.json()) as { overrides?: ExistingOverride[] };
        const matchedList = listExistingOverrides(body.overrides ?? [], dateKey);
        const matched = pickExistingOverride(
          body.overrides ?? [],
          dateKey,
          selectedOverrideId,
        );
        if (!canceled) {
          setExistingOverride(matched);
          setExistingOverrides(matchedList);
        }
      } catch {
        if (!canceled) {
          setExistingError("기존 일정 조회 중 오류가 발생했습니다.");
          setExistingOverride(null);
          setExistingOverrides([]);
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
    existingOverrides,
    existingLoading,
    existingError,
  };
}

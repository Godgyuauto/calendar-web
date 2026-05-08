"use client";

import { useState } from "react";
import {
  BottomSheet,
  ChevronRightIcon,
  PrimaryButton,
  SectionLabel,
  SettingsGroupCard,
  SettingsRow,
} from "@/modules/ui/components";
import type { AnnualLeaveSettingsPageData } from "@/modules/settings/settings-page-data";

interface AnnualLeaveSettingsSectionProps {
  initialData: AnnualLeaveSettingsPageData;
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-[#8e8e93]">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 h-12 w-full rounded-[12px] bg-[#f2f2f7] px-4 text-[16px] font-semibold text-[#1a1a1a] outline-none focus:ring-2 focus:ring-[#007AFF]"
      />
    </label>
  );
}

export function AnnualLeaveSettingsSection({
  initialData,
}: AnnualLeaveSettingsSectionProps) {
  const [saved, setSaved] = useState(initialData);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(initialData.year);
  const [totalDays, setTotalDays] = useState(initialData.totalDays);
  const [remainingDays, setRemainingDays] = useState(initialData.remainingDays);
  const [remainingHours, setRemainingHours] = useState(initialData.remainingHours);

  const openEditor = () => {
    setYear(saved.year);
    setTotalDays(saved.totalDays);
    setRemainingDays(saved.remainingDays);
    setRemainingHours(saved.remainingHours);
    setError(null);
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/leave/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, totalDays, remainingDays, remainingHours }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        settings?: { totalHours: number; usedHoursBeforeApp: number };
      };
      if (!response.ok || !body.settings) {
        setError(body.error ?? "연차 설정 저장에 실패했습니다.");
        return;
      }

      const remainingTotalHours = body.settings.totalHours - body.settings.usedHoursBeforeApp;
      const nextSaved = {
        year,
        totalDays: Math.floor(body.settings.totalHours / 8),
        remainingDays: Math.floor(Math.max(0, remainingTotalHours) / 8),
        remainingHours: Math.max(0, remainingTotalHours) % 8,
        remainingLabel:
          Math.max(0, remainingTotalHours) % 8 > 0
            ? `${Math.floor(Math.max(0, remainingTotalHours) / 8)}개 ${
                Math.max(0, remainingTotalHours) % 8
              }시간`
            : `${Math.floor(Math.max(0, remainingTotalHours) / 8)}개`,
      };
      setSaved(nextSaved);
      setOpen(false);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionLabel>연차</SectionLabel>
      <SettingsGroupCard>
        <SettingsRow
          label="남은 연차"
          description={`${saved.year}년 기준`}
          trailing={
            <>
              <span className="text-[13px] font-semibold text-[#1a1a1a]">
                {saved.remainingLabel}
              </span>
              <ChevronRightIcon />
            </>
          }
          onClick={openEditor}
          hairline={false}
        />
      </SettingsGroupCard>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel="연차 설정"
      >
        <div className="px-6">
          <p className="text-[12px] font-semibold text-[#8e8e93]">연차 설정</p>
          <h2 className="mt-1 text-[22px] font-bold text-[#1a1a1a]">남은 연차</h2>
          <p className="mt-2 text-[13px] leading-5 text-[#8e8e93]">
            총 연차와 현재 남은 연차를 입력하면 이전 사용분은 자동으로 반영됩니다.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <NumberField label="연도" value={year} min={2020} max={2100} onChange={setYear} />
            <NumberField
              label="총 연차"
              value={totalDays}
              min={0}
              max={60}
              onChange={setTotalDays}
            />
            <NumberField
              label="남은 시간"
              value={remainingHours}
              min={0}
              max={7}
              onChange={setRemainingHours}
            />
          </div>
          <div className="mt-3">
            <NumberField
              label="남은 연차 개수"
              value={remainingDays}
              min={0}
              max={60}
              onChange={setRemainingDays}
            />
          </div>
          {error ? (
            <p role="alert" className="mt-3 text-[12px] text-[#ff3b30]">
              {error}
            </p>
          ) : null}
          <div className="mt-5">
            <PrimaryButton type="button" disabled={saving} onClick={() => void save()}>
              {saving ? "저장 중..." : "저장"}
            </PrimaryButton>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

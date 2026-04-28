import { describe, expect, it } from "vitest";
import { parseStructuredOverrideNote } from "./structured-override-note";

describe("parseStructuredOverrideNote — null / non-parseable input", () => {
  it("returns null for null input", () => {
    expect(parseStructuredOverrideNote(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(parseStructuredOverrideNote(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseStructuredOverrideNote("")).toBeNull();
  });

  it("returns null for plain text (non-JSON)", () => {
    expect(parseStructuredOverrideNote("some plain text")).toBeNull();
  });

  it("returns null for a JSON array (not an object)", () => {
    expect(parseStructuredOverrideNote("[]")).toBeNull();
  });

  it("returns null for a JSON object with no known structured keys", () => {
    expect(parseStructuredOverrideNote('{"foo":"bar"}')).toBeNull();
  });
});

describe("parseStructuredOverrideNote — canonical (snake_case) schema", () => {
  const canonical = JSON.stringify({
    schema: "calendar_override_v1",
    event_type: "vacation",
    shift_change: "OFF",
    all_day: false,
    start_at: "2026-04-28T09:00:00+09:00",
    end_at: "2026-04-28T17:00:00+09:00",
    remind_at: "2026-04-28T08:00:00+09:00",
    title: "연차 휴가",
    memo: "병원 예약",
  });

  it("parses all canonical fields correctly", () => {
    const result = parseStructuredOverrideNote(canonical);
    expect(result).not.toBeNull();
    expect(result?.schema).toBe("calendar_override_v1");
    expect(result?.event_type).toBe("vacation");
    expect(result?.shift_change).toBe("OFF");
    expect(result?.all_day).toBe(false);
    expect(result?.start_at).toBe("2026-04-28T09:00:00+09:00");
    expect(result?.end_at).toBe("2026-04-28T17:00:00+09:00");
    expect(result?.remind_at).toBe("2026-04-28T08:00:00+09:00");
    expect(result?.title).toBe("연차 휴가");
    expect(result?.memo).toBe("병원 예약");
  });
});

describe("parseStructuredOverrideNote — legacy camelCase keys", () => {
  const legacy = JSON.stringify({
    eventType: "training",
    shiftChange: "A",
    allDay: true,
    startAt: null,
    endAt: null,
    remindAt: null,
    title: "교육",
    memo: "",
  });

  it("normalizes camelCase keys to snake_case output", () => {
    const result = parseStructuredOverrideNote(legacy);
    expect(result?.event_type).toBe("training");
    expect(result?.shift_change).toBe("A");
    expect(result?.all_day).toBe(true);
  });
});

describe("parseStructuredOverrideNote — all_day inference", () => {
  it("infers all_day=true when start_at and end_at are both absent", () => {
    const note = JSON.stringify({ event_type: "vacation", title: "test" });
    const result = parseStructuredOverrideNote(note);
    expect(result?.all_day).toBe(true);
  });

  it("infers all_day=false when both start_at and end_at are present", () => {
    const note = JSON.stringify({
      event_type: "vacation",
      title: "test",
      start_at: "2026-04-28T09:00:00Z",
      end_at: "2026-04-28T17:00:00Z",
    });
    const result = parseStructuredOverrideNote(note);
    expect(result?.all_day).toBe(false);
  });

  it("respects explicit all_day field over inference", () => {
    const note = JSON.stringify({
      event_type: "vacation",
      title: "test",
      start_at: "2026-04-28T09:00:00Z",
      end_at: "2026-04-28T17:00:00Z",
      all_day: true,
    });
    const result = parseStructuredOverrideNote(note);
    expect(result?.all_day).toBe(true);
  });
});

describe("parseStructuredOverrideNote — invalid enum values use fallback", () => {
  it("falls back to default eventType for unknown value", () => {
    const note = JSON.stringify({ event_type: "unknown_type", title: "x" });
    const result = parseStructuredOverrideNote(note);
    expect(result?.event_type).toBe("vacation");
  });

  it("uses provided fallback eventType", () => {
    const note = JSON.stringify({ event_type: "unknown_type", title: "x" });
    const result = parseStructuredOverrideNote(note, { eventType: "sick" });
    expect(result?.event_type).toBe("sick");
  });

  it("falls back to KEEP for unknown shiftChange", () => {
    const note = JSON.stringify({ shift_change: "Z", title: "x" });
    const result = parseStructuredOverrideNote(note);
    expect(result?.shift_change).toBe("KEEP");
  });

  it("uses provided fallback shiftChange", () => {
    const note = JSON.stringify({ shift_change: "Z", title: "x" });
    const result = parseStructuredOverrideNote(note, { shiftChange: "B" });
    expect(result?.shift_change).toBe("B");
  });
});

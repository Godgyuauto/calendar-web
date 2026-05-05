import { describe, expect, it } from "vitest";
import {
  isDuplicateAccountMessage,
  normalizeEmail,
  validateSignupForm,
} from "./signup-validation";

describe("normalizeEmail", () => {
  it("trims and lowercases email input", () => {
    expect(normalizeEmail(" Wife@Example.COM ")).toBe("wife@example.com");
  });

  it("returns null for empty input", () => {
    expect(normalizeEmail(" ")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe("validateSignupForm", () => {
  it("accepts a valid signup payload", () => {
    expect(
      validateSignupForm({
        email: "wife@example.com",
        password: "secret1",
        displayName: "나님",
      }),
    ).toEqual({
      ok: true,
      data: {
        email: "wife@example.com",
        password: "secret1",
        displayName: "나님",
      },
    });
  });

  it("rejects short passwords", () => {
    expect(
      validateSignupForm({
        email: "wife@example.com",
        password: "12345",
        displayName: "나님",
      }),
    ).toEqual({ ok: false, message: "비밀번호는 6자 이상이어야 합니다." });
  });
});

describe("isDuplicateAccountMessage", () => {
  it("recognizes Supabase duplicate account messages", () => {
    expect(isDuplicateAccountMessage("User already registered")).toBe(true);
    expect(isDuplicateAccountMessage("A user already exists with this email")).toBe(true);
  });

  it("ignores unrelated auth messages", () => {
    expect(isDuplicateAccountMessage("Password should be at least 6 characters")).toBe(false);
  });
});

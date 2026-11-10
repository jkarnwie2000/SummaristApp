import { describe, expect, it } from "vitest";
import { EMAIL_RE, authMessage } from "@/app/admin/login/authErrors";

describe("admin auth error messages", () => {
  it("maps credential errors to one friendly message", () => {
    for (const code of ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"]) {
      expect(authMessage({ code })).toBe("Incorrect email or password.");
    }
  });

  it("falls back to a generic message", () => {
    expect(authMessage(new Error("boom"))).toBe("Something went wrong. Please try again.");
    expect(authMessage(null)).toBe("Something went wrong. Please try again.");
  });

  it("validates email addresses", () => {
    expect(EMAIL_RE.test("admin@summarist.com")).toBe(true);
    expect(EMAIL_RE.test("not an email")).toBe(false);
    expect(EMAIL_RE.test("a@b")).toBe(false);
  });
});

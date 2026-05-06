import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const script = readFileSync(new URL("./issue-test-token.sh", import.meta.url), "utf8");

describe("issue-test-token.sh", () => {
  it("uses a verification family when RELEASE_CHECK_FAMILY_ID is not provided", () => {
    expect(script).toContain("RELEASE_CHECK_TEST_FAMILY_NAME:-codex.verify.family");
    expect(script).toContain("ensure verification family");
    expect(script).not.toContain("families?select=id&order=created_at.asc&limit=1");
  });
});

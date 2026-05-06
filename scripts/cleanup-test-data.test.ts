import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const script = readFileSync(new URL("./cleanup-test-data.sh", import.meta.url), "utf8");

describe("cleanup-test-data.sh", () => {
  it("initializes count_rows locals before using them in output paths", () => {
    expect(script).not.toContain('local table="$1" filter="$2" out=');
    expect(script).toContain('local table="$1"');
    expect(script).toContain('out="$TMP_DIR/count_${table}_');
  });
});

import { listShiftOverrides } from "@/modules/family";
import { startApiLog } from "@/modules/family/api/request-log";
import {
  logUnexpectedFailure,
  responseForSuccess,
} from "@/modules/family/api/route-log-response";
import { DEFAULT_SHIFT_PATTERN_V1, getTodayShiftSummary } from "@/modules/shift";

export async function GET() {
  const logScope = startApiLog("/api/shifts/today", "GET");
  const now = new Date();
  try {
    const year = Number(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
      }).format(now),
    );
    const month = Number(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        month: "numeric",
      }).format(now),
    );

    const summary = getTodayShiftSummary({
      pattern: DEFAULT_SHIFT_PATTERN_V1,
      overrides: listShiftOverrides({ year, month }),
    });

    return responseForSuccess(
      logScope,
      {
        pattern: {
          patternId: DEFAULT_SHIFT_PATTERN_V1.patternId,
          version: DEFAULT_SHIFT_PATTERN_V1.version,
          seedDate: DEFAULT_SHIFT_PATTERN_V1.seedDate,
        },
        summary,
      },
      200,
    );
  } catch (error) {
    logUnexpectedFailure(logScope, error);
    throw error;
  }
}

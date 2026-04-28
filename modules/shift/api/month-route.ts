import { NextRequest } from "next/server";
import { listShiftOverrides } from "@/modules/family";
import { startApiLog } from "@/modules/family/api/_common";
import {
  logUnexpectedFailure,
  responseForFailure,
  responseForSuccess,
} from "@/modules/family/api/_common";
import { DEFAULT_SHIFT_PATTERN_V1, getMonthShiftSummary } from "@/modules/shift";

export async function GET(request: NextRequest) {
  const logScope = startApiLog("/api/shifts/month", "GET");
  const now = new Date();
  const yearParam = request.nextUrl.searchParams.get("year");
  const monthParam = request.nextUrl.searchParams.get("month");
  const year = yearParam ? Number(yearParam) : now.getFullYear();
  const month = monthParam ? Number(monthParam) : now.getMonth() + 1;

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return responseForFailure(
      logScope,
      400,
      "year must be an integer between 2000 and 2100.",
      "VALIDATION",
    );
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return responseForFailure(
      logScope,
      400,
      "month must be an integer between 1 and 12.",
      "VALIDATION",
    );
  }

  try {
    const overrides = listShiftOverrides({ year, month });
    const summary = getMonthShiftSummary({
      year,
      month,
      overrides,
      pattern: DEFAULT_SHIFT_PATTERN_V1,
    });

    return responseForSuccess(
      logScope,
      {
        year,
        month,
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

import { NextRequest, NextResponse } from "next/server";
import { readAuthProfileFromSupabase } from "@/modules/family/api/family-auth-profile-supabase";
import {
  listFamilyMembersFromSupabase,
  readActiveShiftPatternFromSupabase,
  readFamilyNameFromSupabase,
  readOwnPushSubscriptionExistsFromSupabase,
} from "@/modules/family/api/family-members-settings-supabase";
import { getFamilyRepositoryFailure } from "@/modules/family/api/family-supabase-common";
import { startApiLog } from "@/modules/family/api/request-log";
import { resolveFamilyAuthOrResponseWithCookie } from "@/modules/family/api/route-auth";
import {
  logUnexpectedFailure,
  responseForAuthFailure,
  responseForFailure,
  responseForSuccess,
} from "@/modules/family/api/route-log-response";
import { DEFAULT_SHIFT_PATTERN_V1 } from "@/modules/shift";

export async function GET(request: NextRequest) {
  const logScope = startApiLog("/api/settings/summary", "GET");
  const auth = await resolveFamilyAuthOrResponseWithCookie(request);
  if (auth instanceof NextResponse) {
    return responseForAuthFailure(logScope, auth);
  }

  try {
    const [profile, familyName, activePattern, hasPushSubscription, members] =
      await Promise.all([
        readAuthProfileFromSupabase(auth),
        readFamilyNameFromSupabase(auth),
        readActiveShiftPatternFromSupabase(auth),
        readOwnPushSubscriptionExistsFromSupabase(auth),
        listFamilyMembersFromSupabase(auth),
      ]);

    const selfMember = members.find((member) => member.userId === auth.userId);
    return responseForSuccess(
      logScope,
      {
        profile: {
          userId: auth.userId,
          role: selfMember?.role ?? null,
          working: selfMember?.working ?? true,
          displayName: profile.displayName,
          email: profile.email,
        },
        family: {
          id: auth.familyId,
          name: familyName,
        },
        defaults: {
          shiftPattern: activePattern ?? {
            patternId: DEFAULT_SHIFT_PATTERN_V1.patternId,
            version: DEFAULT_SHIFT_PATTERN_V1.version,
            seedDate: DEFAULT_SHIFT_PATTERN_V1.seedDate,
          },
          hasPushSubscription,
        },
      },
      200,
      auth,
    );
  } catch (error) {
    const failure = getFamilyRepositoryFailure(error);
    if (failure) {
      return responseForFailure(
        logScope,
        failure.status,
        failure.message,
        "REPOSITORY",
        auth,
      );
    }

    logUnexpectedFailure(logScope, error, auth);
    throw error;
  }
}

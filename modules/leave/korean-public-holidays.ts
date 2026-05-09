export interface KoreanPublicHoliday {
  name: string;
}

const KOREAN_PUBLIC_HOLIDAYS_BY_YEAR: Record<
  number,
  Record<string, KoreanPublicHoliday>
> = {
  2026: {
    "2026-01-01": { name: "신정" },
    "2026-02-16": { name: "설날 연휴" },
    "2026-02-17": { name: "설날" },
    "2026-02-18": { name: "설날 연휴" },
    "2026-03-01": { name: "삼일절" },
    "2026-03-02": { name: "삼일절 대체공휴일" },
    "2026-05-01": { name: "근로자의 날" },
    "2026-05-05": { name: "어린이날" },
    "2026-05-24": { name: "부처님오신날" },
    "2026-05-25": { name: "부처님오신날 대체공휴일" },
    "2026-06-03": { name: "전국동시지방선거" },
    "2026-06-06": { name: "현충일" },
    "2026-07-17": { name: "제헌절" },
    "2026-08-15": { name: "광복절" },
    "2026-08-17": { name: "광복절 대체공휴일" },
    "2026-09-24": { name: "추석 연휴" },
    "2026-09-25": { name: "추석" },
    "2026-09-26": { name: "추석 연휴" },
    "2026-10-03": { name: "개천절" },
    "2026-10-05": { name: "개천절 대체공휴일" },
    "2026-10-09": { name: "한글날" },
    "2026-12-25": { name: "성탄절" },
  },
};

export function isKoreanPublicHoliday(dateKey: string): boolean {
  return getKoreanPublicHoliday(dateKey) !== null;
}

export function getKoreanPublicHoliday(dateKey: string): KoreanPublicHoliday | null {
  const year = Number(dateKey.slice(0, 4));
  return KOREAN_PUBLIC_HOLIDAYS_BY_YEAR[year]?.[dateKey] ?? null;
}

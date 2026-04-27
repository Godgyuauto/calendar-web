interface HomeHeroProps {
  seedDate: string;
  version: string;
}

export function HomeHero({ seedDate, version }: HomeHeroProps) {
  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-lg shadow-slate-300/40 backdrop-blur">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
        Shared Shift Calendar
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
        우리 가족 공유 교대근무 캘린더
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
        기준일({seedDate})과 패턴 버전({version})을 기반으로 교대조를 계산합니다.
        오버라이드는 기본 패턴에 병합해 표시됩니다.
      </p>
    </section>
  );
}

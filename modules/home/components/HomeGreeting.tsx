interface HomeGreetingProps {
  name: string;
  dateLabel: string;
}

// Large greeting block at the top of the home dashboard.
// Mirrors the Apple-style "안녕하세요, {name}님" + subtitle date.
export function HomeGreeting({ name, dateLabel }: HomeGreetingProps) {
  return (
    <header className="px-5 pb-2 pt-6">
      <h1 className="text-[26px] font-bold leading-tight text-[#1a1a1a]">
        안녕하세요, {name}님 👋
      </h1>
      <p className="mt-1 text-[13px] text-[#8e8e93]">{dateLabel}</p>
    </header>
  );
}

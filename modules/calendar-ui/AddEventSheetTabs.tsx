type AddEventSheetTab = "existing" | "create";

interface AddEventSheetTabsProps {
  activeTab: AddEventSheetTab;
  onSelect: (tab: AddEventSheetTab) => void;
}

const TABS: { id: AddEventSheetTab; label: string }[] = [
  { id: "existing", label: "등록된 일정" },
  { id: "create", label: "일정 추가하기" },
];

export function AddEventSheetTabs({ activeTab, onSelect }: AddEventSheetTabsProps) {
  return (
    <nav className="mb-3 flex border-b border-[#e5e5ea]">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(tab.id)}
          className={`flex-1 pb-2 text-[16px] font-semibold ${
            activeTab === tab.id
              ? "border-b-2 border-[#007AFF] text-[#007AFF]"
              : "text-[#8e8e93]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export type { AddEventSheetTab };

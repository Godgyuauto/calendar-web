import { CalendarIcon, CloseIcon } from "@/modules/ui/components";

interface AddEventSheetHeaderProps {
  label: string;
  onClose: () => void;
}

export function AddEventSheetHeader({ label, onClose }: AddEventSheetHeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 pb-3">
      <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1a1a1a]">
        <span className="text-[#007AFF]">
          <CalendarIcon size={18} />
        </span>
        <span>{label}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="text-[#8e8e93]"
      >
        <CloseIcon size={20} />
      </button>
    </header>
  );
}

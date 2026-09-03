type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-base font-semibold text-[#172033]">{title}</h2>
      {actionLabel ? (
        <button
          className="rounded-md px-2 py-1 text-sm font-semibold text-[#003755] hover:bg-[#e6f1f6]"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}


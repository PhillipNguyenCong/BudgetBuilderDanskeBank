import type { ReactNode } from "react";

type ListRowProps = {
  title: string;
  description?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function ListRow({ title, description, leading, trailing }: ListRowProps) {
  return (
    <div className="flex min-h-14 items-center gap-3 border-b border-[#e5edf2] py-3 last:border-b-0">
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#172033]">{title}</p>
        {description ? <p className="mt-0.5 text-xs text-[#5f6f82]">{description}</p> : null}
      </div>
      {trailing ? <div className="shrink-0 text-right">{trailing}</div> : null}
    </div>
  );
}


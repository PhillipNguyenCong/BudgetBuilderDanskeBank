import type { ReactNode } from "react";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-[#e6f1f6] text-[#003755]",
  success: "bg-[#e7f4ee] text-[#176b4d]",
  warning: "bg-[#fff3d8] text-[#8a5000]",
  danger: "bg-[#fde8e5] text-[#b42318]",
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}


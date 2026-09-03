import { formatCurrency } from "../../shared/utils/formatCurrency";

type AmountProps = {
  value: number;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "muted" | "positive" | "warning" | "danger" | "inverse";
};

const sizeClasses = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-4xl",
};

const toneClasses = {
  default: "text-[#172033]",
  muted: "text-[#5f6f82]",
  positive: "text-[#176b4d]",
  warning: "text-[#9a5a00]",
  danger: "text-[#b42318]",
  inverse: "text-white",
};

export function Amount({ value, size = "md", tone = "default" }: AmountProps) {
  return (
    <span className={`font-semibold tabular-nums ${sizeClasses[size]} ${toneClasses[tone]}`}>
      {formatCurrency(value)}
    </span>
  );
}

type ProgressBarProps = {
  value: number;
  max: number;
  label: string;
  tone?: "normal" | "warning" | "danger";
};

const toneClasses = {
  normal: "bg-[#006d77]",
  warning: "bg-[#c77700]",
  danger: "bg-[#b42318]",
};

export function ProgressBar({
  value,
  max,
  label,
  tone = "normal",
}: ProgressBarProps) {
  const percentage = max <= 0 ? 0 : Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div aria-label={label} aria-valuemax={max} aria-valuemin={0} aria-valuenow={value} role="progressbar">
      <div className="h-2 overflow-hidden rounded-full bg-[#e6edf2]">
        <div
          className={`h-full rounded-full ${toneClasses[tone]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}


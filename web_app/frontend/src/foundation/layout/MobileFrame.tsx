import type { ReactNode } from "react";

type MobileFrameProps = {
  children: ReactNode;
};

export function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="mx-auto min-h-[780px] w-full max-w-[430px] overflow-hidden rounded-[2rem] border border-[#c9d6df] bg-[#f7fafc] shadow-2xl sm:my-4">
      {children}
    </div>
  );
}


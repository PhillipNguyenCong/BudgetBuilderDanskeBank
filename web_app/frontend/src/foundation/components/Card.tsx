import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <section className={`rounded-lg border border-[#d9e2ea] bg-white shadow-sm ${className}`}>
      {children}
    </section>
  );
}


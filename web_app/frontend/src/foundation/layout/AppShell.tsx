import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-[#eef3f6] px-4 py-6 text-[#172033] sm:px-6">
      <div className="mx-auto max-w-5xl">{children}</div>
    </main>
  );
}


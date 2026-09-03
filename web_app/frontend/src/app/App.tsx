import { AppShell } from "../foundation/layout/AppShell";
import { MobileFrame } from "../foundation/layout/MobileFrame";
import { renderCurrentRoute } from "./routes";

export function App() {
  return (
    <AppShell>
      <MobileFrame>{renderCurrentRoute()}</MobileFrame>
    </AppShell>
  );
}


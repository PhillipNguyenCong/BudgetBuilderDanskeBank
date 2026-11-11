# Native mobile app

First frontend delivery: React Native, TypeScript and Expo SDK 58 with Expo Router. Four working tabs open on Budget. Create budget opens account selection; Home, Cards and More are explicit demo screens. Account selection reads the local backend profile, masked accounts, coverage and existing budgets. Budget also offers an offline sample-widget editor. Manual setup now saves through the existing backend and opens the saved-plan overview. Account-derived suggestions, saved-plan editing and login remain deferred.

## Start on iPhone

1. Install current Node 24 LTS (minimum 24.3; `nvm install && nvm use` if using nvm). Node 22.13+ is also supported. The host's original Node 24.2 is too old for this React Native release.
2. From the **BudgetBuilderDanskeBank repository root**, run `npm ci`, then `npm run dev:mobile`.
3. Install Expo Go on the iPhone. Put the computer and iPhone on the same local Wi-Fi network.
4. Scan Metro's QR code with the iPhone Camera and open it in Expo Go. Allow local-network access if prompted. Keep Metro running; stop with Ctrl+C.
5. If discovery fails, check Wi-Fi isolation, VPN and firewall settings. Budget checks saved plans on entry, so creation and the saved-plan overview require the local backend. The separate sample preview remains available from the error screen while offline.

Android uses the same Metro command and Expo Go QR scanner. No Xcode, Android Studio, cloud build or store release is required for Expo Go.

The project targets Expo SDK 58 to match the installed iOS Expo Go version. Expo Go on a physical iPhone supports the current SDK only. Follow [Expo's upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) and align all Expo/React Native dependencies together when upgrading.

After a dependency upgrade, stop Metro and run `npm run start --workspace @budget-builder/mobile -- --clear` from the repository root, then scan the new QR code. The `a` key launches Android through local Android SDK/ADB tooling; it is not needed when opening Expo Go by scanning the QR code on a physical phone.

## Commands (repository root)

| Command | Purpose |
| --- | --- |
| `npm run dev:mobile` | Start only Metro on the LAN |
| `npm run test:mobile` | Native component/navigation tests (Jest Expo) |
| `npm run test:mobile:api` | Mobile feature API against an isolated synthetic HTTP backend; builds shared/backend packages first |
| `npm run typecheck:mobile` | Native TypeScript check |
| `npm run check:mobile` | Expo dependency compatibility |
| `cd apps/mobile && npx expo-doctor` | Full Expo project checks |
| `npm run bundle:mobile:ios` | Export iOS JavaScript/assets to ignored `dist/ios` |
| `npm run bundle:mobile:android` | Export Android JavaScript/assets to ignored `dist/android` |
| `npm run format:check` | Repository TypeScript formatting, including mobile |

Root `npm test` still runs only backend/shared Node tests. `npm run typecheck` checks all workspaces. Root `npm run build` builds backend/shared packages; native exports are explicit commands above. Lint is not configured. Bundles are not native installers or device tests.

## Structure

- `src/app`: startup, layouts and thin Expo Router routes.
- `src/foundation/components`: reusable presentation primitives.
- `src/foundation/theme`: colors, typography and spacing.
- `src/features/account-selection`: account eligibility/loading hook, account list and history components.
- `src/features/budget-creation`: setup checks, initial manual plan, save/recovery hook and creation UI.
- `src/features/budget-editor`: draft hook and validation adapter; composed widgets, bill inputs, savings review and rollover controls.
- `src/features/budget-overview`: saved-budget loading hook and read-only plan components using contract data directly.
- `src/features/budget-preview`: offline sample-plan factory and preview screen.
- `src/features/budget-shared`: budget list/create requests, DKK formatting, labels and widget palette; no workflow or React Native imports.
- `src/features/shell`: demo screens, navigation bar and colocated navigation tests.
- `src/tests`: cross-feature creation/navigation tests, outside the Expo Router route directory.
- `assets/fonts`: retained Open Sans assets and OFL license. The current interface uses platform system typography with no font-loading gate or runtime font downloads.

Each feature exposes its supported interface through `index.ts`. Routes and other features use these public exports; internal modules import local files directly. The account-selection and budget-creation features also expose `api.ts` as a small React Native-free public entry for setup orchestration and the Node integration harness. Only test mocks target implementation modules directly. Do not export every component from a feature or import another feature's private files.

Screens compose named components; hooks own request/draft state, cancellation and transitions. Display components receive explicit props and callbacks, with styles and prop types in the same file. Keep financial algorithms in budget-core and foundation components domain-agnostic. Creation and preview share the editor; overview reads saved contracts without importing draft state. See [refactor criteria and verification](../../docs/mobile-feature-refactor-story.md).

The Figma reference is [Your money, organised](https://www.figma.com/design/0ka6z9Ob7PgioGkZfnEN4V?node-id=194-9). Layout adapts to native safe areas and scalable text. Create budget opens account selection; Continue opens manual setup for an eligible account. Saving returns to Budget with the new plan selected.

## Device verification checklist — pending

Physical iPhone and Android testing has not been performed. No simulator is installed on the verification host. Before accepting device UX:

- Cold-launch on Budget and switch through all tabs; verify selected announcements with VoiceOver/TalkBack.
- Test Create budget → account selection → manual entry → save → saved plan; also test cancelling, invalid amounts and failed saves without losing inputs.
- Check portrait/landscape, home indicator/notch, scrolling and the largest accessibility text size.
- Check header wrapping, tab labels, at least 44 × 44 touch areas and all text contrast.
- Reopen with Metro serving the bundle; system typography must render immediately with no font download.

Automated results and remaining limitations are recorded in `docs/mobile-shell-verification.md` at the repository root.

## Connect account selection to the local backend

From the repository root, run `npm run dev:backend:lan` on a trusted private Wi-Fi network. This explicitly binds the demo backend to all local interfaces; the normal `npm run dev:backend` remains loopback-only. This is unauthenticated demo data, never a public deployment or a real bank connection.

Create ignored `apps/mobile/.env` from `.env.example` and set `EXPO_PUBLIC_API_URL=http://<your-Mac-Wi-Fi-IP>:3001`. The phone cannot use the Mac's `localhost`. Use `ipconfig getifaddr en0` on macOS to find the Wi-Fi IP. This public setting is bundled into the app; never put secrets in it. Restart Metro after changes. If port 3001 is already occupied, use `PORT=3002 npm run dev:backend:lan` and the same port in the mobile URL. The local verification setup uses port 3002.

`npm run dev:mobile` builds shared contracts and budget-core before starting Metro. For tests or exports after a fresh checkout, run `npm run build --workspace @budget-builder/contracts` followed by `npm run build --workspace @budget-builder/budget-core`. Existing schemas validate every response. Profile, accounts and budgets must all load before an account becomes selectable; a budget-list failure cannot bypass account exclusivity. Requests time out after 10 seconds and are cancelled when leaving the screen. Account selection is transient and creates no saved budget.

Use Create budget → Select an account → Continue → enter the monthly plan → Create budget. Test unavailable accounts, empty results, failed-save retention and retry. A lost save response offers a saved-budget check before resubmission. Physical iPhone verification is separate from successful exports; see [slice verification](../../docs/mobile-account-selection-story.md).

## Try the widget editor offline

Open Budget → **Preview sample widgets**. Edit widget names and amounts directly. Top-right Settings opens colour choices and spending rollover preferences; Edit bills opens compact fixed-expense rows with add/remove controls. The fixed-expense amount remains tappable after entering bills. Overlays retain draft edits when closed. Widgets use transparent underlined fields; More info beside the creation title holds the setup explanations and source-history details. Amount inputs accept non-negative DKK with up to two decimal places, using a comma or dot without grouping separators. Add pots by type; existing types are fixed. The summary shows exact totals and over-allocation, and invalid input remains editable. Update savings lets you choose one existing savings row and review before/after amounts before applying. Cancelling keeps the draft unchanged.

The sample amounts are fictional, not generated from an account. Review draft validates locally; nothing is saved. Back/swipe removal asks before discarding edited drafts. The preview remains separate from the account-backed manual creation flow. It never saves sample values automatically.

Device verification still needs keyboard avoidance, narrow layouts, large text, screen-reader overlay/color announcements, savings modal focus and discard navigation. See [widget-editor criteria](../../docs/mobile-widget-editor-story.md).

## Manual budget creation

The customer confirms blank income and allocation amounts in DKK with up to two decimal places, including explicit zero where appropriate. Optional spending-pot rollover settings validate a destination and savings target; only preferences are saved. Month closure and rollover execution remain unavailable.

Live guidance above the widgets and in each widget and the fixed-expense overlay shows income minus all entered allocations. Blank pot amounts remain incomplete and the counter says “Based on amounts entered so far”; invalid nonblank amounts suspend it. Complete income is required. Nothing is filled or redistributed automatically, and saving still requires valid complete inputs. See [allocation-guidance criteria](../../docs/mobile-allocation-guidance-story.md).

Saving freezes the draft until the response arrives. Failures retain inputs; account conflicts and uncertain write outcomes offer a read-only check for an existing saved budget. No automatic resubmission or account switching occurs. Back/swipe confirms discarding an edited draft. Success returns to the new saved plan; other budgets remain separately selectable. Re-entering Budget refreshes the backend list.

The saved overview shows planning rows and amounts. It does not invent actual spending, weekly allowances, accumulated savings or forecasts. Default backend memory storage lasts until server restart; durable PostgreSQL storage remains explicit opt-in outside this task. Physical-device checks are still pending. See [manual creation verification](../../docs/mobile-budget-creation-story.md).

Fixed-expense bill rows offer Monthly, Quarterly, Every 6 months and Yearly inside the overlay. Enter the amount per payment; the row shows its monthly equivalent and the header shows Set aside per month. Choosing frequency never replaces the payment amount. Saved plans display both frequency and monthly allocation. More info explains rounding and the absence of payment scheduling/catch-up funding.

Account selection, manual creation and the sample preview use a compact back-arrow control with a 44 × 44 touch target and the screen-reader label “Back”. Existing discard confirmation remains in the routes; the control is disabled while creation is saving.


Inside Fixed expenses, Add bill focuses the new bill name and scrolls it into view. Next (or the keyboard submit action) moves to its amount. OK dismisses the keyboard without closing the overlay; Done becomes available once editing and the keyboard have ended. Close remains available in the header. Physical-device keyboard, scrolling and accessibility verification is still pending.

## Visual design

The native interface now uses Apple-inspired system typography, light surfaces, rounded tinted tiles, blue capsule actions and an inset icon tab bar, drawing on MobilePay’s simpler tile-based design. See [visual refresh criteria and verification](../../docs/mobile-visual-refresh-story.md). Existing workflows and money semantics are preserved; physical-device visual and accessibility checks remain pending.

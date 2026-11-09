# Native mobile app

First frontend delivery: React Native, TypeScript and Expo SDK 58 with Expo Router. Four working tabs open on Budget. Create budget opens account selection; Home, Cards and More are explicit demo screens. Account selection reads the local backend profile, masked accounts, coverage and existing budgets. Budget editing/saving and login remain deferred.

## Start on iPhone

1. Install current Node 24 LTS (minimum 24.3; `nvm install && nvm use` if using nvm). Node 22.13+ is also supported. The host's original Node 24.2 is too old for this React Native release.
2. From the **BudgetBuilderDanskeBank repository root**, run `npm ci`, then `npm run dev:mobile`.
3. Install Expo Go on the iPhone. Put the computer and iPhone on the same local Wi-Fi network.
4. Scan Metro's QR code with the iPhone Camera and open it in Expo Go. Allow local-network access if prompted. Keep Metro running; stop with Ctrl+C.
5. If discovery fails, check Wi-Fi isolation, VPN and firewall settings. The introduction works offline; account selection requires the local backend.

Android uses the same Metro command and Expo Go QR scanner. No Xcode, Android Studio, cloud build or store release is required for Expo Go.

The project targets Expo SDK 58 to match the installed iOS Expo Go version. Expo Go on a physical iPhone supports the current SDK only. Follow [Expo's upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) and align all Expo/React Native dependencies together when upgrading.

After a dependency upgrade, stop Metro and run `npm run start --workspace @budget-builder/mobile -- --clear` from the repository root, then scan the new QR code. The `a` key launches Android through local Android SDK/ADB tooling; it is not needed when opening Expo Go by scanning the QR code on a physical phone.

## Commands (repository root)

| Command | Purpose |
| --- | --- |
| `npm run dev:mobile` | Start only Metro on the LAN |
| `npm run test:mobile` | Native component/navigation tests (Jest Expo) |
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
- `src/features/budget/screens`: budget introduction.
- `src/features/shell`: demo screens, navigation bar and colocated navigation tests.
- `assets/fonts`: local Open Sans Regular/SemiBold and OFL license, sourced from `@expo-google-fonts/open-sans@0.4.2`. No runtime font downloads.

The Figma reference is [Your money, organised](https://www.figma.com/design/0ka6z9Ob7PgioGkZfnEN4V?node-id=194-9). Layout adapts to native safe areas and scalable text. Create budget now opens the account-selection slice; Continue remains disabled until the budget editor is implemented.

## Device verification checklist — pending

Physical iPhone and Android testing has not been performed. No simulator is installed on the verification host. Before accepting device UX:

- Cold-launch on Budget and switch through all tabs; verify selected announcements with VoiceOver/TalkBack.
- Confirm Create budget opens account selection; Continue remains disabled and no budget is saved.
- Check portrait/landscape, home indicator/notch, scrolling and the largest accessibility text size.
- Check header wrapping, tab labels, at least 44 × 44 touch areas and all text contrast.
- Reopen with Metro serving the bundle; fonts must come from bundled assets, not a font CDN.

Automated results and remaining limitations are recorded in `docs/mobile-shell-verification.md` at the repository root.

## Connect account selection to the local backend

From the repository root, run `npm run dev:backend:lan` on a trusted private Wi-Fi network. This explicitly binds the demo backend to all local interfaces; the normal `npm run dev:backend` remains loopback-only. This is unauthenticated demo data, never a public deployment or a real bank connection.

Create ignored `apps/mobile/.env` from `.env.example` and set `EXPO_PUBLIC_API_URL=http://<your-Mac-Wi-Fi-IP>:3001`. The phone cannot use the Mac's `localhost`. Use `ipconfig getifaddr en0` on macOS to find the Wi-Fi IP. This public setting is bundled into the app; never put secrets in it. Restart Metro after changes. If port 3001 is already occupied, use `PORT=3002 npm run dev:backend:lan` and the same port in the mobile URL. The local verification setup uses port 3002.

`npm run dev:mobile` builds the shared contracts before starting Metro. For tests or exports after a fresh checkout, run `npm run build --workspace @budget-builder/contracts` first. Existing schemas validate every response. Profile, accounts and budgets must all load before an account becomes selectable; a budget-list failure cannot bypass account exclusivity. Requests time out after 10 seconds and are cancelled when leaving the screen. Account selection is transient and creates no saved budget.

Use Create budget → Select an account → Back. Test unavailable accounts, empty results and retry by stopping/restarting the backend. Physical iPhone verification is separate from successful exports; see [slice verification](../../docs/mobile-account-selection-story.md).

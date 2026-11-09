# Native mobile app

First frontend delivery: React Native, TypeScript and Expo SDK 58 with Expo Router. Four working tabs open on Budget. Create budget is disabled; Home, Cards and More are explicit demo screens. No banking data, API calls, database, authentication or budget logic is included.

## Start on iPhone

1. Install current Node 24 LTS (minimum 24.3; `nvm install && nvm use` if using nvm). Node 22.13+ is also supported. The host's original Node 24.2 is too old for this React Native release.
2. From the **BudgetBuilderDanskeBank repository root**, run `npm ci`, then `npm run dev:mobile`.
3. Install Expo Go on the iPhone. Put the computer and iPhone on the same local Wi-Fi network.
4. Scan Metro's QR code with the iPhone Camera and open it in Expo Go. Allow local-network access if prompted. Keep Metro running; stop with Ctrl+C.
5. If discovery fails, check Wi-Fi isolation, VPN and firewall settings. No backend server is required.

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

The Figma reference is [Your money, organised](https://www.figma.com/design/0ka6z9Ob7PgioGkZfnEN4V?node-id=194-9). Layout adapts to native safe areas and scalable text. The disabled creation action and its explanation are deliberate differences from the active Figma button.

## Device verification checklist — pending

Physical iPhone and Android testing has not been performed. No simulator is installed on the verification host. Before accepting device UX:

- Cold-launch on Budget and switch through all tabs; verify selected announcements with VoiceOver/TalkBack.
- Confirm Create budget is disabled, its explanation is reachable and no budget appears.
- Check portrait/landscape, home indicator/notch, scrolling and the largest accessibility text size.
- Check header wrapping, tab labels, at least 44 × 44 touch areas and all text contrast.
- Reopen with Metro serving the bundle; fonts must come from bundled assets, not a font CDN.

Automated results and remaining limitations are recorded in `docs/mobile-shell-verification.md` at the repository root.

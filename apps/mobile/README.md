# StitchHub Mobile

Flutter mobile app for **Customers**, **Fashion Designers** (atelier staff), and **Platform Admins**, built with clean architecture and Bloc state management.

## Architecture

```
lib/
├── core/           # Network, storage, sync, notifications, payments, theme
├── domain/         # Entities + repository contracts
├── data/           # Models, API/local datasources, repository implementations
├── presentation/   # Bloc + pages + widgets
├── injection_container.dart
├── app.dart
└── main.dart
```

| Layer | Responsibility |
|-------|----------------|
| **Presentation** | UI, Bloc/Cubit, role-based shells |
| **Domain** | Business entities, repository interfaces |
| **Data** | REST API (Dio), Hive cache, offline sync queue |

## Features

- **Role-based navigation** — Super Admin, Fashion Designer/Staff, Customer portals
- **Bloc state management** — Auth, Orders, Dashboard, Messages, Billing, Sync
- **Offline sync** — Hive local cache + sync queue for orders, messages, customers
- **Push notifications** — Firebase Cloud Messaging + local notifications
- **Paystack payments** — Subscription billing via in-app WebView checkout
- **JWT auth** — Secure token storage + automatic refresh on 401

## Getting started

### Prerequisites

- Flutter 3.24+
- Xcode (iOS) / Android Studio (Android)
- Running StitchHub API (production: `https://stitchhub-gb1w.onrender.com/api/v1`)

### Install & run

```bash
cd apps/mobile
flutter pub get
flutter run
```

### API URL

Default production API is configured in `lib/core/constants/app_constants.dart`.

Override at runtime:

```bash
flutter run --dart-define=API_BASE_URL=http://localhost:3001/api/v1
```

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Platform Admin | `admin@stitchhub.com` | `admin123` |
| Fashion House Owner | `owner@elegantstitches.com` | `demo1234` |

## Push notifications setup

Firebase config files are wired for project **`stitchhubpromax`** (project number `359558295805`):

- `lib/firebase_options.dart`
- `android/app/google-services.json`
- `ios/Runner/GoogleService-Info.plist`
- `firebase.json` / `.firebaserc`

### Register apps & fetch API keys

1. In [Firebase Console](https://console.firebase.google.com/project/stitchhubpromax), add:
   - **Android** app — package `com.stitchhub.stitchhub_mobile`
   - **iOS** app — bundle ID `com.stitchhub.stitchhubMobile`
2. Enable **Cloud Messaging**
3. Run locally:

```bash
firebase login
chmod +x apps/mobile/scripts/configure_firebase.sh
./apps/mobile/scripts/configure_firebase.sh
```

Or manually:

```bash
cd apps/mobile
flutterfire configure --project=stitchhubpromax
```

## Offline sync

When offline:

- **Reads** — Orders, customers, and messages load from Hive cache
- **Writes** — Create order, update status, send message, create customer are queued
- **Reconnect** — `SyncManager` automatically flushes the queue when connectivity returns

## Paystack billing

Fashion house owners can upgrade plans from **Billing**:

1. `GET /subscriptions/paystack/config` — check if enabled
2. `POST /subscriptions/paystack/initialize` — open Paystack checkout WebView
3. `GET /subscriptions/paystack/verify?reference=...` — confirm payment

## Project structure by role

| Role | Screens |
|------|---------|
| **Super Admin** | Platform overview, fashion houses, messages, settings |
| **Designer / Staff** | Dashboard, orders, customers, support messages, billing |
| **Customer** | Home, order tracking with progress, settings |

## Known API gaps

- Style catalog has no REST endpoints yet
- Order Paystack checkout is manual payment recording only (subscription uses Paystack)
- Password reset not implemented in mobile
- Image upload not implemented in mobile
- FCM token is cached locally but not yet registered with the API
- Customer measurements screen exists on web only (not mobile yet)

## Release signing (Play Store)

Google Play rejects builds signed with the debug key. Release builds use `android/key.properties` + a upload keystore (both gitignored).

**First-time setup** (already done on this machine if `android/key.properties` exists):

```bash
cd apps/mobile/android
keytool -genkeypair -v \
  -keystore app/stitchhub-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias stitchhub \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=StitchHub, OU=Mobile, O=JustApps, L=Lagos, ST=Lagos, C=NG"

cp key.properties.example key.properties
# Edit key.properties with your passwords
```

**Build signed release artifacts:**

```bash
cd apps/mobile
flutter build apk --release
flutter build appbundle --release
```

- APK: `build/app/outputs/flutter-apk/app-release.apk`
- AAB: `build/app/outputs/bundle/release/app-release.aab`

Back up `stitchhub-release.jks` and `key.properties` securely — you need the same key for all future Play Store updates.

## Build test APKs

```bash
cd apps/mobile
flutter clean
flutter pub get
flutter build apk --debug    # test APK for physical devices
flutter build apk --release  # smaller release APK
```

**APK locations:**

- Debug: `build/app/outputs/flutter-apk/app-debug.apk`
- Release: `build/app/outputs/flutter-apk/app-release.apk`

**Install on a physical device (USB debugging enabled):**

```bash
# From repo root
pnpm install:mobile:android          # installs debug APK
pnpm install:mobile:android:release  # installs release APK

# Or manually
adb install -r build/app/outputs/flutter-apk/app-debug.apk
```

Copy the APK to your phone and open it if you prefer sideloading without USB.

## Scripts

```bash
flutter analyze
flutter test
flutter build apk --debug
flutter build apk --release
flutter build ios
```

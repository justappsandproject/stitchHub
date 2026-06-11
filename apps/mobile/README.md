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

Firebase config files are included for project **`stitchhub-mobile`**:

- `lib/firebase_options.dart`
- `android/app/google-services.json`
- `ios/Runner/GoogleService-Info.plist`
- `firebase.json` / `.firebaserc`

### Connect your Firebase project

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com) (or use existing)
2. Enable **Cloud Messaging** in Firebase Console
3. Regenerate config with FlutterFire:

```bash
dart pub global activate flutterfire_cli
cd apps/mobile
flutterfire configure --project=YOUR_FIREBASE_PROJECT_ID
```

This replaces placeholder API keys with your real project credentials.

4. For iOS push: upload APNs key in Firebase Console → Project Settings → Cloud Messaging
5. Enable **Push Notifications** capability in Xcode for the Runner target

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

- Customer self-registration/login endpoint not yet on API (CUSTOMER role exists in schema)
- Style catalog has no REST endpoints yet
- Order Paystack checkout is manual payment recording only (subscription uses Paystack)

## Scripts

```bash
flutter analyze
flutter test
flutter build apk
flutter build ios
```

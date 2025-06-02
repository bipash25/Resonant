
# Resonant

Resonant is a cross-platform music streaming application that provides a comprehensive, free, and optimized user experience. It integrates multiple music sources, supports offline caching, user accounts, playlists, favorites, lyrics (with romanization), and heuristic-based recommendations. The frontend is built with Flutter (Dart), and the backend uses Node.js with TypeScript and a PostgreSQL database.

---

## Table of Contents

1. [Features](#features)  
2. [Tech Stack](#tech-stack)  
3. [Prerequisites](#prerequisites)  
4. [Installation & Setup](#installation--setup)  
   - [Frontend (Flutter)](#frontend-flutter)  
   - [Backend (Node.js + TypeScript)](#backend-nodejs--typescript)  
   - [Database Migrations](#database-migrations)  
5. [Directory Structure](#directory-structure)  
   - [Flutter Frontend](#flutter-frontend)  
   - [Backend](#backend)  
6. [Running the App](#running-the-app)  
   - [Frontend](#frontend)  
   - [Backend](#backend-1)  
7. [Environment Variables](#environment-variables)  
8. [Scripts](#scripts)  
9. [Contributing](#contributing)  
10. [License](#license)  

---

## Features

- **Unified Music Aggregation**:  
  - Integrates YouTube, JioSaavn, SoundCloud (and more) through modular adapters.  
- **Offline Caching**:  
  - Uses SQLite/Drift on the client to cache track metadata, lyrics, and user preferences.  
- **User Accounts & Sync**:  
  - Enables login/sign-up, stores playlists, favorites, and preferences in the cloud.  
- **Playlists & Queue Management**:  
  - Custom playlists, “Play Next” & “Add to Queue,” and automatic queue generation.  
- **Lyrics & Romanization**:  
  - Displays synchronized lyrics with a toggle for romanized text.  
- **Heuristic Recommendations**:  
  - Generates personalized recommendations based on listening history and favorites.  
- **Minimal Data Usage**:  
  - Adaptive streaming with efficient codecs, low CPU/memory footprint.  
- **Gaming Mode**:  
  - Minimizes resource usage during gaming sessions by disabling non-essential features.  
- **Sleep Mode**:  
  - Auto-pause playback after a user-defined duration or at a set time.  
- **Crossfade & Gapless Playback**:  
  - Seamless transitions between tracks.  
- **Equalizer & Audio Effects**:  
  - Pre-set equalizer modes with minimal CPU overhead.  
- **Lockscreen & Notification Controls**:  
  - Single-line live lyrics and playback controls.

---

## Tech Stack

- **Frontend**:  
  - Language: Dart  
  - Framework: Flutter  
  - Local Database: SQLite (via Drift)  
  - State Management: Provider / Riverpod / Bloc (choose as preferred)  
  - Audio Playback: just_audio plugin  

- **Backend**:  
  - Language: TypeScript  
  - Runtime: Node.js  
  - Framework: Express.js  
  - Database: PostgreSQL  
  - ORM / Query Builder: (Optional) Knex, TypeORM, or direct `pg` usage  
  - Authentication: JWT (JSON Web Tokens)  
  - Testing: Jest  

- **Dev & Tools**:  
  - Git/GitHub  
  - VS Code / Android Studio / Xcode (for Flutter)  
  - Docker (optional, for containerized setup)  

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Flutter SDK** (latest stable)  
- **Dart SDK** (comes with Flutter)  
- **Node.js** (v18+ recommended)  
- **npm** (v8+ recommended)  
- **PostgreSQL** (v13+ recommended)  
- **Git**  
- **Android Studio** (or Xcode) for mobile emulators  
- (Optional) **Docker** and **Docker Compose** for containerized database setup  

---

## Installation & Setup

### Frontend (Flutter)

1. **Navigate to the Flutter project:**  
   ```bash
   cd myapp
   ```

2. **Install dependencies:**
   ```bash
   flutter pub get
   ```

3. **Set up local environment file:**

   * Create a file at `myapp/lib/core/config/env.dart` (this file is ignored by Git).
   * Add any API keys or flags needed (e.g., debug vs. production endpoints).
   * Example:
     ```
     const String API\_BASE\_URL = "[http://localhost:3000/api](http://localhost:3000/api)";
     ```

4. **Run on an emulator or physical device:**

   ```bash
   flutter run
   ```

   * For desktop (Windows/macOS/Linux), ensure Flutter desktop support is enabled:

     ```bash
     flutter config --enable-windows-desktop
     flutter run -d windows
     ```

### Backend (Node.js + TypeScript)

1. **Navigate to the backend directory:**

   ```bash
   cd myapp/backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   * Create a `.env` file in `myapp/backend`.
   * Add the following variables (adjust values as needed):
     ```
     DATABASE\_URL=postgresql://<user>:<password>@localhost:5432/resonant\_db
     JWT\_SECRET=your\_jwt\_secret\_key
     PORT=3000
     ```

4. **Set up PostgreSQL database:**

   * Create a new database:

     ```bash
     psql -U <user> -c "CREATE DATABASE resonant_db;"
     ```
   * Run migrations (assuming you have a migration tool configured in `package.json`):

     ```bash
     npm run migrate
     ```

5. **Start the backend server:**

   * In development (with auto-reload):

     ```bash
     npm run dev
     ```
   * In production (compiled to JavaScript):

     ```bash
     npm run build
     npm start
     ```

### Database Migrations

* Migration files are located in `myapp/backend/src/models/migrations/` (for SQL files) or in a directory configured by your ORM.
* To apply migrations:

  ```bash
  cd myapp/backend
  npm run migrate
  ```
* To roll back (if using a migration tool that supports it):

  ```bash
  npm run migrate:rollback
  ```

---

## Directory Structure

Below is an overview of the main directory structure for both frontend and backend. Placeholder files and comments guide where functionality will be implemented.

```
myapp/
├── android/                     # Flutter Android project files
├── ios/                         # Flutter iOS project files
├── lib/
│   ├── main.dart                # Flutter app entry point
│   ├── core/
│   │   ├── config/
│   │   │   ├── app_config.dart   # App-level configuration (base URLs, constants)
│   │   │   └── env.dart          # Environment-specific variables (ignored by VCS)
│   │   ├── network/
│   │   │   └── network_client.dart  # HTTP client setup (Dio/HttpClient)
│   │   ├── routes/
│   │   │   └── app_router.dart    # Route definitions and navigation
│   │   ├── state/
│   │   │   └── app_state.dart     # Global state management (e.g., auth status)
│   │   └── utils/
│   │       ├── logger.dart        # Logging utility
│   │       └── validation_utils.dart  # Input validation helpers
│   ├── data/
│   │   ├── models/
│   │   │   ├── user.dart           # User data model
│   │   │   ├── track.dart          # Track data model
│   │   │   ├── playlist.dart       # Playlist data model
│   │   │   ├── lyrics.dart         # Lyrics data model
│   │   │   └── favorite.dart       # Favorite data model
│   │   ├── repositories/
│   │   │   ├── user_repository.dart
│   │   │   ├── track_repository.dart
│   │   │   ├── playlist_repository.dart
│   │   │   ├── lyrics_repository.dart
│   │   │   └── favorites_repository.dart
│   │   └── datasources/
│   │       ├── local/
│   │       │   ├── database.dart        # Drift database setup
│   │       │   ├── user_dao.dart         # CRUD operations for User
│   │       │   ├── track_dao.dart        # CRUD operations for Track
│   │       │   ├── playlist_dao.dart     # CRUD for Playlist
│   │       │   ├── favorites_dao.dart    # CRUD for Favorites
│   │       │   └── lyrics_dao.dart       # CRUD for Lyrics
│   │       └── remote/
│   │           ├── youtube_datasource.dart     # YouTube API integration
│   │           ├── jiosaavn_datasource.dart    # JioSaavn API integration
│   │           └── soundcloud_datasource.dart  # SoundCloud API integration
│   ├── features/
│   │   ├── authentication/
│   │   │   ├── ui/
│   │   │   │   ├── login_screen.dart
│   │   │   │   └── signup_screen.dart
│   │   │   └── state/
│   │   │       └── auth_state.dart
│   │   ├── home/
│   │   │   ├── ui/
│   │   │   │   └── home_screen.dart
│   │   │   └── state/
│   │   │       └── home_state.dart
│   │   ├── player/
│   │   │   ├── ui/
│   │   │   │   └── player_screen.dart
│   │   │   └── state/
│   │   │       └── player_state.dart
│   │   ├── search/
│   │   │   ├── ui/
│   │   │   │   └── search_screen.dart
│   │   │   └── state/
│   │   │       └── search_state.dart
│   │   ├── playlist/
│   │   │   ├── ui/
│   │   │   │   └── playlist_screen.dart
│   │   │   └── state/
│   │   │       └── playlist_state.dart
│   │   ├── favorites/
│   │   │   ├── ui/
│   │   │   │   └── favorites_screen.dart
│   │   │   └── state/
│   │   │       └── favorites_state.dart
│   │   ├── lyrics/
│   │   │   ├── ui/
│   │   │   │   └── lyrics_screen.dart
│   │   │   └── state/
│   │   │       └── lyrics_state.dart
│   │   └── recommendations/
│   │       ├── ui/
│   │       │   └── recommendations_screen.dart
│   │       └── state/
│   │           └── recommendations_state.dart
│   ├── themes/
│   │   └── app_theme.dart           # Theme definitions (colors, text styles)
│   └── widgets/
│       ├── custom_button.dart       # Reusable button component
│       ├── custom_list_tile.dart    # Reusable list tile component
│       └── custom_app_bar.dart      # Reusable app bar component
├── pubspec.yaml                    # Flutter dependencies and assets
├── android/
├── ios/
└── backend/
    ├── package.json                # Backend dependencies and scripts
    ├── tsconfig.json               # TypeScript configuration
    ├── .env                         # Environment variables (ignored by VCS)
    └── src/
        ├── index.ts                # Server entry point
        ├── config/
        │   └── db.ts               # Database connection setup
        ├── middleware/
        │   └── auth.ts             # Authentication middleware
        ├── models/
        │   ├── migrations/
        │   │   ├── 001_create_users_table.sql
        │   │   ├── 002_create_playlists_table.sql
        │   │   ├── 003_create_tracks_table.sql
        │   │   ├── 004_create_playlist_tracks_table.sql
        │   │   ├── 005_create_lyrics_table.sql
        │   │   └── 006_create_user_favorites_table.sql
        │   └── user.ts             # User model definitions / interfaces
        ├── controllers/
        │   ├── auth.controller.ts  # Login, signup, token issuance
        │   ├── user.controller.ts  # User profile, preferences
        │   ├── playlist.controller.ts
        │   ├── track.controller.ts
        │   └── lyrics.controller.ts
        ├── services/
        │   ├── auth.service.ts     # Business logic for auth
        │   ├── user.service.ts     # User-related logic
        │   ├── playlist.service.ts
        │   ├── track.service.ts    # Integrates with music source adapters
        │   └── lyrics.service.ts
        ├── routes/
        │   ├── auth.routes.ts      # `/api/auth/...`
        │   ├── user.routes.ts      # `/api/users/...`
        │   ├── playlist.routes.ts  # `/api/playlists/...`
        │   ├── track.routes.ts     # `/api/tracks/...`
        │   └── lyrics.routes.ts    # `/api/lyrics/...`
        ├── utils/
        │   ├── logger.ts           # Logging utility
        │   └── validation.ts       # Request validation helpers
        ├── types/
        │   └── index.ts            # TypeScript interfaces (IUser, ITrack, etc.)
        └── tests/
            ├── auth.test.ts        # Auth tests
            ├── user.test.ts        # User tests
            └── track.test.ts       # Track tests
```

---

## Running the App

### Frontend

1. **Ensure the backend server is running** (port 3000 by default).
2. **Run the Flutter app**:
   ```
   flutter pub get
   flutter run
   ```
3. **Available Targets**:

   * Mobile: Android (`flutter run -d emulator-5554`) or iOS (`flutter run -d <device_id>`)
   * Desktop: Windows/macOS/Linux (`flutter run -d windows` or `macos` or `linux`)

### Backend

1. **Ensure PostgreSQL is running** and the `resonant_db` database exists.
2. **Install dependencies**:
   ```
   cd backend
   npm install
   ```
3. **Run migrations**:
   ```
   npm run migrate
   ```
4. **Start the server**:

   * Development (auto-reload):
     ```
     npm run dev
     ```
   * Production:
     ```
     npm run build
     npm start
     ```

---

## Environment Variables

Both frontend and backend rely on environment variables to configure endpoints and secrets. Below is a sample `.env` for the backend:

```
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/resonant_db
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

For the frontend, you can create `lib/core/config/env.dart` and define:

```dart
const String API_BASE_URL = "http://localhost:3000/api";
```

---

## Scripts

### Frontend

* `flutter pub get` – Install Flutter dependencies.
* `flutter run` – Run the app on connected devices/emulators.
* `flutter build apk` – Build Android APK.
* `flutter build ios` – Build iOS app.
* `flutter build windows` (or `macos`/`linux`) – Build desktop binaries.

### Backend

* `npm run dev` – Start backend with `ts-node` and `nodemon` for auto-reload.
* `npm run start` – Start compiled JavaScript server.
* `npm run build` – Compile TypeScript to JavaScript.
* `npm run migrate` – Run database migrations.
* `npm test` – Run Jest tests.

---

## Contributing

1. **Fork the repository**.
2. **Clone your fork**:

   ```
   git clone https://github.com/bipash25/resonant.git
   ```
3. **Create a feature branch**:

   ```
   git checkout -b feature/your-feature-name
   ```
4. **Implement your feature** and write tests.
5. **Commit your changes**:

   ```
   git commit -m "Add feature: description"
   ```
6. **Push to your branch**:

   ```
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request** on the main repository.
8. **Address review feedback** and update as needed.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Thank you for using **Resonant**! We hope you enjoy building and extending this powerful, lightweight, and free music streaming application.

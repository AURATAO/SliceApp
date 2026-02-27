# SliceApp (SLICE)

A 7-day goal splitter + daily execution tracker.

- Go backend (REST API) + Postgres (Supabase)
- React Native (Expo) mobile app
- UI style: Retro-Future / Swiss-inspired collage

---

## Project Structure

sliceApp/
backend/ # Go API server
app/ # Expo React Native app

---

## Prerequisites

### Backend

- Go 1.21+ recommended
- A Postgres database (Supabase or local)

### Frontend

- Node.js 18+ recommended
- Expo Go app on your phone (iOS/Android)

---

## Backend — Start Server (Go)

### 1 Create `.env` in `backend/`

Inside `sliceApp/backend/`, create a file named `.env`:

````env
# Example (Supabase)
DATABASE_URL=postgresql://postgres:<PASSWORD>@<HOST>:5432/postgres?sslmode=require
PORT=8080

# Optional CORS (set this if you restrict origins)
# CORS_ORIGIN=http://localhost:19006

# Optional AI (if you use AI generation)
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
USE_FAKE_AI=true

Install dependencies
cd backend
go mod tidy

Run the API server
cd backend
go run ./cmd/api

By default it runs at:
http://localhost:8080

## Frontend — Start Expo App
cd app
npm install
Start Expo with clean cache (only when needed)
npx expo start --clear


## iOS TestFlight (EAS)

### Prerequisites
- Apple Developer Program enrolled
- App created in App Store Connect (Bundle ID: `com.auratao.slicegoals`)
- EAS project configured (`eas build:configure`)

### Build & Submit
Before uploading a new iOS build, bump the build number:
- `app.json` → `expo.ios.buildNumber` (must increase every upload)

Then run:

```bash
cd app
eas build -p ios --profile production
eas submit -p ios --profile production
````

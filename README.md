# VoiceScribe AI — Speech-to-Text Transcription Platform

> A full-stack AI-powered transcription platform built on the MERN stack. Record live audio, upload files, and get accurate transcriptions in seconds — with speaker detection, word timestamps, and a private workspace per user.

---

## Introduction

**VoiceScribe AI** is a Speech-to-Text SaaS application that lets users convert voice into accurate text in real time. Users can either upload pre-recorded audio files (MP3, WAV, WEBM, OGG, M4A) or record live audio directly in the browser — with a live camera feed, real-time subtitle overlay, and instant transcription output powered by the Deepgram Nova model.

The platform is secured with JWT-based authentication, stores transcriptions per user in MongoDB, and provides a clean professional dark-theme dashboard with history management, copy, download (TXT/SRT), and settings toggles.

Built as a 14-day structured assignment project covering full-stack development, REST APIs, third-party AI API integration, database design, and deployment.

---

## Use Cases

| Use Case | Description |
|---|---|
| **Meeting Transcription** | Record meetings and get a full written transcript automatically |
| **Lecture Notes** | Students record lectures and convert them to readable text |
| **Content Creation** | Podcasters and YouTubers transcribe episodes for show notes and captions |
| **Accessibility** | Deaf or hard-of-hearing users read live subtitles of spoken content |
| **Medical Dictation** | Doctors dictate notes hands-free and get structured text output |
| **Legal Documentation** | Lawyers transcribe depositions and court recordings quickly |
| **Subtitle Generation** | Generate SRT subtitle files for video content with one click |

---

## Industry Value

Speech-to-Text is one of the fastest-growing segments in AI, with the global market projected to exceed **$26 billion by 2030** (CAGR ~17%). Key reasons this technology has high industry value:

- **Productivity** — Transcribing a 1-hour meeting manually takes 4–6 hours. AI does it in under a minute.
- **Searchability** — Audio is unsearchable. Text transcripts make spoken content indexable and retrievable.
- **Compliance** — Regulated industries (legal, healthcare, finance) require documented records of verbal communication.
- **Inclusivity** — Live captions remove communication barriers for millions of people with hearing disabilities.
- **Cost reduction** — AI transcription costs a fraction of human transcription services ($0.0043/min vs $1–3/min for humans).

VoiceScribe directly addresses all five value drivers in a single integrated platform.

---

## Roles & Responsibilities

This project was built as a solo full-stack assignment covering every layer of the application:

| Layer | Responsibility |
|---|---|
| **Frontend (React + Vite)** | UI design, component architecture, state management, routing |
| **Backend (Node.js + Express)** | REST API design, file upload handling, auth middleware |
| **Database (MongoDB + Mongoose)** | Schema design, CRUD operations, per-user data isolation |
| **AI Integration (Deepgram)** | API configuration, audio buffer sending, transcript extraction |
| **Authentication (JWT)** | Register/login flows, token generation, protected routes |
| **DevOps** | Environment variable management, `.gitignore`, deployment config |

---

## Tech Stack & Rationale

### Frontend
| Technology | Why chosen |
|---|---|
| **React 19** | Component-based UI, fast re-renders, large ecosystem |
| **Vite 8** | Instant dev server, faster than CRA, native ESM |
| **Tailwind CSS 3** | Utility-first, no context switching, consistent dark theme tokens |
| **React Router v6** | Declarative routing, protected route patterns |
| **Axios** | Cleaner API calls than fetch, interceptors, timeout support |
| **Lucide React** | Consistent SVG icon set, tree-shakeable |

### Backend
| Technology | Why chosen |
|---|---|
| **Node.js** | Non-blocking I/O ideal for file uploads and API calls |
| **Express.js 5** | Minimal, flexible REST API framework |
| **Multer** | Industry-standard multipart file upload middleware |
| **Mongoose** | Schema validation and ODM layer for MongoDB |
| **JWT (jsonwebtoken)** | Stateless auth, no server-side session storage needed |
| **bcryptjs** | Secure password hashing with salt rounds |
| **dotenv** | Environment variable isolation |

### Database
| Technology | Why chosen |
|---|---|
| **MongoDB Atlas** | Document store, flexible schema, free tier, cloud-hosted |

### AI / Speech-to-Text
| Technology | Why chosen |
|---|---|
| **Deepgram Nova** | Best accuracy/price ratio, 40+ languages, fastest response time among alternatives (Google STT, Whisper, AssemblyAI) |

---

## Technologies Used — Explained

### React (Frontend Framework)
React is a JavaScript library for building user interfaces using reusable **components**. In this project, every UI section (sidebar, recording panel, transcript output, settings panel) is a separate component. React's `useState` manages all local state (recording status, transcription text, history) and `useEffect` handles side effects like checking the backend on load and attaching camera streams.

### Vite (Build Tool)
Vite replaces Create React App as the build tool. It uses native ES modules in development for instant server start and Hot Module Replacement — meaning code changes appear in the browser in milliseconds without a full reload.

### Tailwind CSS (Styling)
Tailwind is a utility-first CSS framework. Instead of writing custom CSS files, styles are applied directly as class names. The project uses a custom Tailwind config with a `saas-*` color palette (`saas-base`, `saas-surface`, `saas-elevated`) and gradient tokens (`grad-primary`) to maintain a consistent dark SaaS design system across all components.

### Node.js + Express (Backend)
Node.js runs JavaScript on the server. Express adds a routing layer on top, making it easy to define REST API endpoints (`GET /`, `POST /upload`, `GET /transcriptions`, `DELETE /transcriptions/:id`). Express middleware handles CORS, JSON parsing, file upload, and authentication in a pipeline.

### Multer (File Upload)
Multer is Express middleware for handling `multipart/form-data` — the format used when uploading files. It saves incoming audio files to an `uploads/` folder with a timestamped filename, validates MIME types, and passes the file metadata to the route handler.

### MongoDB + Mongoose (Database)
MongoDB stores data as flexible JSON-like documents. Mongoose adds a schema layer, so each transcription document has a defined structure: `filename`, `transcription` (text), `user` (reference to auth user), and `createdAt` timestamp. Each user can only see their own transcriptions — enforced at the query level with `user: req.user.id`.

### Deepgram (Speech-to-Text AI)
Deepgram's Nova model receives a raw audio buffer and MIME type, and returns a structured JSON response with the transcript text, confidence scores, word-level timestamps, and speaker labels. The backend reads the uploaded file into a buffer and sends it to Deepgram's `preRecorded` transcription API. The extracted transcript is then saved to MongoDB and returned to the frontend.

### JWT Authentication (jsonwebtoken + bcryptjs)
On registration, the user's password is hashed with bcrypt before storage. On login, the submitted password is compared to the hash. If valid, a signed JWT token is returned to the frontend and stored (in localStorage or memory). Every protected API request sends this token in the `Authorization: Bearer <token>` header. The `authMiddleware` verifies and decodes it, attaching `req.user` for downstream handlers.

### Web APIs (Browser-native, no library)
- **MediaRecorder API** — records microphone audio in chunks (`.webm` format) directly in the browser
- **getUserMedia API** — requests permission for camera and microphone access
- **Web Speech API** (`SpeechRecognition`) — provides real-time live subtitles during recording without any backend call
- **Clipboard API** — copies transcript text to clipboard

---

## All Functionalities

### Authentication
- User registration with name, email, password
- Secure login with JWT token
- Protected dashboard route — redirects to login if not authenticated
- Logout clears session
- Remember me (30-day session)
- Forgot password flow

### Audio Input
- **Drag & Drop** audio file upload zone (MP3, WAV, WEBM, OGG, M4A — up to 100MB)
- **Browse Files** button for manual file selection
- **Live Recording** with microphone capture via MediaRecorder API
- Audio preview player appears after file select or recording stops
- File validation — rejects non-audio types and oversized files

### Live Recording Panel
- Camera feed displayed in a 16:9 video container during recording
- **REC badge** with animated red dot overlay
- **Live subtitle overlay** at the bottom of the video — powered by Web Speech API
- Recording timer counting up in MM:SS
- Animated waveform bars during recording
- **Mic On/Off toggle** — mutes/unmutes audio tracks without stopping recording
- **Camera On/Off toggle** — shows/hides video feed (uses `opacity` not `display:none`)
- **Stop Recording** button — stops all tracks, fires `onstop`, saves audio blob

### Transcription
- Sends audio to backend via `POST /upload` with `multipart/form-data`
- Language selector (Auto Detect, English, Spanish, French, German, Hindi, Portuguese, Arabic, Chinese, Japanese)
- Speaker Detection toggle — sends `speakerDiarization` flag to API
- Word Timestamps toggle — sends `wordTimestamps` flag to API
- Auto-save toggle — controls whether transcript is saved to database after each run
- Loading state with spinner during processing
- Error toast on API failure with specific server message

### Transcript Output
- Full transcript displayed with word-wrap in a scrollable panel
- **Word count** badge
- **Duration** badge
- **Copy to clipboard** button
- **Download TXT** — plain text file
- **Download SRT** — subtitle file format for video editors
- **Clear** transcript button

### History (Left Sidebar)
- Lists all past transcriptions for the logged-in user (most recent first)
- Shows filename and relative timestamp (e.g. "2 min ago", "3 days ago")
- Click any history item to load its transcript into the output panel
- **Copy** button per history item
- **Delete** button per history item with loading spinner
- Empty state illustration when no transcriptions exist yet

### Settings Panel (Right Sidebar)
- Backend connection status indicator (green = connected, red = offline)
- Transcription count display
- Speaker Detection toggle
- Word Timestamps toggle
- Auto-save toggle

### Error Handling
- Toast notifications for all errors and successes (auto-dismiss 3.5s)
- Field-level validation errors on auth forms
- Backend offline detection on dashboard load
- Unsupported file type rejection
- File size limit enforcement (100MB)
- Camera/mic permission denied handling with fallback to audio-only

---

## Project Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Deepgram API key — [get one free at deepgram.com](https://deepgram.com)

### 1. Clone the repository
```bash
git clone https://github.com/vijayalaxmi0703/speech-to-text.git
```

### 2. Install frontend dependencies
```bash
npm install
```

### 3. Install backend dependencies
```bash
cd backend
npm install
```

### 4. Set up environment variables
See [Environment Variables](#environment-variables) below.

### 5. Run backend
```bash
cd backend
npm run dev        # uses nodemon for auto-restart
```

### 6. Run frontend
```basht
npm run dev        # starts Vite dev server at localhost:5173
```

---

## Environment Variables

### backend —
```env
VITE_API_URL=https://speech-to-text-bz58.onrender.com
```
## API Reference

### Auth Routes — `/api/auth`

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login and receive JWT | No |

### Transcription Routes

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| GET | `/` | Backend health check | No |
| POST | `/upload` | Upload audio and transcribe | Yes |
| GET | `/transcriptions` | Get all transcriptions for user | Yes |
| DELETE | `/transcriptions/:id` | Delete a transcription by ID | Yes |

### Request — POST `/upload`
```
Content-Type: multipart/form-data

Fields:
  audio           — audio file (required)
  language        — string e.g. "English" (optional)
  speakerDiarization — boolean string (optional)
  wordTimestamps  — boolean string (optional)
```

### Response — POST `/upload`
```json
{
  "message": "Transcription successful",
  "transcription": "Hello this is the transcribed text."
}
```

---

## Folder Structure

```
voicescribe-ai/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── .env
├── .gitignore
│
├── src/
│   ├── main.jsx                  # React entry point
│   ├── AppRoutes.jsx             # Route definitions + auth guards
│   ├── App.jsx                   # Legacy app shell
│   ├── App.css                   # Global animation styles
│   ├── index.css                 # Tailwind imports + base styles
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx         # Main dashboard (recording, upload, transcript)
│   │   └── Auth.jsx              # Sign In / Sign Up page
│   │
│   ├── components/
│   │   ├── Toast.jsx             # Notification toast component
│   │   ├── DropZone.jsx          # Drag & drop file upload zone
│   │   ├── Waveform.jsx          # Animated audio waveform (idle state)
│   │   ├── AudioPreview.jsx      # HTML5 audio player for preview
│   │   ├── HistoryCard.jsx       # Single history item card
│   │   ├── ProtectedRoute.jsx    # Auth guard wrapper
│   │   └── ErrorBoundary.jsx     # React error boundary
│   │
│   └── utils/
│       ├── api.js                # Axios instance with base URL + auth header
│       └── context/
│           └── AuthContext.jsx   # Auth state provider (user, login, logout, ready)
│
└── backend/
    ├── server.js                 # Express app, routes, Deepgram integration
    ├── package.json
    ├── .env
    │
    ├── routes/
    │   └── auth.js               # /api/auth/register and /api/auth/login
    │
    ├── middleware/
    │   └── authMiddleware.js     # JWT verification middleware
    │
    ├── models/
    │   ├── User.js               # Mongoose user schema
    │   └── Transcription.js      # Mongoose transcription schema
    │
    └── uploads/                  # Temporary audio file storage (auto-cleared)
```

---

## Resources

- [Deepgram Documentation](https://developers.deepgram.com/docs)
- [Best Speech-to-Text APIs Comparison](https://deepgram.com/learn/best-speech-to-text-apis)
- [Top Free STT APIs & Open Source Engines](https://www.assemblyai.com/blog/the-top-free-speech-to-text-apis-and-open-source-engines)
- [MongoDB Atlas Getting Started](https://www.mongodb.com/docs/atlas/getting-started/)
- [Supabase JS Reference](https://supabase.com/docs/reference/javascript/initializing)
- [Web Speech API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [MediaRecorder API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

---

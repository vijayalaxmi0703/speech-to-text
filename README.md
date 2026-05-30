

> AI-powered speech-to-text SaaS — upload audio or record live voice and get instant transcriptions.

Built with the MERN stack, Deepgram Nova, JWT auth, and a professional dark-theme React dashboard.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 3 |
| Backend | Node.js, Express.js 5 |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcryptjs |
| Transcription | Deepgram SDK v2 (Nova model) |
| File Uploads | Multer |
| Icons / Routing | Lucide React, React Router DOM v6 |

---

## Features

- Audio file upload (MP3, WAV, WEBM, M4A)
- Live microphone recording with real-time subtitles
- Camera feed with subtitle overlay during recording
- Transcript history saved per user in MongoDB
- Google OAuth + Mobile OTP sign-in
- Forgot password via email or SMS OTP (Twilio)
- Export transcripts as TXT / SRT
- Responsive three-panel dashboard

---

## Quick Start

**1. Clone and install**

```bash
git clone https://github.com/your-username/voicescribe-ai.git

cd voicescribe-ai/backend && npm install
cd ../frontend && npm install
```

**2. Set up environment variables** (see below)

**3. Run**

```bash
# Terminal 1 — backend
cd backend && npm run dev       # http://localhost:5000

# Terminal 2 — frontend
cd frontend && npm run dev      # http://localhost:5173
```

---

## Environment Variables

### `backend/.env`

```env
MONGO_URI=your_mongodb_atlas_connection_string
PORT=5000
JWT_SECRET=your_min_32_char_random_secret

DEEPGRAM_API_KEY=your_deepgram_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Twilio SMS OTP
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SID=VAxxxxxxxxxxxxxxxx

# Email OTP
EMAIL_HOST=smtp.resend.com
EMAIL_USER=resend
EMAIL_PASS=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:5000
VITE_DEEPGRAM_API_KEY=deepgram_key
```


## API Reference

All protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Sign in, receive JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/auth/forgot-password` | No | Send OTP to email/phone |
| POST | `/api/auth/verify-otp` | No | Verify OTP code |
| POST | `/api/auth/reset-password` | No | Set new password |
| GET | `/api/auth/google` | No | Google OAuth redirect |
| POST | `/upload` | Yes | Upload audio → transcription |
| GET | `/transcriptions` | Yes | Fetch user's transcripts |
| DELETE | `/transcriptions/:id` | Yes | Delete transcript |

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Backend | [Render](https://render.com) | Root dir: `backend`, start: `npm start` |
| Frontend | [Vercel](https://vercel.com) | Root dir: `frontend`, preset: Vite |
| Database | [MongoDB Atlas](https://mongodb.com/atlas) | Whitelist `0.0.0.0/0` for cloud |

**Authorized redirect URIs**:
`https://your-api.onrender.com/api/auth/google/callback`

---

## License
Built by **Vijaya Laxmi**
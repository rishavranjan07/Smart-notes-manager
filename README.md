# Smart Note Manager

A smart note manager with secure accounts, Markdown notes, PDF import, AI summaries, and generated revision quizzes.

## Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express, MongoDB/Mongoose
- **AI:** Google Gemini (`@google/generative-ai`)
- **Auth:** JWT with password hashing

## Run locally

1. Copy `server/.env.example` to `server/.env`, then set `JWT_SECRET` and `GEMINI_API_KEY`.
2. Start MongoDB. Either use your MongoDB Atlas connection string in `MONGODB_URI`, or, with Docker installed, run `docker compose up -d` and keep the default local URI from `.env.example`.
3. Run `npm install` in the root, then `npm run install:all`.
4. Run `npm run dev`, then open `http://localhost:5173`.

If the browser shows a Vite proxy error, look at the **server** terminal. It must print `API running at http://127.0.0.1:5000`; a missing `.env` file or an unavailable MongoDB server will prevent it from starting.

For Gemini, create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey). The project uses Google’s current `@google/genai` SDK; configure `GEMINI_MODEL` if your account uses a different enabled model. The PDF importer uses local text extraction first, then sends the extracted text to Gemini only when you request a summary or quiz.

Gemini occasionally returns a temporary `503 UNAVAILABLE` response during capacity spikes. The API automatically retries these transient calls with exponential backoff. If all retries fail, wait about a minute and try again; this is a Gemini service-capacity condition rather than an issue with the note.

## API overview

`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`  
`GET|POST /api/notes`, `GET|PATCH|DELETE /api/notes/:id`  
`POST /api/notes/import-pdf`, `POST /api/notes/:id/analyze`  
`GET|POST /api/notes/:id/quiz-attempts`

`/analyze` makes one structured Gemini request for a summary, key bullet points, and a content-aware number of MCQs. Quiz attempts are saved privately against both the signed-in user and source note.

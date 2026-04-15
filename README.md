# Software Construction Exam Project

A full-stack movie discovery platform built with **Django REST Framework** (backend) and **Next.js** (frontend), powered by The Movie Database (TMDB) API.

## Project Structure

```
├── backend/          # Django REST API
│   ├── cinequest/    # Project settings & URLs
│   ├── movies/       # Movies app (models, views, TMDB service)
│   ├── users/        # Custom user model & auth
│   └── recommendations/  # Recommendation engine & watchlist
├── frontend/         # Next.js application
│   ├── src/app/      # Pages (home, search, describe, movie detail, etc.)
│   ├── src/components/  # Reusable UI components
│   ├── src/lib/      # API client, auth context, utilities
│   └── src/types/    # TypeScript type definitions
```

## Getting Started

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py sync_movies --genres
python manage.py sync_movies --trending 2
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Copy the root [`.env.example`](./.env.example) to `backend/.env` and set values (never commit real secrets):

- `TMDB_API_KEY` — required for TMDB and `sync_movies`
- `DJANGO_SECRET_KEY` — set a strong value in production
- `DATABASE_URL` — optional locally (defaults to SQLite); use Postgres in production
- `CORS_ORIGINS` — include your Next.js origin(s)

The frontend uses `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8000/api`) so the browser calls the correct API base URL. See [`frontend/.env.example`](./frontend/.env.example) for a frontend-only template.

**Curated collections:** the UI route [`/collections`](./frontend/src/app/collections/page.tsx) reads staff-defined lists from `GET /api/movies/collections/` and `GET /api/movies/collections/<slug>/` (see [`backend/movies/curated_collections.py`](./backend/movies/curated_collections.py)).

### Deploying the frontend (e.g. Vercel)

- Set **Root Directory** to `frontend` (or equivalent in your host).
- Add **`NEXT_PUBLIC_API_URL`** to your production (and preview, if needed) environment, pointing at your deployed API (for example `https://your-api.example.com/api`).
- On the Django side, add your Vercel app origin(s) to **`CORS_ORIGINS`** (production URL and preview URLs if the browser calls the API from those hosts).

## Deployment (backend)

The repo includes a [`Procfile`](./Procfile) (release migrations + `gunicorn`) and [`build.sh`](./build.sh) to install Python dependencies and run `collectstatic`. On your host, set the same variables as in `.env.example`, especially `DATABASE_URL`, `DJANGO_SECRET_KEY`, `ALLOWED_HOSTS`, and `CORS_ORIGINS` pointing at your deployed frontend URL.

## TMDB API
Get your free API key at: https://www.themoviedb.org/settings/api

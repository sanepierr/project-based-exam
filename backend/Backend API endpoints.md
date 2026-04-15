# Backend API Endpoints and Validation Examples

This document lists all backend API endpoints in `project-based-exam-main/backend`, including HTTP methods, auth requirements, and example requests to verify they are working.

Base URL used in examples:

- `http://127.0.0.1:8000`

---

## 1) Authentication and Users

### 1.1 Register User
- **Endpoint:** `POST /api/users/register/`
- **Auth:** Public

```bash
curl -X POST "http://127.0.0.1:8000/api/users/register/" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","email":"testuser1@example.com","password":"StrongPass123!"}'
```

Expected:
- `201 Created` with user payload
- `400 Bad Request` for weak password/duplicate email/invalid fields

### 1.2 Login (JWT Token Obtain)
- **Endpoint:** `POST /api/auth/token/`
- **Auth:** Public

```bash
curl -X POST "http://127.0.0.1:8000/api/auth/token/" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","password":"StrongPass123!"}'
```

Expected:
- `200 OK` with `access` and `refresh` tokens

### 1.3 Refresh JWT
- **Endpoint:** `POST /api/auth/token/refresh/`
- **Auth:** Public (requires valid refresh token)

```bash
curl -X POST "http://127.0.0.1:8000/api/auth/token/refresh/" \
  -H "Content-Type: application/json" \
  -d '{"refresh":"<your_refresh_token>"}'
```

Expected:
- `200 OK` with a new access token

### 1.4 User Profile
- **Endpoint:** `GET /api/users/profile/`
- **Auth:** Bearer token required

```bash
curl "http://127.0.0.1:8000/api/users/profile/" \
  -H "Authorization: Bearer <access_token>"
```

Expected:
- `200 OK` with current user profile
- `401 Unauthorized` without/invalid token

### 1.5 Update User Profile
- **Endpoint:** `PATCH /api/users/profile/`
- **Auth:** Bearer token required

```bash
curl -X PATCH "http://127.0.0.1:8000/api/users/profile/" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"User"}'
```

Expected:
- `200 OK` with updated profile

---

## 2) Movies API

## Public movie discovery/search endpoints

### 2.1 Search Movies
- **Endpoint:** `GET /api/movies/search/?q=<query>&page=1`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/search/?q=fight&page=1"
```

Expected:
- `200 OK` with `results`
- `400` if `q` missing

### 2.2 Trending Movies
- **Endpoint:** `GET /api/movies/trending/?window=week&page=1`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/trending/?window=week&page=1"
```

### 2.3 Now Playing
- **Endpoint:** `GET /api/movies/now-playing/?page=1`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/now-playing/?page=1"
```

### 2.4 Top Rated
- **Endpoint:** `GET /api/movies/top-rated/?page=1`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/top-rated/?page=1"
```

### 2.5 TMDB Movie Detail
- **Endpoint:** `GET /api/movies/tmdb/<tmdb_id>/?sync=true|false`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/tmdb/550/?sync=true"
```

### 2.6 TMDB Movie Videos (Trailer API)
- **Endpoint:** `GET /api/movies/tmdb/<tmdb_id>/videos/`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/tmdb/550/videos/"
```

Expected:
- `200 OK` with `trailer` and `all_videos`
- `404` if movie not found

### 2.7 Search People
- **Endpoint:** `GET /api/movies/people/search/?q=<name>`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/people/search/?q=nolan"
```

### 2.8 Mood List
- **Endpoint:** `GET /api/movies/moods/`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/moods/"
```

### 2.9 Mood Movies
- **Endpoint:** `GET /api/movies/moods/<mood_slug>/?page=1`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/moods/cozy-night/?page=1"
```

Expected:
- `200 OK` for valid mood
- `404` for unknown mood

### 2.10 Describe Movies (Semantic Search)
- **Endpoint:** `POST /api/movies/describe/`
- **Auth:** Public

```bash
curl -X POST "http://127.0.0.1:8000/api/movies/describe/" \
  -H "Content-Type: application/json" \
  -d '{"description":"superhero, dark city, vigilante","page":1}'
```

Expected:
- `200 OK` with `results`, `chips`, and optional `detected_mood`

### 2.11 Discover with Filters
- **Endpoint:** `GET /api/movies/discover/`
- **Auth:** Public

Example:
```bash
curl "http://127.0.0.1:8000/api/movies/discover/?genre=28&year_from=2010&year_to=2025&rating_min=7&runtime_min=90&runtime_max=180&language=en&sort=popularity.desc&page=1"
```

### 2.12 Compare Movies
- **Endpoint:** `GET /api/movies/compare/?ids=550,680`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/compare/?ids=550,680"
```

Expected:
- `200 OK` with `movies`
- `400` when fewer than 2 IDs

---

## 3) DRF Router Endpoints under `/api/movies/`

These come from viewsets (`list`, `genres`, `people`).

### 3.1 Movie List (local DB)
- **Endpoint:** `GET /api/movies/list/`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/list/"
```

### 3.2 Movie Detail by local DB PK
- **Endpoint:** `GET /api/movies/list/<id>/`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/list/1/"
```

### 3.3 Movie Recommendations Action
- **Endpoint:** `GET /api/movies/list/<id>/recommendations/`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/list/1/recommendations/"
```

### 3.4 Movie Similar Action
- **Endpoint:** `GET /api/movies/list/<id>/similar/`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/list/1/similar/"
```

### 3.5 Movie Wikipedia Enrich Action
- **Endpoint:** `GET /api/movies/list/<id>/wikipedia/`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/list/1/wikipedia/"
```

### 3.6 Genre List and Detail
- **Endpoints:** `GET /api/movies/genres/`, `GET /api/movies/genres/<slug>/`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/genres/"
curl "http://127.0.0.1:8000/api/movies/genres/action/"
```

### 3.7 Genre Movies Action
- **Endpoint:** `GET /api/movies/genres/<slug>/movies/?page=1&sort=popularity.desc`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/genres/action/movies/?page=1&sort=popularity.desc"
```

### 3.8 People List and Detail
- **Endpoints:** `GET /api/movies/people/`, `GET /api/movies/people/<id>/`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/people/"
curl "http://127.0.0.1:8000/api/movies/people/1/"
```

### 3.9 People Enrich Action
- **Endpoint:** `GET /api/movies/people/<id>/enrich/`
- **Auth:** Public

```bash
curl "http://127.0.0.1:8000/api/movies/people/1/enrich/"
```

---

## 4) Recommendations API (Authenticated)

All endpoints below require:

- Header: `Authorization: Bearer <access_token>`

### 4.1 Personalized Recommendations
- **Endpoint:** `GET /api/recommendations/for-you/?page=1`

```bash
curl "http://127.0.0.1:8000/api/recommendations/for-you/?page=1" \
  -H "Authorization: Bearer <access_token>"
```

### 4.2 Because You Watched
- **Endpoint:** `GET /api/recommendations/because-you-watched/`

```bash
curl "http://127.0.0.1:8000/api/recommendations/because-you-watched/" \
  -H "Authorization: Bearer <access_token>"
```

### 4.3 Genre Preferences
- **Endpoint:** `GET /api/recommendations/preferences/`

```bash
curl "http://127.0.0.1:8000/api/recommendations/preferences/" \
  -H "Authorization: Bearer <access_token>"
```

### 4.4 Track Interaction
- **Endpoint:** `POST /api/recommendations/track/`

```bash
curl -X POST "http://127.0.0.1:8000/api/recommendations/track/" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"movie_tmdb_id":550,"movie_title":"Fight Club","interaction_type":"like","genre_ids":[18,53],"rating":9}'
```

Expected:
- `201 Created` when payload is valid

### 4.5 Dashboard Stats
- **Endpoint:** `GET /api/recommendations/dashboard/`

```bash
curl "http://127.0.0.1:8000/api/recommendations/dashboard/" \
  -H "Authorization: Bearer <access_token>"
```

---

## 5) Watchlist Endpoints (Authenticated, DRF ModelViewSet)

### 5.1 List Watchlist
- **Endpoint:** `GET /api/recommendations/watchlist/`

```bash
curl "http://127.0.0.1:8000/api/recommendations/watchlist/" \
  -H "Authorization: Bearer <access_token>"
```

### 5.2 Add Watchlist Item
- **Endpoint:** `POST /api/recommendations/watchlist/`

```bash
curl -X POST "http://127.0.0.1:8000/api/recommendations/watchlist/" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"movie_tmdb_id":550,"movie_title":"Fight Club","poster_path":"/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"}'
```

### 5.3 Watchlist Item Detail
- **Endpoint:** `GET /api/recommendations/watchlist/<id>/`

```bash
curl "http://127.0.0.1:8000/api/recommendations/watchlist/1/" \
  -H "Authorization: Bearer <access_token>"
```

### 5.4 Update Watchlist Item
- **Endpoint:** `PATCH /api/recommendations/watchlist/<id>/`

```bash
curl -X PATCH "http://127.0.0.1:8000/api/recommendations/watchlist/1/" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"is_watched":true}'
```

### 5.5 Delete Watchlist Item
- **Endpoint:** `DELETE /api/recommendations/watchlist/<id>/`

```bash
curl -X DELETE "http://127.0.0.1:8000/api/recommendations/watchlist/1/" \
  -H "Authorization: Bearer <access_token>"
```

Expected:
- `204 No Content` on success

### 5.6 Mark Watchlist Item as Watched
- **Endpoint:** `POST /api/recommendations/watchlist/<id>/mark_watched/`

```bash
curl -X POST "http://127.0.0.1:8000/api/recommendations/watchlist/1/mark_watched/" \
  -H "Authorization: Bearer <access_token>"
```

---

## 6) Quick Validity Smoke Checks

Use these to quickly confirm backend health:

1. **Public check**
```bash
curl "http://127.0.0.1:8000/api/movies/trending/?page=1"
```

2. **Method check (should fail with 405)**
```bash
curl -X POST "http://127.0.0.1:8000/api/movies/search/" -H "Content-Type: application/json" -d '{"q":"fight"}'
```

3. **Validation check (should fail with 400)**
```bash
curl "http://127.0.0.1:8000/api/movies/search/"
```

4. **Auth check (should fail with 401)**
```bash
curl "http://127.0.0.1:8000/api/recommendations/dashboard/"
```

5. **Auth success check**
```bash
curl "http://127.0.0.1:8000/api/recommendations/dashboard/" \
  -H "Authorization: Bearer <access_token>"
```


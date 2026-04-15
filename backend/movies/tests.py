from datetime import date
from unittest.mock import patch, MagicMock
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

from movies.models import Movie, Genre, Person, MovieCast

User = get_user_model()

FAKE_TMDB_SEARCH_RESPONSE = {
    "results": [
        {
            "id": 550,
            "title": "Fight Club",
            "overview": "A ticking-Loss bomb insomniac...",
            "release_date": "1999-10-15",
            "vote_average": 8.4,
            "vote_count": 25000,
            "popularity": 60.5,
            "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
            "backdrop_path": "/hZkgoQYus5dXo3H8T7Uef6DNknx.jpg",
            "genre_ids": [18, 53],
        }
    ],
    "total_pages": 1,
    "total_results": 1,
}


class MovieModelTest(TestCase):
    """Tests for the Movie model properties and string representation."""

    def setUp(self):
        self.genre = Genre.objects.create(tmdb_id=28, name="Action", slug="action")
        self.movie = Movie.objects.create(
            tmdb_id=550,
            title="Fight Club",
            overview="A ticking-loss bomb insomniac...",
            vote_average=8.4,
            vote_count=25000,
            popularity=60.5,
            poster_path="/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
            backdrop_path="/hZkgoQYus5dXo3H8T7Uef6DNknx.jpg",
            trailer_key="SUXWAEX2jlg",
            release_date=date(1999, 10, 15),
        )
        self.movie.genres.add(self.genre)

    def test_str_includes_title_and_year(self):
        self.assertEqual(str(self.movie), "Fight Club (1999)")

    def test_poster_url_builds_correct_path(self):
        self.assertIn("/w500/", self.movie.poster_url)
        self.assertIn(self.movie.poster_path, self.movie.poster_url)

    def test_poster_url_small_uses_w185(self):
        self.assertIn("/w185/", self.movie.poster_url_small)

    def test_backdrop_url_uses_w1280(self):
        self.assertIn("/w1280/", self.movie.backdrop_url)

    def test_trailer_url_points_to_youtube(self):
        self.assertEqual(
            self.movie.trailer_url,
            "https://www.youtube.com/watch?v=SUXWAEX2jlg",
        )

    def test_trailer_embed_url_uses_embed(self):
        self.assertEqual(
            self.movie.trailer_embed_url,
            "https://www.youtube.com/embed/SUXWAEX2jlg",
        )

    def test_null_paths_return_none(self):
        empty_movie = Movie.objects.create(tmdb_id=999, title="Empty")
        self.assertIsNone(empty_movie.poster_url)
        self.assertIsNone(empty_movie.backdrop_url)
        self.assertIsNone(empty_movie.trailer_url)


class GenreModelTest(TestCase):
    """Tests for Genre model."""

    def test_genre_str(self):
        genre = Genre.objects.create(tmdb_id=28, name="Action", slug="action")
        self.assertEqual(str(genre), "Action")

    def test_genre_movie_relationship(self):
        genre = Genre.objects.create(tmdb_id=35, name="Comedy", slug="comedy")
        movie = Movie.objects.create(tmdb_id=100, title="Funny Movie")
        movie.genres.add(genre)
        self.assertIn(movie, genre.movies.all())


class SearchEndpointTest(APITestCase):
    """Tests that the search endpoint accepts GET and returns correct structure."""

    @patch("movies.views.tmdb")
    def test_search_returns_results(self, mock_tmdb):
        mock_tmdb.search_movies.return_value = FAKE_TMDB_SEARCH_RESPONSE
        response = self.client.get("/api/movies/search/", {"q": "fight club"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(response.data["query"], "fight club")
        self.assertEqual(len(response.data["results"]), 1)

    def test_search_without_query_returns_400(self):
        response = self.client.get("/api/movies/search/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("movies.views.tmdb")
    def test_search_rejects_post(self, mock_tmdb):
        response = self.client.post("/api/movies/search/", {"q": "test"})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class TrendingEndpointTest(APITestCase):
    """Tests that the trending endpoint works correctly."""

    @patch("movies.views.tmdb")
    def test_trending_returns_results(self, mock_tmdb):
        mock_tmdb.get_trending_movies.return_value = FAKE_TMDB_SEARCH_RESPONSE
        response = self.client.get("/api/movies/trending/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)

    @patch("movies.views.tmdb")
    def test_trending_rejects_post(self, mock_tmdb):
        response = self.client.post("/api/movies/trending/")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class MoodEndpointTest(APITestCase):
    """Tests for mood list and mood movies endpoints."""

    def test_mood_list_returns_all_moods(self):
        response = self.client.get("/api/movies/moods/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [m["slug"] for m in response.data]
        self.assertIn("cozy-night", slugs)
        self.assertIn("adrenaline", slugs)

    def test_invalid_mood_returns_404(self):
        response = self.client.get("/api/movies/moods/nonexistent-mood/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class CompareEndpointTest(APITestCase):
    """Tests for the compare movies endpoint."""

    def test_compare_without_ids_returns_400(self):
        response = self.client.get("/api/movies/compare/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_compare_with_single_id_returns_400(self):
        response = self.client.get("/api/movies/compare/", {"ids": "550"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


FAKE_TMDB_DETAIL = {
    "id": 550,
    "title": "Fight Club",
    "overview": "Test overview",
    "release_date": "1999-10-15",
    "vote_average": 8.4,
    "vote_count": 25000,
    "popularity": 60.5,
    "poster_path": "/pB8BM7.jpg",
    "backdrop_path": "/hZkgo.jpg",
    "genres": [{"id": 18, "name": "Drama"}, {"id": 53, "name": "Thriller"}],
}


class CuratedCollectionsAPITest(APITestCase):
    """Curated collections list + detail (TMDB-backed, mocked)."""

    def test_collection_list_returns_slugs(self):
        response = self.client.get("/api/movies/collections/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        slugs = [r["slug"] for r in response.data["results"]]
        self.assertIn("modern-sci-fi", slugs)
        self.assertTrue(all("movie_count" in r for r in response.data["results"]))

    def test_collection_detail_404(self):
        response = self.client.get("/api/movies/collections/does-not-exist/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch("movies.views.tmdb")
    def test_collection_detail_returns_movies(self, mock_tmdb):
        mock_tmdb.get_movie_details.return_value = FAKE_TMDB_DETAIL
        response = self.client.get("/api/movies/collections/modern-sci-fi/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["slug"], "modern-sci-fi")
        self.assertIn("results", response.data)
        self.assertGreater(len(response.data["results"]), 0)
        self.assertEqual(response.data["results"][0]["title"], "Fight Club")

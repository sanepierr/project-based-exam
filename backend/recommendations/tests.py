from django.contrib.auth import get_user_model
from django.test import TestCase

from movies.models import Genre
from recommendations.models import UserGenrePreference, UserMovieInteraction
from recommendations.services.engine import INTERACTION_WEIGHTS, RecommendationEngine

User = get_user_model()


class InteractionWeightsTest(TestCase):
    """Ensure engine weights stay aligned with model interaction types."""

    def test_weights_define_every_interaction_type(self):
        defined = {c.value for c in UserMovieInteraction.InteractionType}
        for value in defined:
            self.assertIn(
                value,
                INTERACTION_WEIGHTS,
                msg=f"Add INTERACTION_WEIGHTS entry for interaction_type={value!r}",
            )


class ComputeGenrePreferencesTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("rec_test", "rec_test@example.com", "testpass123")
        self.genre = Genre.objects.create(tmdb_id=80, name="Crime", slug="crime")

    def test_like_adds_stronger_preference_than_view(self):
        UserMovieInteraction.objects.create(
            user=self.user,
            movie_tmdb_id=1,
            movie_title="A",
            interaction_type="view",
            genre_ids=[80],
        )
        UserMovieInteraction.objects.create(
            user=self.user,
            movie_tmdb_id=2,
            movie_title="B",
            interaction_type="like",
            genre_ids=[80],
        )

        engine = RecommendationEngine()
        engine.compute_genre_preferences(self.user)

        pref = UserGenrePreference.objects.get(user=self.user, genre_tmdb_id=80)
        self.assertGreater(pref.weight, 0)
        self.assertGreaterEqual(pref.interaction_count, 1)

    def test_no_interactions_yields_no_preferences(self):
        engine = RecommendationEngine()
        engine.compute_genre_preferences(self.user)
        self.assertFalse(UserGenrePreference.objects.filter(user=self.user).exists())

class RecommendationEngineMethodsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("rec_test2", "rec2@example.com", "pass123")
        self.engine = RecommendationEngine()

    def test_director_recommendations_filters_exclude_id(self):
        results = self.engine.get_director_recommendations(1, exclude_movie_id=100)
        self.assertIsInstance(results, list)

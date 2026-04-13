import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Movie, Genre, Person
from .serializers import (
    MovieCompactSerializer, MovieDetailSerializer,
    GenreSerializer, PersonCompactSerializer, PersonDetailSerializer,
    TMDBMovieSerializer,
)
from .services.tmdb_service import TMDBService, MovieSyncService, WikipediaService

logger = logging.getLogger(__name__)
tmdb = TMDBService()
sync_service = MovieSyncService()

## Movie ViewSet
class MovieViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Movie.objects.prefetch_related("genres", "directors").all()
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["genres__slug"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return MovieDetailSerializer
        return MovieCompactSerializer

    @action(detail=True, methods=["get"])
    def recommendations(self, request, pk=None):
        movie = self.get_object()
        data = tmdb.get_movie_recommendations(movie.tmdb_id)
        results = data.get("results", [])
        serializer = TMDBMovieSerializer(results, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def similar(self, request, pk=None):
        movie = self.get_object()
        data = tmdb.get_similar_movies(movie.tmdb_id)
        results = data.get("results", [])
        serializer = TMDBMovieSerializer(results, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def wikipedia(self, request, pk=None):
        movie = self.get_object()
        year = movie.release_date.year if movie.release_date else None
        wiki_data = WikipediaService.get_movie_summary(movie.title, year)

        if wiki_data.get("summary"):
            movie.wikipedia_summary = wiki_data["summary"]
            movie.wikipedia_url = wiki_data["url"]
            movie.save(update_fields=["wikipedia_summary", "wikipedia_url"])

        return Response(wiki_data)


## Genre ViewSet
class GenreViewSet(viewsets.ReadOnlyModelViewSet):
    """Genres API."""
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    @action(detail=True, methods=["get"])
    def movies(self, request, slug=None):
        """GET /api/movies/genres/{slug}/movies/ → movies in this genre."""
        genre = self.get_object()
        page = int(request.query_params.get("page", 1))
        sort = request.query_params.get("sort", "popularity.desc")

        # Try local DB first
        local_movies = Movie.objects.filter(genres=genre).order_by("-popularity")
        if local_movies.count() >= 20:
            paginator = self.paginate_queryset(local_movies)
            serializer = MovieCompactSerializer(paginator, many=True)
            return self.get_paginated_response(serializer.data)

        # Fallback to TMDB API
        data = tmdb.get_movies_by_genre(genre.tmdb_id, page=page, sort_by=sort)
        results = data.get("results", [])
        serializer = TMDBMovieSerializer(results, many=True)
        return Response({
            "results": serializer.data,
            "total_pages": data.get("total_pages", 1),
            "total_results": data.get("total_results", 0),
            "page": page,
        })


## Person ViewSet

class PersonViewSet(viewsets.ReadOnlyModelViewSet):
    """People (directors, actors) API."""
    queryset = Person.objects.all()
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PersonDetailSerializer
        return PersonCompactSerializer

    @action(detail=True, methods=["get"])
    def enrich(self, request, pk=None):
        person = self.get_object()
        data = tmdb.get_person_details(person.tmdb_id)

        if data:
            person.biography = data.get("biography", "")
            person.birthday = data.get("birthday") or None
            person.place_of_birth = data.get("place_of_birth", "")
            person.save()

        serializer = PersonDetailSerializer(person)
        return Response(serializer.data)


## standalone endpoints

@api_view(["GET"])
@permission_classes([AllowAny])
def search_movies(request):
    query = request.query_params.get("q", "").strip()
    page = int(request.query_params.get("page", 1))

    if not query:
        return Response(
            {"error": "Query parameter 'q' is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = tmdb.search_movies(query, page=page)
    results = data.get("results", [])
    serializer = TMDBMovieSerializer(results, many=True)

    return Response({
        "results": serializer.data,
        "total_pages": data.get("total_pages", 1),
        "total_results": data.get("total_results", 0),
        "page": page,
        "query": query,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def trending_movies(request):
    window = request.query_params.get("window", "week")
    page = int(request.query_params.get("page", 1))

    data = tmdb.get_trending_movies(time_window=window, page=page)
    results = data.get("results", [])
    serializer = TMDBMovieSerializer(results, many=True)

    return Response({
        "results": serializer.data,
        "total_pages": data.get("total_pages", 1),
        "page": page,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def now_playing(request):
    page = int(request.query_params.get("page", 1))
    data = tmdb.get_now_playing(page=page)
    results = data.get("results", [])
    serializer = TMDBMovieSerializer(results, many=True)
    return Response({"results": serializer.data, "page": page})


@api_view(["GET"])
@permission_classes([AllowAny])
def top_rated(request):
    page = int(request.query_params.get("page", 1))
    data = tmdb.get_top_rated_movies(page=page)
    results = data.get("results", [])
    serializer = TMDBMovieSerializer(results, many=True)
    return Response({"results": serializer.data, "page": page})


@api_view(["GET"])
@permission_classes([AllowAny])
def movie_detail_tmdb(request, tmdb_id):

    sync = request.query_params.get("sync", "false").lower() == "true"

    if sync:
        movie = sync_service.sync_movie(tmdb_id)
        if movie:
            serializer = MovieDetailSerializer(movie)
            return Response(serializer.data)

    data = tmdb.get_movie_details(tmdb_id)
    if not data:
        return Response(
            {"error": "Movie not found"}, status=status.HTTP_404_NOT_FOUND
        )

    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def search_people(request):
    query = request.query_params.get("q", "").strip()
    if not query:
        return Response(
            {"error": "Query parameter 'q' is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = tmdb.search_people(query)
    return Response(data)


# Mood keywords for auto-detection from free-text descriptions
_MOOD_KEYWORDS = {
    "cozy-night": ["cozy", "comfort", "relaxing", "warm", "gentle", "calm", "peaceful", "chill"],
    "adrenaline": ["action", "fight", "explosive", "intense", "fast", "chase", "combat", "war"],
    "date-night": ["romantic", "love", "romance", "date", "charming", "sweet", "heartfelt"],
    "mind-bender": ["twist", "mind", "puzzle", "complex", "cerebral", "reality", "trippy", "paradox"],
    "feel-good": ["uplifting", "happy", "funny", "joyful", "wholesome", "heartwarming", "inspiring"],
    "edge-of-seat": ["suspense", "thriller", "dark", "creepy", "tense", "horror", "scary", "gritty"],
    "epic-adventure": ["epic", "adventure", "journey", "quest", "hero", "fantasy", "grand", "mythic"],
    "cry-it-out": ["sad", "emotional", "drama", "tragic", "moving", "tears", "grief", "bittersweet"],
    "family-fun": ["family", "kids", "animated", "cartoon", "children", "fun", "playful"],
    "documentary-deep-dive": ["documentary", "true story", "real", "history", "educational", "factual"],
}


def _detect_mood(text: str) -> str | None:
    """Return the best-matching mood slug based on keyword overlap, or None."""
    lower = text.lower()
    best_slug, best_count = None, 0
    for slug, words in _MOOD_KEYWORDS.items():
        count = sum(1 for w in words if w in lower)
        if count > best_count:
            best_slug, best_count = slug, count
    return best_slug if best_count >= 1 else None


@api_view(["POST"])
@permission_classes([AllowAny])
def describe_movies(request):
    """
    POST /api/movies/describe/
    Body: { "description": "superhero, meta-human, dark city", "page": 1 }

    Resolves free-text descriptions into TMDB keywords, discovers matching
    movies, and optionally blends mood-based results when a mood is detected.
    """
    description = (request.data.get("description") or "").strip()
    page = int(request.data.get("page", 1))

    if not description:
        return Response(
            {"error": "A description is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    import re

    # Maps trigger words/phrases in descriptions to additional TMDB keyword searches.
    # Bridges the gap between how people describe movies and how TMDB tags them.
    CONCEPT_SYNONYMS = {
        # --- Time / loops / alternate reality ---
        "relive": ["time loop", "repeating day", "déjà vu"],
        "same day": ["time loop", "repeating day"],
        "over and over": ["time loop", "repeating day"],
        "loop": ["time loop"],
        "repeat": ["time loop", "repeating day"],
        "stuck in time": ["time loop", "time travel"],
        "time travel": ["time travel", "time machine"],
        "go back in time": ["time travel", "time machine"],
        "parallel universe": ["parallel universe", "multiverse", "alternate reality"],
        "alternate": ["alternate reality", "parallel universe", "what if"],
        "multiverse": ["multiverse", "parallel universe"],

        # --- Space / sci-fi ---
        "cryo": ["suspended animation", "cryogenics"],
        "cryo-sleep": ["suspended animation", "cryogenics"],
        "stasis": ["suspended animation"],
        "space": ["outer space", "spacecraft", "space travel", "space station"],
        "spaceship": ["spacecraft", "space travel", "spaceship"],
        "vessel": ["spacecraft", "spaceship"],
        "alien": ["alien", "extraterrestrial", "alien creature", "first contact"],
        "aliens": ["alien", "extraterrestrial", "alien invasion"],
        "deadly presence": ["alien creature", "monster", "creature"],
        "space horror": ["alien", "space horror", "monster"],
        "crew": ["spaceship", "spacecraft", "crew"],
        "woken": ["suspended animation", "awakening"],
        "entered their ship": ["stowaway", "alien creature"],
        "cyberpunk": ["cyberpunk", "dystopia", "hacker"],
        "hacking": ["hacker", "computer", "cybercrime"],
        "virtual": ["virtual reality", "simulated reality"],
        "simulation": ["virtual reality", "simulated reality", "computer simulation"],
        "fake reality": ["virtual reality", "simulated reality"],
        "manufactured lie": ["conspiracy", "social experiment", "simulated reality"],
        "not real": ["virtual reality", "simulated reality"],
        "matrix": ["virtual reality", "simulated reality", "chosen one"],
        "robot": ["robot", "artificial intelligence", "android"],
        "artificial intelligence": ["artificial intelligence", "android", "sentient computer"],
        "ai": ["artificial intelligence", "sentient computer"],
        "android": ["android", "robot", "artificial intelligence"],
        "hologram": ["hologram", "artificial intelligence", "virtual reality"],

        # --- Crime / heist / undercover ---
        "heist": ["heist", "robbery", "bank robbery", "caper"],
        "robbery": ["robbery", "bank robbery", "heist"],
        "thieves": ["heist", "robbery", "thief"],
        "steal": ["heist", "robbery", "thief"],
        "getaway": ["getaway", "chase", "escape"],
        "betrayed": ["betrayal", "double cross", "traitor"],
        "betrayal": ["betrayal", "double cross"],
        "double cross": ["double cross", "betrayal", "traitor"],
        "undercover": ["undercover cop", "undercover operation", "mole"],
        "mob": ["organized crime", "mafia", "crime boss"],
        "mafia": ["mafia", "organized crime", "gangster"],
        "gangster": ["gangster", "organized crime", "crime boss"],
        "criminal organization": ["organized crime", "mafia"],
        "cartel": ["drug cartel", "organized crime", "drug trade"],
        "identity": ["identity crisis", "double life", "identity"],
        "lose his identity": ["identity crisis", "double life", "undercover cop"],
        "detective": ["detective", "investigation", "murder investigation"],
        "investigation": ["investigation", "detective", "murder investigation"],
        "murder": ["murder", "murder investigation", "serial killer"],
        "serial killer": ["serial killer", "murder", "psychopath"],
        "killer": ["killer", "serial killer", "murder"],
        "corruption": ["corruption", "police corruption", "political corruption"],
        "vigilante": ["vigilante", "masked vigilante", "one-man army"],
        "noir": ["neo-noir", "film noir"],

        # --- Kidnapping / rescue / missing person ---
        "kidnap": ["kidnapping", "abduction", "missing person"],
        "kidnapped": ["kidnapping", "abduction", "ransom"],
        "abduct": ["abduction", "kidnapping"],
        "missing daughter": ["kidnapping", "missing person", "father daughter"],
        "missing child": ["kidnapping", "missing person", "missing child"],
        "taken": ["kidnapping", "rescue", "one-man army"],
        "ransom": ["ransom", "kidnapping"],
        "rescue": ["rescue", "rescue mission", "one-man army"],
        "daughter": ["father daughter", "kidnapping", "daughter"],
        "father": ["father son", "father daughter", "fatherhood"],
        "law into his own hands": ["vigilante", "revenge", "one-man army"],
        "police fail": ["police corruption", "vigilante justice", "incompetent police"],

        # --- Home / invasion / survival ---
        "home invasion": ["home invasion", "break-in", "intruder"],
        "invaded": ["home invasion", "intruder"],
        "break in": ["home invasion", "break-in"],
        "strangers": ["strangers", "home invasion", "distrust"],
        "helpless": ["survival", "helplessness", "trapped"],
        "wealthy family": ["upper class", "wealthy family", "rich family"],
        "purge": ["purge", "lawlessness", "anarchy"],
        "trapped": ["trapped", "claustrophobia", "escape"],

        # --- Survival / wilderness / nature ---
        "survival": ["survival", "wilderness survival", "stranded"],
        "survive": ["survival", "wilderness survival", "stranded"],
        "crash": ["plane crash", "crash landing", "survival"],
        "plane crash": ["plane crash", "air disaster", "survival"],
        "wilderness": ["wilderness", "wilderness survival", "nature"],
        "freezing": ["cold weather", "winter", "snow", "hypothermia"],
        "predator": ["predator", "animal attack", "creature"],
        "predators": ["predator", "animal attack", "hunted"],
        "wolves": ["wolf", "animal attack", "wilderness survival"],
        "bear": ["bear", "animal attack", "wilderness"],
        "stranded": ["stranded", "survival", "deserted"],
        "elements": ["survival", "nature", "extreme weather"],
        "mountain": ["mountain", "climbing", "survival"],

        # --- Emotion / relationships ---
        "lonely": ["loneliness", "isolation", "solitude"],
        "relationship": ["love", "forbidden love", "romance"],
        "dangerous relationship": ["forbidden love", "obsession"],
        "love": ["love", "romance", "love story"],
        "romantic": ["romance", "love story", "romantic"],
        "emotional": ["emotions", "drama", "tearjerker"],
        "sad": ["tragedy", "tearjerker", "loss"],
        "revenge": ["revenge", "vengeance", "vendetta"],
        "vengeance": ["vengeance", "revenge"],

        # --- Weather / environment / isolation ---
        "snowy": ["snow", "winter", "blizzard", "arctic"],
        "snow": ["snow", "winter", "blizzard"],
        "arctic": ["arctic", "antarctica", "polar", "ice"],
        "antarctic": ["antarctica", "arctic", "polar"],
        "blizzard": ["blizzard", "snow", "winter", "storm"],
        "cold": ["cold weather", "winter", "snow", "hypothermia"],
        "research station": ["research station", "research facility", "remote location"],
        "scientists": ["scientist", "research", "experiment"],
        "isolated": ["isolation", "remote location", "stranded"],
        "remote": ["remote location", "isolation"],
        "paranoid": ["paranoia", "distrust", "suspicion"],
        "turn on each other": ["paranoia", "distrust", "betrayal"],
        "not alone": ["alien", "creature", "stalker", "haunting"],

        # --- Superheroes / comic ---
        "superhero": ["superhero", "superpower", "comic book"],
        "superpower": ["superpower", "superhero", "mutant"],
        "comic book": ["based on comic", "comic book", "superhero"],
        "batman": ["batman", "dc comics", "gotham city"],
        "gotham": ["gotham city", "dc comics", "batman"],
        "joker": ["joker", "dc comics", "villain"],
        "riddle": ["riddle", "puzzle", "mystery"],

        # --- Horror / supernatural ---
        "haunted": ["haunted house", "ghost", "paranormal"],
        "ghost": ["ghost", "haunting", "paranormal"],
        "paranormal": ["paranormal", "ghost", "supernatural"],
        "zombie": ["zombie", "undead", "zombie apocalypse"],
        "vampire": ["vampire", "blood", "undead"],
        "monster": ["monster", "creature", "beast"],
        "demon": ["demon", "possession", "exorcism"],
        "possession": ["possession", "exorcism", "demon"],
        "scary": ["horror", "fear", "terror"],
        "creepy": ["creepy", "eerie", "unsettling"],
        "curse": ["curse", "cursed", "supernatural"],

        # --- War / military / action ---
        "war": ["war", "warfare", "battle"],
        "soldier": ["soldier", "military", "army"],
        "military": ["military", "army", "soldier"],
        "battle": ["battle", "warfare", "epic battle"],
        "explosion": ["explosion", "action", "destruction"],
        "chase": ["car chase", "chase", "pursuit"],
        "martial arts": ["martial arts", "kung fu", "fight"],
        "kung fu": ["kung fu", "martial arts"],
        "fight": ["fight", "combat", "martial arts"],
        "assassin": ["assassin", "hitman", "contract killer"],

        # --- Dreams / psychology / mind ---
        "dream": ["dream", "subconscious", "dream world"],
        "dreams": ["dream", "subconscious", "dream world", "lucid dream"],
        "subconscious": ["subconscious", "dream", "psychoanalysis"],
        "inception": ["dream", "subconscious", "dream world"],
        "mind": ["mind control", "telepathy", "psychology"],
        "psychology": ["psychology", "psychopath", "mental illness"],
        "hallucination": ["hallucination", "delusion", "madness"],
        "insanity": ["madness", "mental illness", "psychopath"],
        "twist": ["plot twist", "surprise ending", "deception"],

        # --- Family / coming of age ---
        "coming of age": ["coming of age", "teenager", "growing up"],
        "teenager": ["teenager", "high school", "coming of age"],
        "school": ["high school", "school", "student"],
        "childhood": ["childhood", "child", "nostalgia"],
        "family": ["family", "family relationships", "family drama"],
        "friendship": ["friendship", "best friend", "buddy"],
        "animated": ["animation", "animated", "cartoon"],

        # --- Documentary / true story ---
        "documentary": ["documentary", "true story", "based on true events"],
        "true story": ["based on true events", "true story", "biographical"],
        "real": ["based on true events", "true story"],
        "biography": ["biography", "biographical", "biopic"],
    }

    STOP_WORDS = {
        "a", "an", "the", "is", "it", "in", "on", "of", "to", "and", "or",
        "for", "with", "my", "me", "i", "we", "you", "he", "she", "his",
        "her", "they", "them", "their", "be", "been", "being", "has", "have",
        "had", "do", "does", "did", "will", "would", "could", "should",
        "may", "might", "shall", "can", "at", "by", "from", "up", "out",
        "if", "so", "as", "are", "was", "were", "am", "just", "than",
        "then", "into", "over", "after", "before", "between", "under",
        "again", "further", "once", "here", "there", "when", "where",
        "why", "how", "all", "each", "every", "both", "few", "more",
        "most", "other", "only", "own", "same", "too", "very", "really",
        "movie", "movies", "film", "films", "show", "shows", "like",
        "style", "type", "kind", "something", "about", "some", "that",
        "this", "but", "not", "no", "also", "who", "what", "which",
        "gets", "get", "goes", "finds", "find", "start", "starts",
        "begin", "begins", "look", "looks", "during", "while",
    }

    # --- Step 1: Extract candidate phrases from the description ---
    # Normalise text: lowercase, keep hyphens, remove other punctuation
    clean = re.sub(r"[^\w\s-]", " ", description.lower())
    all_words = [w for w in clean.split() if w not in STOP_WORDS and len(w) > 2]

    # Build candidate phrases: trigrams first, then bigrams, then singles
    candidates = []
    seen_candidates = set()

    # If the user used commas, treat each segment as a candidate too
    comma_terms = [t.strip() for t in description.replace("\n", ",").split(",") if t.strip()]
    if len(comma_terms) > 1:
        for ct in comma_terms:
            lc = ct.lower().strip()
            if lc not in seen_candidates:
                candidates.append(lc)
                seen_candidates.add(lc)

    # Trigrams from cleaned words
    for i in range(len(all_words) - 2):
        tri = f"{all_words[i]} {all_words[i+1]} {all_words[i+2]}"
        if tri not in seen_candidates:
            candidates.append(tri)
            seen_candidates.add(tri)

    # Bigrams from cleaned words
    for i in range(len(all_words) - 1):
        bi = f"{all_words[i]} {all_words[i+1]}"
        if bi not in seen_candidates:
            candidates.append(bi)
            seen_candidates.add(bi)

    # Individual words (longer/rarer words first)
    for w in sorted(all_words, key=len, reverse=True):
        if w not in seen_candidates:
            candidates.append(w)
            seen_candidates.add(w)

    # Expand with concept synonyms — check trigger phrases against the description
    desc_lower = description.lower()
    synonym_additions = []
    for trigger, expansions in CONCEPT_SYNONYMS.items():
        if trigger in desc_lower:
            for exp in expansions:
                if exp not in seen_candidates:
                    synonym_additions.append(exp)
                    seen_candidates.add(exp)
    # Insert synonyms near the front (after comma terms but before raw n-grams)
    insert_pos = len(comma_terms) if len(comma_terms) > 1 else 0
    for i, syn in enumerate(synonym_additions):
        candidates.insert(insert_pos + i, syn)

    # --- Step 2: Resolve candidates to TMDB keyword IDs ---
    all_keyword_ids = []
    seen_keyword_ids = set()
    resolved_chips = []
    matched_keyword_names = []
    MAX_KEYWORD_SEARCHES = 22
    MAX_KEYWORDS = 14

    for candidate in candidates[:MAX_KEYWORD_SEARCHES]:
        if len(all_keyword_ids) >= MAX_KEYWORDS:
            break
        kw_results = tmdb.search_keywords(candidate)
        if kw_results:
            best = kw_results[0]
            if best["id"] not in seen_keyword_ids:
                all_keyword_ids.append(str(best["id"]))
                seen_keyword_ids.add(best["id"])
                matched_keyword_names.append(best["name"])

    if matched_keyword_names:
        resolved_chips.append({
            "term": description[:80] + ("..." if len(description) > 80 else ""),
            "keyword_id": -1,
            "keyword_name": ", ".join(matched_keyword_names[:8]),
        })

    # Also show comma-separated terms as individual chips if user used commas
    if len(comma_terms) > 1:
        resolved_chips = []
        for ct in comma_terms:
            ct_lower = ct.lower().strip()
            ct_kw = tmdb.search_keywords(ct_lower)
            if ct_kw and ct_kw[0]["id"] in seen_keyword_ids:
                resolved_chips.append({"term": ct, "keyword_id": ct_kw[0]["id"], "keyword_name": ct_kw[0]["name"]})
            else:
                ct_words = [w for w in ct_lower.split() if w not in STOP_WORDS and len(w) > 2]
                sub = [n for n in matched_keyword_names if any(w in n for w in ct_words)]
                if sub:
                    resolved_chips.append({"term": ct, "keyword_id": -1, "keyword_name": ", ".join(sub[:3])})
                else:
                    resolved_chips.append({"term": ct, "keyword_id": None, "keyword_name": None})

    # --- Step 3: Discover movies by keywords (pipe = OR) ---
    keyword_results = []
    total_pages = 1
    if all_keyword_ids:
        data = tmdb.discover_movies(
            with_keywords="|".join(all_keyword_ids),
            sort_by="popularity.desc",
            page=page,
            **{"vote_count.gte": 10},
        )
        keyword_results = data.get("results", [])
        total_pages = data.get("total_pages", 1)

    # --- Secondary: Mood auto-detection ---
    detected_mood = _detect_mood(description)
    mood_info = None
    mood_results = []
    if detected_mood and detected_mood in MOOD_MAP:
        mood = MOOD_MAP[detected_mood]
        mood_info = {"slug": detected_mood, "label": mood["label"]}
        params = {
            "with_genres": mood["genres"],
            "sort_by": mood.get("sort_by", "popularity.desc"),
            "page": 1,
        }
        if "vote_count_gte" in mood:
            params["vote_count.gte"] = mood["vote_count_gte"]
        if "vote_average_gte" in mood:
            params["vote_average.gte"] = mood["vote_average_gte"]
        mood_data = tmdb.discover_movies(**params)
        mood_results = mood_data.get("results", [])[:6]

    # --- Merge keyword + mood results ---
    merged = []
    seen_ids = set()
    for source in (keyword_results, mood_results):
        for m in source:
            mid = m["id"]
            if mid not in seen_ids:
                seen_ids.add(mid)
                merged.append(m)

    # --- Fallback: title search ONLY when keywords + mood found nothing ---
    used_fallback = False
    if not merged:
        used_fallback = True
        for term in comma_terms:
            search_data = tmdb.search_movies(term, page=page)
            for m in search_data.get("results", []):
                if m["id"] not in seen_ids:
                    seen_ids.add(m["id"])
                    merged.append(m)
            total_pages = max(total_pages, search_data.get("total_pages", 1))

    serializer = TMDBMovieSerializer(merged, many=True)

    return Response({
        "results": serializer.data,
        "total_pages": max(total_pages, 1),
        "page": page,
        "chips": resolved_chips,
        "detected_mood": mood_info,
        "description": description,
        "fallback": used_fallback,
    })


MOOD_MAP = {
    "cozy-night": {
        "label": "Cozy Night In",
        "description": "Warm, comforting films perfect for a relaxed evening",
        "genres": "35,10749,16",  # Comedy, Romance, Animation
        "sort_by": "vote_average.desc",
        "vote_count_gte": 200,
        "vote_average_gte": 7.0,
    },
    "adrenaline": {
        "label": "Adrenaline Rush",
        "description": "Heart-pumping action and intense thrills",
        "genres": "28,53,80",  # Action, Thriller, Crime
        "sort_by": "popularity.desc",
        "vote_count_gte": 300,
    },
    "date-night": {
        "label": "Date Night",
        "description": "Romantic and charming films to share with someone special",
        "genres": "10749,35,18",  # Romance, Comedy, Drama
        "sort_by": "vote_average.desc",
        "vote_count_gte": 150,
        "vote_average_gte": 6.5,
    },
    "mind-bender": {
        "label": "Mind Bender",
        "description": "Thought-provoking stories that twist your perception",
        "genres": "878,9648,53",  # Sci-Fi, Mystery, Thriller
        "sort_by": "vote_average.desc",
        "vote_count_gte": 200,
        "vote_average_gte": 7.0,
    },
    "feel-good": {
        "label": "Feel Good",
        "description": "Uplifting stories that leave you smiling",
        "genres": "35,10751,16",  # Comedy, Family, Animation
        "sort_by": "vote_average.desc",
        "vote_count_gte": 150,
        "vote_average_gte": 7.0,
    },
    "edge-of-seat": {
        "label": "Edge of Your Seat",
        "description": "Suspenseful films that keep you guessing",
        "genres": "53,9648,27",  # Thriller, Mystery, Horror
        "sort_by": "popularity.desc",
        "vote_count_gte": 200,
    },
    "epic-adventure": {
        "label": "Epic Adventure",
        "description": "Grand journeys and sweeping tales of heroism",
        "genres": "12,14,878",  # Adventure, Fantasy, Sci-Fi
        "sort_by": "popularity.desc",
        "vote_count_gte": 300,
    },
    "cry-it-out": {
        "label": "Cry It Out",
        "description": "Emotional dramas that hit you right in the feels",
        "genres": "18,10749,10402",  # Drama, Romance, Music
        "sort_by": "vote_average.desc",
        "vote_count_gte": 200,
        "vote_average_gte": 7.5,
    },
    "family-fun": {
        "label": "Family Fun",
        "description": "Movies the whole family can enjoy together",
        "genres": "16,10751,12",  # Animation, Family, Adventure
        "sort_by": "popularity.desc",
        "vote_count_gte": 200,
    },
    "documentary-deep-dive": {
        "label": "Documentary Deep Dive",
        "description": "Real stories that expand your worldview",
        "genres": "99",  # Documentary
        "sort_by": "vote_average.desc",
        "vote_count_gte": 100,
        "vote_average_gte": 7.0,
    },
}


@api_view(["GET"])
@permission_classes([AllowAny])
def mood_list(request):
    moods = [
        {"slug": slug, "label": m["label"], "description": m["description"]}
        for slug, m in MOOD_MAP.items()
    ]
    return Response(moods)


@api_view(["GET"])
@permission_classes([AllowAny])
def mood_movies(request, mood_slug):
    mood = MOOD_MAP.get(mood_slug)
    if not mood:
        return Response(
            {"error": "Unknown mood"}, status=status.HTTP_404_NOT_FOUND
        )

    page = int(request.query_params.get("page", 1))
    params = {
        "with_genres": mood["genres"],
        "sort_by": mood.get("sort_by", "popularity.desc"),
        "page": page,
    }
    if "vote_count_gte" in mood:
        params["vote_count.gte"] = mood["vote_count_gte"]
    if "vote_average_gte" in mood:
        params["vote_average.gte"] = mood["vote_average_gte"]

    data = tmdb.discover_movies(**params)
    results = data.get("results", [])
    serializer = TMDBMovieSerializer(results, many=True)

    return Response({
        "mood": {"slug": mood_slug, "label": mood["label"], "description": mood["description"]},
        "results": serializer.data,
        "total_pages": data.get("total_pages", 1),
        "page": page,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def movie_videos(request, tmdb_id):
    """Fetch trailer and video data for a movie from TMDB."""
    data = tmdb.get_movie_details(tmdb_id)
    if not data:
        return Response(
            {"error": "Movie not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    videos = data.get("videos", {}).get("results", [])
    trailers = [
        v for v in videos
        if v.get("site") == "YouTube" and v.get("type") in ("Trailer", "Teaser")
    ]
    trailers.sort(key=lambda v: v.get("type") == "Trailer", reverse=True)

    primary = trailers[0] if trailers else None
    return Response({
        "tmdb_id": tmdb_id,
        "trailer": {
            "key": primary["key"],
            "name": primary.get("name", ""),
            "type": primary.get("type", ""),
            "embed_url": f"https://www.youtube.com/embed/{primary['key']}",
            "watch_url": f"https://www.youtube.com/watch?v={primary['key']}",
        } if primary else None,
        "all_videos": [
            {
                "key": v["key"],
                "name": v.get("name", ""),
                "type": v.get("type", ""),
                "site": v.get("site", ""),
            }
            for v in videos[:10]
        ],
    })


### advanced discover / filters
@api_view(["GET"])
@permission_classes([AllowAny])
def discover_filtered(request):
    params = {}
    page = int(request.query_params.get("page", 1))
    params["page"] = page

    genre = request.query_params.get("genre")
    if genre:
        params["with_genres"] = genre

    year_from = request.query_params.get("year_from")
    year_to = request.query_params.get("year_to")
    if year_from:
        params["primary_release_date.gte"] = f"{year_from}-01-01"
    if year_to:
        params["primary_release_date.lte"] = f"{year_to}-12-31"

    rating_min = request.query_params.get("rating_min")
    if rating_min:
        params["vote_average.gte"] = float(rating_min)
        params["vote_count.gte"] = 50 

    runtime_min = request.query_params.get("runtime_min")
    runtime_max = request.query_params.get("runtime_max")
    if runtime_min:
        params["with_runtime.gte"] = int(runtime_min)
    if runtime_max:
        params["with_runtime.lte"] = int(runtime_max)

    language = request.query_params.get("language")
    if language:
        params["with_original_language"] = language

    sort = request.query_params.get("sort", "popularity.desc")
    params["sort_by"] = sort

    data = tmdb.discover_movies(**params)
    results = data.get("results", [])
    serializer = TMDBMovieSerializer(results, many=True)

    return Response({
        "results": serializer.data,
        "total_pages": data.get("total_pages", 1),
        "total_results": data.get("total_results", 0),
        "page": page,
    })


## movie comparison

@api_view(["GET"])
@permission_classes([AllowAny])
def compare_movies(request):
    ids_str = request.query_params.get("ids", "")
    ids = [int(i.strip()) for i in ids_str.split(",") if i.strip().isdigit()]

    if len(ids) < 2:
        return Response(
            {"error": "Provide at least 2 TMDB IDs: ?ids=550,680"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    movies = []
    for tmdb_id in ids[:2]:
        data = tmdb.get_movie_details(tmdb_id)
        if data and "id" in data:
            movies.append(data)

    if len(movies) < 2:
        return Response(
            {"error": "Could not fetch both movies"},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response({"movies": movies})

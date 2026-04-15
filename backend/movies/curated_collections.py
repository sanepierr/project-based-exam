"""
Curated movie lists (TMDB IDs) for the Collections feature.

Editors can add slugs here without migrations; keep lists focused (≤24 ids) for API latency.
"""

CURATED_COLLECTIONS = [
    {
        "slug": "modern-sci-fi",
        "title": "Modern sci-fi essentials",
        "description": "Space, time, and big ideas — from dream thieves to desert planets.",
        "tmdb_ids": [27205, 603, 335984, 438631, 329865, 376867, 453395, 19995],
    },
    {
        "slug": "heist-ensemble",
        "title": "Heist & crew capers",
        "description": "Precision plans, sharp dialogue, and teams you cannot look away from.",
        "tmdb_ids": [161, 6977, 339403, 40351, 8844, 642, 4951, 106646],
    },
    {
        "slug": "animation-heart",
        "title": "Animation with heart",
        "description": "Stories that hit harder because they are drawn, rendered, or stop-motion magical.",
        "tmdb_ids": [129, 354912, 508442, 324857, 502356, 10674, 12, 920],
    },
    {
        "slug": "90s-thrillers",
        "title": "90s thriller hall of fame",
        "description": "Grit, twists, and tension before everything was a franchise.",
        "tmdb_ids": [550, 807, 629, 949, 1642, 274, 75656, 164],
    },
    {
        "slug": "underdog-sports",
        "title": "Underdog sports",
        "description": "Locker rooms, last shots, and the long odds worth cheering for.",
        "tmdb_ids": [10637, 60308, 312221, 45317, 70, 1366, 864, 10631],
    },
]

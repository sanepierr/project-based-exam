# Team contributions

## P2 — Newton (home & carousels)

Owned the home experience and horizontal movie rails: corrected trending data from the paginated API so the hero and “Trending” carousel receive `MovieCompact[]`, passed a loading flag into the hero and added a skeleton while data arrives, and tightened `MovieCarousel` / `MovieCard` (dead code removal, empty states, landmarks, and clearer labels for cards, scrollers, and “View all”). Replaced the hero “Trailer” link with an inline modal that loads a YouTube embed via the existing movie detail API, respects reduced motion and keyboard focus (pause autoplay), exposes regions/controls to assistive tech, and records `watched` interactions for signed-in users. Updated `MoodTeaser` so hover icon colors use static Tailwind classes and the section and links have proper labeling. Added a subtle status banner on the home page when any of the three list requests reject.

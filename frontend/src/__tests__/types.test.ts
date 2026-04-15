import type {
  MovieCompact,
  MovieDetail,
  Genre,
  WatchlistItem,
  PaginatedResponse,
  AuthTokens,
  User,
} from "@/types/movie";

describe("TypeScript type definitions", () => {
  it("MovieCompact satisfies required fields", () => {
    const movie: MovieCompact = {
      id: 1,
      tmdb_id: 550,
      title: "Fight Club",
      overview: "An insomniac office worker",
      release_date: "1999-10-15",
      year: 1999,
      vote_average: 8.4,
      vote_count: 25000,
      popularity: 60.5,
      poster_url: null,
      poster_url_small: null,
      genres: [],
      runtime: 139,
    };
    expect(movie.title).toBe("Fight Club");
    expect(movie.tmdb_id).toBe(550);
  });

  it("WatchlistItem has correct shape", () => {
    const item: WatchlistItem = {
      id: 1,
      movie_tmdb_id: 550,
      movie_title: "Fight Club",
      poster_url: null,
      is_watched: false,
      added_at: "2026-04-10T00:00:00Z",
    };
    expect(item.is_watched).toBe(false);
    expect(item.movie_tmdb_id).toBe(550);
  });

  it("PaginatedResponse wraps results correctly", () => {
    const response: PaginatedResponse<MovieCompact> = {
      results: [],
      total_pages: 1,
      page: 1,
    };
    expect(response.results).toEqual([]);
    expect(response.page).toBe(1);
  });

  it("AuthTokens has access and refresh", () => {
    const tokens: AuthTokens = {
      access: "abc.def.ghi",
      refresh: "xyz.uvw.rst",
    };
    expect(tokens.access).toBeTruthy();
    expect(tokens.refresh).toBeTruthy();
  });
});

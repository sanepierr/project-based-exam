import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import MovieCard from "@/components/MovieCard";
import type { MovieCompact } from "@/types/movie";

const mockMovie: MovieCompact = {
  id: 1,
  tmdb_id: 550,
  title: "Fight Club",
  overview: "An insomniac office worker forms a club.",
  release_date: "1999-10-15",
  year: 1999,
  vote_average: 8.4,
  vote_count: 25000,
  popularity: 60.5,
  poster_url: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  poster_url_small: "https://image.tmdb.org/t/p/w185/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  genres: [{ id: 1, tmdb_id: 18, name: "Drama", slug: "drama" }],
  runtime: 139,
};

describe("MovieCard", () => {
  it("renders the movie title", () => {
    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText("Fight Club")).toBeInTheDocument();
  });

  it("displays the year", () => {
    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText("1999")).toBeInTheDocument();
  });

  it("shows the formatted rating", () => {
    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText("8.4")).toBeInTheDocument();
  });

  it("links to the correct movie detail page", () => {
    render(<MovieCard movie={mockMovie} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/movie/550");
  });

  it("renders runtime when provided", () => {
    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText("2h 19m")).toBeInTheDocument();
  });
});

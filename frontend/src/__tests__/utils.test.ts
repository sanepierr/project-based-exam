import {
  formatRuntime,
  formatCurrency,
  ratingColor,
  posterUrl,
  backdropUrl,
} from "@/lib/utils";

describe("formatRuntime", () => {
  it("formats hours and minutes correctly", () => {
    expect(formatRuntime(148)).toBe("2h 28m");
  });

  it("shows only minutes when under an hour", () => {
    expect(formatRuntime(45)).toBe("45m");
  });

  it("returns empty string for null or zero", () => {
    expect(formatRuntime(null)).toBe("");
    expect(formatRuntime(0)).toBe("");
  });
});

describe("formatCurrency", () => {
  it("formats large numbers as USD", () => {
    expect(formatCurrency(200000000)).toBe("$200,000,000");
  });

  it("returns dash for zero budget", () => {
    expect(formatCurrency(0)).toBe("—");
  });
});

describe("ratingColor", () => {
  it("returns emerald for ratings >= 8", () => {
    expect(ratingColor(8.5)).toBe("text-emerald-400");
  });

  it("returns amber for ratings 6-7.9", () => {
    expect(ratingColor(7.0)).toBe("text-amber-300");
  });

  it("returns orange for ratings 4-5.9", () => {
    expect(ratingColor(5.0)).toBe("text-orange-400");
  });

  it("returns red for ratings below 4", () => {
    expect(ratingColor(2.5)).toBe("text-red-400");
  });
});

describe("posterUrl", () => {
  it("builds TMDB URL from path", () => {
    expect(posterUrl("/abc.jpg")).toBe("https://image.tmdb.org/t/p/w500/abc.jpg");
  });

  it("uses requested size", () => {
    expect(posterUrl("/abc.jpg", "w185")).toBe("https://image.tmdb.org/t/p/w185/abc.jpg");
  });

  it("returns placeholder for null path", () => {
    expect(posterUrl(null)).toBe("/placeholder-poster.svg");
  });

  it("returns full URL unchanged", () => {
    expect(posterUrl("https://example.com/img.jpg")).toBe("https://example.com/img.jpg");
  });
});

describe("backdropUrl", () => {
  it("builds w1280 TMDB URL", () => {
    expect(backdropUrl("/bg.jpg")).toBe("https://image.tmdb.org/t/p/w1280/bg.jpg");
  });

  it("returns empty string for null", () => {
    expect(backdropUrl(null)).toBe("");
  });

  it("returns full URL unchanged", () => {
    expect(backdropUrl("https://example.com/bg.jpg")).toBe("https://example.com/bg.jpg");
  });
});

import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import mockRouter from "next-router-mock";
import MoodPage from "./page";
import { moviesAPI } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  moviesAPI: {
    getMoodMovies: jest.fn(),
  },
}));

describe("MoodPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.push("/mood");
  });

  test("renders mood picker header", () => {
    render(<MoodPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /what's your.*mood/i
    );
  });

  test("renders all mood options", () => {
    render(<MoodPage />);
    // Use mood grid buttons (aria-label) — labels like "Feel Good" also appear on "Suggested for now".
    expect(
      screen.getByRole("button", { name: "Select Cozy Night In" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Select Adrenaline Rush" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Select Feel Good" })
    ).toBeInTheDocument();
  });

  test("shows surprise me button", () => {
    render(<MoodPage />);
    expect(screen.getByText("Surprise Me")).toBeInTheDocument();
  });

  test("shows take quiz button", () => {
    render(<MoodPage />);
    expect(screen.getByText("Take Mood Quiz")).toBeInTheDocument();
  });

  test("opens quiz modal when quiz button clicked", () => {
    render(<MoodPage />);
    fireEvent.click(screen.getByText("Take Mood Quiz"));
    expect(screen.getByText("Mood Quiz")).toBeInTheDocument();
  });

  test("quiz progresses through questions", () => {
    render(<MoodPage />);
    fireEvent.click(screen.getByText("Take Mood Quiz"));

    expect(screen.getByText("How are you feeling right now?")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Happy & energetic"));
    expect(screen.getByText("What kind of movie experience do you want?")).toBeInTheDocument();
  });

  test("quiz completes and navigates to mood", async () => {
    jest.mocked(moviesAPI.getMoodMovies).mockResolvedValue({
      results: [],
      mood: { label: "Feel Good", description: "Test" },
      total_pages: 1,
      total_results: 0,
    });

    render(<MoodPage />);
    fireEvent.click(screen.getByText("Take Mood Quiz"));
    fireEvent.click(screen.getByText("Happy & energetic"));
    fireEvent.click(screen.getByText("Light-hearted comedy"));
    fireEvent.click(screen.getByText("Short & sweet (under 2 hours)"));

    await waitFor(() => {
      expect(mockRouter.asPath).toMatch(/mood=feel-good/);
    });
  });

  test("mood selection navigates correctly", async () => {
    render(<MoodPage />);
    fireEvent.click(screen.getByText("Cozy Night In"));
    await waitFor(() => {
      expect(mockRouter.asPath).toMatch(/mood=cozy-night/);
    });
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import MoodPage from './page';
import { moviesAPI } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  moviesAPI: {
    getMoodMovies: jest.fn(),
  },
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: mockPush }),
}));

describe('MoodPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders mood picker header', () => {
    render(<MoodPage />);
    expect(screen.getByText("What's your mood?")).toBeInTheDocument();
  });

  test('renders all mood options', () => {
    render(<MoodPage />);
    expect(screen.getByText('Cozy Night In')).toBeInTheDocument();
    expect(screen.getByText('Adrenaline Rush')).toBeInTheDocument();
    expect(screen.getByText('Feel Good')).toBeInTheDocument();
  });

  test('shows surprise me button', () => {
    render(<MoodPage />);
    expect(screen.getByText('Surprise Me')).toBeInTheDocument();
  });

  test('shows take quiz button', () => {
    render(<MoodPage />);
    expect(screen.getByText('Take Mood Quiz')).toBeInTheDocument();
  });

  test('opens quiz modal when quiz button clicked', () => {
    render(<MoodPage />);
    const quizButton = screen.getByText('Take Mood Quiz');
    fireEvent.click(quizButton);
    expect(screen.getByText('Mood Quiz')).toBeInTheDocument();
  });

  test('quiz progresses through questions', () => {
    render(<MoodPage />);
    const quizButton = screen.getByText('Take Mood Quiz');
    fireEvent.click(quizButton);

    // First question
    expect(screen.getByText('How are you feeling right now?')).toBeInTheDocument();

    // Answer first question
    const firstOption = screen.getByText('Happy & energetic');
    fireEvent.click(firstOption);

    // Should show second question
    expect(screen.getByText('What kind of movie experience do you want?')).toBeInTheDocument();
  });

  test('quiz completes and navigates to mood', async () => {
    (moviesAPI.getMoodMovies as jest.Mock).mockResolvedValue({
      results: [],
      mood: { label: 'Feel Good', description: 'Test' },
      total_pages: 1,
      total_results: 0,
    });

    render(<MoodPage />);
    const quizButton = screen.getByText('Take Mood Quiz');
    fireEvent.click(quizButton);

    // Answer all questions quickly
    const options = screen.getAllByRole('button').filter(btn =>
      ['Happy & energetic', 'Light-hearted comedy', 'Short & sweet (under 2 hours)'].includes(btn.textContent || '')
    );

    options.forEach(option => fireEvent.click(option));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/mood?mood=feel-good');
    });
  });

  test('mood selection navigates correctly', () => {
    render(<MoodPage />);
    const moodButton = screen.getByText('Cozy Night In');
    fireEvent.click(moodButton);
    expect(mockPush).toHaveBeenCalledWith('/mood?mood=cozy-night');
  });
});
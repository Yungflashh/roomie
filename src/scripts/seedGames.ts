import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Game } from '../models';
import { logger } from '../utils/logger';

dotenv.config();

const sampleGames = [
  {
    title: 'Roommate Trivia',
    description: 'Test your knowledge about living with roommates!',
    category: 'trivia',
    difficulty: 'easy',
    type: 'multiplayer',
    thumbnail: 'https://example.com/trivia.jpg',
    duration: 10,
    maxPlayers: 4,
    minPlayers: 2,
    rules: 'Answer questions correctly to earn points. Fastest correct answer gets bonus points!',
    questions: [
      {
        question: 'What is the most common cause of roommate conflicts?',
        type: 'multiple-choice',
        options: ['Cleanliness', 'Noise', 'Sharing food', 'Guests'],
        correctAnswer: 'Cleanliness',
        points: 10,
        timeLimit: 15,
      },
      {
        question: 'How often should common areas be cleaned?',
        type: 'multiple-choice',
        options: ['Daily', 'Weekly', 'Monthly', 'Never'],
        correctAnswer: 'Weekly',
        points: 10,
        timeLimit: 15,
      },
      {
        question: 'True or False: It\'s okay to eat your roommate\'s food without asking',
        type: 'true-false',
        options: ['True', 'False'],
        correctAnswer: 'False',
        points: 10,
        timeLimit: 10,
      },
    ],
    achievements: [
      {
        id: 'trivia_master',
        name: 'Trivia Master',
        description: 'Answer all questions correctly',
        icon: '🧠',
        condition: 'all_correct',
      },
    ],
    isActive: true,
  },
  {
    title: 'Daily Ice Breaker',
    description: 'Get to know your roommate better with fun questions!',
    category: 'icebreaker',
    difficulty: 'easy',
    type: 'daily',
    thumbnail: 'https://example.com/icebreaker.jpg',
    duration: 5,
    maxPlayers: 2,
    minPlayers: 2,
    rules: 'Answer personal questions and compare with your roommate.',
    questions: [
      {
        question: 'What is your ideal weekend activity?',
        type: 'open-ended',
        points: 5,
      },
      {
        question: 'Coffee or tea?',
        type: 'multiple-choice',
        options: ['Coffee', 'Tea', 'Neither', 'Both'],
        points: 5,
      },
    ],
    achievements: [],
    isActive: true,
  },
  {
    title: 'Personality Match',
    description: 'Discover how compatible you are with your roommate!',
    category: 'personality',
    difficulty: 'medium',
    type: 'solo',
    thumbnail: 'https://example.com/personality.jpg',
    duration: 15,
    maxPlayers: 1,
    minPlayers: 1,
    rules: 'Answer honestly to get your personality profile.',
    questions: [
      {
        question: 'On a scale of 1-5, how social are you?',
        type: 'multiple-choice',
        options: ['1 - Very introverted', '2', '3 - Balanced', '4', '5 - Very extroverted'],
        points: 0,
      },
      {
        question: 'How do you handle conflicts?',
        type: 'multiple-choice',
        options: ['Avoid them', 'Discuss immediately', 'Need time to think', 'Seek mediation'],
        points: 0,
      },
    ],
    achievements: [],
    isActive: true,
  },
  {
    title: 'Weekly Challenge',
    description: 'Complete this week\'s special challenge!',
    category: 'challenge',
    difficulty: 'hard',
    type: 'weekly',
    thumbnail: 'https://example.com/challenge.jpg',
    duration: 20,
    maxPlayers: 4,
    minPlayers: 1,
    rules: 'Complete all challenges to earn maximum points!',
    questions: [
      {
        question: 'Calculate: If rent is $1200 and you have 3 roommates, how much does each person pay?',
        type: 'open-ended',
        correctAnswer: '300',
        points: 20,
        timeLimit: 30,
      },
      {
        question: 'Create a fair chore rotation schedule for 4 people and 5 chores',
        type: 'open-ended',
        points: 30,
        timeLimit: 60,
      },
    ],
    achievements: [
      {
        id: 'challenge_champion',
        name: 'Challenge Champion',
        description: 'Complete a weekly challenge',
        icon: '🏆',
        condition: 'complete_weekly',
      },
    ],
    isActive: true,
  },
  {
    title: 'Quick Quiz',
    description: 'Fast-paced trivia for quick thinkers!',
    category: 'puzzle',
    difficulty: 'medium',
    type: 'multiplayer',
    thumbnail: 'https://example.com/quiz.jpg',
    duration: 5,
    maxPlayers: 6,
    minPlayers: 2,
    rules: 'Answer as many questions as possible in 5 minutes!',
    questions: Array.from({ length: 20 }, (_, i) => ({
      question: `Quick question #${i + 1}`,
      type: 'multiple-choice',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
      points: 5,
      timeLimit: 10,
    })),
    achievements: [],
    isActive: true,
  },
];

async function seedGames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    logger.info('Connected to MongoDB');

    // Clear existing games
    await Game.deleteMany({});
    logger.info('Cleared existing games');

    // Insert sample games
    const games = await Game.insertMany(sampleGames);
    logger.info(`Successfully seeded ${games.length} games`);

    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  } catch (error) {
    logger.error(`Error seeding games: ${error}`);
    process.exit(1);
  }
}

seedGames();
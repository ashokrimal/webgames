// Additional game modes and variants

export interface GameMode {
  id: string;
  name: string;
  description: string;
  gameType: string;
  rules: string[];
  timeLimit?: number;
  maxPlayers: number;
  difficulty: 'easy' | 'medium' | 'hard';
  features: string[];
}

export const ADDITIONAL_GAME_MODES: GameMode[] = [
  // Chess Variants
  {
    id: 'chess-blitz',
    name: 'Chess Blitz',
    description: 'Fast-paced chess with 3-minute time control',
    gameType: 'chess',
    rules: [
      'Each player has 3 minutes total time',
      'No increment between moves',
      'Sudden death when time runs out'
    ],
    timeLimit: 180,
    maxPlayers: 2,
    difficulty: 'hard',
    features: ['Time pressure', 'Quick decisions', 'High stakes']
  },
  {
    id: 'chess-puzzle',
    name: 'Chess Puzzles',
    description: 'Solve tactical chess positions',
    gameType: 'chess',
    rules: [
      'Find the best move in given positions',
      'Points awarded based on difficulty',
      'Hints available for stuck players'
    ],
    maxPlayers: 1,
    difficulty: 'medium',
    features: ['Tactical training', 'Progressive difficulty', 'Hints system']
  },
  {
    id: 'chess-960',
    name: 'Chess960',
    description: 'Chess with randomized starting positions',
    gameType: 'chess',
    rules: [
      'Pieces are randomly placed on first and eighth ranks',
      'Kings and rooks maintain castling rights',
      '960 possible starting positions'
    ],
    maxPlayers: 2,
    difficulty: 'hard',
    features: ['Strategic variety', 'Memory challenges', 'Castling puzzles']
  },

  // UNO Variants
  {
    id: 'uno-7-0',
    name: 'UNO 7-0',
    description: 'Pass cards to opponents when playing 7s',
    gameType: 'uno',
    rules: [
      'When you play a 7, swap hands with any opponent',
      'When you play a 0, everyone passes hands clockwise',
      'Maintain card counts for bluffing'
    ],
    maxPlayers: 4,
    difficulty: 'medium',
    features: ['Hand swapping', 'Bluffing opportunities', 'Strategic passing']
  },
  {
    id: 'uno-jump-in',
    name: 'UNO Jump-In',
    description: 'Play on any matching card, even out of turn',
    gameType: 'uno',
    rules: [
      'Play on any matching number or color',
      'Can interrupt opponents\' turns',
      'Maintain turn order when jumping in'
    ],
    maxPlayers: 6,
    difficulty: 'hard',
    features: ['Interrupt mechanics', 'Fast-paced action', 'Strategic timing']
  },

  // Bingo Variants
  {
    id: 'bingo-blackout',
    name: 'Blackout Bingo',
    description: 'Fill the entire card to win',
    gameType: 'bingo',
    rules: [
      'Mark all 25 squares on your card',
      'No free center square',
      'Multiple winners possible'
    ],
    maxPlayers: 10,
    difficulty: 'easy',
    features: ['Complete coverage', 'Extended gameplay', 'Multiple winners']
  },
  {
    id: 'bingo-speed',
    name: 'Speed Bingo',
    description: 'Race to complete patterns quickly',
    gameType: 'bingo',
    rules: [
      'First to complete any pattern wins',
      'Time bonus for faster completion',
      'Progressive difficulty patterns'
    ],
    timeLimit: 300,
    maxPlayers: 8,
    difficulty: 'easy',
    features: ['Time pressure', 'Bonus scoring', 'Pattern variety']
  },

  // GeoGuessr Variants
  {
    id: 'geoguessr-country',
    name: 'Country Rush',
    description: 'Guess locations within specific countries',
    gameType: 'geoguessr',
    rules: [
      'All locations from the same country',
      'Bonus points for precise location',
      'Regional expertise rewarded'
    ],
    maxPlayers: 6,
    difficulty: 'medium',
    features: ['Thematic challenges', 'Regional knowledge', 'Country-specific hints']
  },
  {
    id: 'geoguessr-time-attack',
    name: 'Time Attack',
    description: 'Ultra-fast location guessing',
    gameType: 'geoguessr',
    rules: [
      '15 seconds per location',
      'No zooming or panning restrictions',
      'Points based on speed and accuracy'
    ],
    timeLimit: 15,
    maxPlayers: 4,
    difficulty: 'hard',
    features: ['Extreme time pressure', 'Rapid decision making', 'Speed bonuses']
  },

  // Gartic Phone Variants
  {
    id: 'gartic-themes',
    name: 'Themed Drawing',
    description: 'Draw within specific artistic themes',
    gameType: 'gartic-phone',
    rules: [
      'Choose from art style themes',
      'Points for style accuracy',
      'Theme-based hints available'
    ],
    maxPlayers: 8,
    difficulty: 'medium',
    features: ['Artistic variety', 'Style challenges', 'Creative freedom']
  },

  // Guess Word Variants
  {
    id: 'guessword-categories',
    name: 'Category Challenge',
    description: 'Guess words from specific categories',
    gameType: 'guessword',
    rules: [
      'Words from chosen categories only',
      'Category hints provided',
      'Thematic scoring bonuses'
    ],
    maxPlayers: 6,
    difficulty: 'easy',
    features: ['Thematic gameplay', 'Category variety', 'Educational value']
  },
  {
    id: 'guessword-hardcore',
    name: 'Hardcore Mode',
    description: 'No hints, limited guesses, time pressure',
    gameType: 'guessword',
    rules: [
      'Maximum 3 guesses per word',
      'No hints available',
      '30 second time limit per word'
    ],
    timeLimit: 30,
    maxPlayers: 4,
    difficulty: 'hard',
    features: ['Extreme difficulty', 'Pure skill', 'High stakes']
  }
];

// Tournament system
export interface Tournament {
  id: string;
  name: string;
  gameType: string;
  gameMode: string;
  maxParticipants: number;
  currentParticipants: number;
  prizePool: number;
  entryFee: number;
  startDate: string;
  status: 'upcoming' | 'active' | 'completed';
  bracket: TournamentBracket;
}

export interface TournamentBracket {
  rounds: TournamentRound[];
  winner?: string;
}

export interface TournamentRound {
  roundNumber: number;
  matches: TournamentMatch[];
}

export interface TournamentMatch {
  id: string;
  players: [string, string];
  winner?: string;
  score?: [number, number];
  status: 'pending' | 'active' | 'completed';
}

// Tournament management functions
export const createTournament = (config: {
  name: string;
  gameType: string;
  gameMode: string;
  maxParticipants: number;
  entryFee: number;
  startDate: string;
}): Tournament => {
  return {
    id: `tournament-${Date.now()}`,
    name: config.name,
    gameType: config.gameType,
    gameMode: config.gameMode,
    maxParticipants: config.maxParticipants,
    currentParticipants: 0,
    prizePool: 0,
    entryFee: config.entryFee,
    startDate: config.startDate,
    status: 'upcoming',
    bracket: {
      rounds: []
    }
  };
};

export const generateBracket = (participants: string[]): TournamentBracket => {
  const rounds: TournamentRound[] = [];
  let currentRoundParticipants = participants;

  let roundNumber = 1;
  while (currentRoundParticipants.length > 1) {
    const matches: TournamentMatch[] = [];
    for (let i = 0; i < currentRoundParticipants.length; i += 2) {
      if (i + 1 < currentRoundParticipants.length) {
        matches.push({
          id: `match-${roundNumber}-${i / 2}`,
          players: [currentRoundParticipants[i], currentRoundParticipants[i + 1]],
          status: 'pending'
        });
      }
    }

    rounds.push({
      roundNumber,
      matches
    });

    // Prepare for next round
    currentRoundParticipants = matches.map(() => ''); // Placeholder for winners
    roundNumber++;
  }

  return { rounds };
};

// Achievement system for game modes
export interface Achievement {
  id: string;
  name: string;
  description: string;
  gameMode: string;
  requirement: string;
  reward: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const GAME_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'blitz-master',
    name: 'Blitz Master',
    description: 'Win 10 blitz chess games',
    gameMode: 'chess-blitz',
    requirement: 'win_10_games',
    reward: 'Blitz Champion title',
    rarity: 'epic'
  },
  {
    id: 'puzzle-solver',
    name: 'Puzzle Solver',
    description: 'Solve 100 chess puzzles',
    gameMode: 'chess-puzzle',
    requirement: 'solve_100_puzzles',
    reward: 'Tactical Genius badge',
    rarity: 'rare'
  },
  {
    id: 'uno-swapper',
    name: 'Card Swapper',
    description: 'Successfully swap hands 25 times in 7-0',
    gameMode: 'uno-7-0',
    requirement: 'swap_25_times',
    reward: 'Swap Master trophy',
    rarity: 'rare'
  },
  {
    id: 'speed-guesser',
    name: 'Speed Demon',
    description: 'Complete 50 GeoGuessr locations in under 30 seconds each',
    gameMode: 'geoguessr-time-attack',
    requirement: 'fast_guesses_50',
    reward: 'Lightning Fast badge',
    rarity: 'epic'
  }
];

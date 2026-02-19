import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  created_at: string
  last_login?: string
  games_played: number
  games_won: number
  total_score: number
  level: number
  experience: number
}

export interface GameSession {
  id: string
  room_id: string
  game_type: 'chess' | 'uno' | 'bingo' | 'geoguessr' | 'gartic-phone' | 'guessword'
  players: string[]
  winner?: string
  duration: number
  created_at: string
  ended_at?: string
  game_data: any
}

export interface GameStats {
  id: string
  user_id: string
  game_type: string
  games_played: number
  games_won: number
  total_score: number
  best_score: number
  average_score: number
  total_time: number
  win_rate: number
  updated_at: string
}

export interface Achievement {
  id: string
  user_id: string
  achievement_type: string
  title: string
  description: string
  unlocked_at: string
  progress: number
  max_progress: number
}

// Database helper functions
export const db = {
  // User management
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'games_played' | 'games_won' | 'total_score' | 'level' | 'experience'>) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...userData,
        games_played: 0,
        games_won: 0,
        total_score: 0,
        level: 1,
        experience: 0
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  },

  async updateUserStats(userId: string, stats: Partial<Pick<User, 'games_played' | 'games_won' | 'total_score' | 'level' | 'experience'>>) {
    const { data, error } = await supabase
      .from('users')
      .update(stats)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Game sessions
  async createGameSession(sessionData: Omit<GameSession, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert(sessionData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateGameSession(sessionId: string, updates: Partial<GameSession>) {
    const { data, error } = await supabase
      .from('game_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getUserGameSessions(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .contains('players', [userId])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  // Game statistics
  async getUserStats(userId: string) {
    const { data, error } = await supabase
      .from('game_stats')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data
  },

  async updateGameStats(userId: string, gameType: string, stats: Partial<GameStats>) {
    const { data, error } = await supabase
      .from('game_stats')
      .upsert({
        user_id: userId,
        game_type: gameType,
        ...stats,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Leaderboards
  async getLeaderboard(gameType?: string, limit = 100) {
    let query = supabase
      .from('users')
      .select('id, username, avatar, games_won, total_score, level')
      .order('total_score', { ascending: false })
      .limit(limit)

    if (gameType) {
      // For game-specific leaderboards, we'd need to join with game_stats
      query = supabase
        .from('game_stats')
        .select(`
          user_id,
          games_won,
          total_score,
          win_rate,
          users!inner (
            id,
            username,
            avatar,
            level
          )
        `)
        .eq('game_type', gameType)
        .order('total_score', { ascending: false })
        .limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  // Achievements
  async getUserAchievements(userId: string) {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })

    if (error) throw error
    return data
  },

  async unlockAchievement(userId: string, achievement: Omit<Achievement, 'id' | 'user_id' | 'unlocked_at'>) {
    const { data, error } = await supabase
      .from('achievements')
      .insert({
        user_id: userId,
        ...achievement,
        unlocked_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

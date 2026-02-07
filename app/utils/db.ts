/**
 * Database utility functions and query builders
 * PostgreSQL connection pool and database operations
 */

import pkg from 'pg'
const { Pool } = pkg
import { logger } from './logger'
import type {
  Puzzle,
  User,
  UserLike,
  CreatePuzzleInput,
  CreateUserInput,
  UpdateUserInput,
  PuzzleWithCreator,
  LikeResult,
  CheckLikeResult,
} from '~/types/database'
import type { QueryResult, PoolClient } from 'pg'

// Validate required environment variables
const validateEnvVars = (): void => {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required database environment variables: ${missing.join(', ')}`)
  }
}

validateEnvVars()

// Database connection configuration
const dbConfig = {
  user: process.env.DB_USER!,
  host: process.env.DB_HOST!,
  database: process.env.DB_NAME!,
  password: process.env.DB_PASSWORD!,
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20, // Maximum number of connections in pool
  idleTimeoutMillis: 30000, // Connection idle timeout
  connectionTimeoutMillis: 2000, // Connection timeout
}

// Create connection pool
const pool = new Pool(dbConfig)

// Pool error handling - improved to not crash the entire process
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', err)
  // Don't exit process, let process manager handle restart if needed
  // Consider implementing graceful degradation or reconnection logic
})

/**
 * Database query method with logging
 */
export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now()
  try {
    const res = await pool.query<T>(text, params)
    const duration = Date.now() - start
    logger.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    logger.error('Database query error:', error)
    throw error
  }
}

/**
 * Get a single client connection (for transactions)
 */
export const getClient = async (): Promise<PoolClient> => {
  try {
    const client = await pool.connect()
    return client
  } catch (error) {
    logger.error('Error getting database client:', error)
    throw error
  }
}

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    client.release()
    logger.info('Database connection successful:', { time: result.rows[0] })
    return true
  } catch (error) {
    logger.error('Database connection failed:', error)
    return false
  }
}

/**
 * Close connection pool
 */
export const closePool = async (): Promise<void> => {
  try {
    await pool.end()
    logger.info('Database pool closed')
  } catch (error) {
    logger.error('Error closing database pool:', error)
  }
}

/**
 * Check pool health
 */
export const checkPoolHealth = async (): Promise<boolean> => {
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    return true
  } catch (error) {
    logger.error('Pool health check failed', error)
    return false
  }
}

/**
 * Transaction helper function
 */
export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Puzzle-related database operations
 */
export const puzzleQueries = {
  /**
   * Create a new puzzle
   */
  createPuzzle: async (puzzleData: CreatePuzzleInput): Promise<QueryResult<Puzzle>> => {
    const { id, userId, row, regions, dice } = puzzleData
    const insertQuery = `
      INSERT INTO puzzles (puzzle_id, user_id, row_data, regions_data, dice_data, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `
    return await query<Puzzle>(insertQuery, [
      id,
      userId,
      JSON.stringify(row),
      JSON.stringify(regions),
      JSON.stringify(dice),
    ])
  },

  /**
   * Get a puzzle by ID
   */
  getPuzzle: async (puzzleId: string): Promise<QueryResult<Puzzle>> => {
    const selectQuery = 'SELECT * FROM puzzles WHERE puzzle_id = $1'
    return await query<Puzzle>(selectQuery, [puzzleId])
  },

  /**
   * Get all puzzles with pagination
   */
  getAllPuzzles: async (limit = 50, offset = 0): Promise<QueryResult<PuzzleWithCreator>> => {
    const selectQuery = `
      SELECT p.puzzle_id, p.created_at, p.updated_at,
             u.name as creator_name, u.email as creator_email
      FROM puzzles p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `
    return await query<PuzzleWithCreator>(selectQuery, [limit, offset])
  },

  /**
   * Get puzzles sorted by likes (optimized with user like status)
   */
  getPuzzlesByLikesWithUserStatus: async (
    limit = 50,
    offset = 0,
    userId?: number
  ): Promise<QueryResult<PuzzleWithCreator>> => {
    const selectQuery = `
      SELECT
        p.puzzle_id, p.row_data, p.regions_data, p.dice_data,
        p.likes, p.created_at, p.updated_at,
        u.name as creator_name, u.picture as creator_avatar,
        CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END as "hasLiked"
      FROM puzzles p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN user_likes ul ON p.puzzle_id = ul.puzzle_id AND ul.user_id = $1
      ORDER BY p.likes DESC, p.created_at DESC
      LIMIT $2 OFFSET $3
    `
    return await query<PuzzleWithCreator>(selectQuery, [userId || null, limit, offset])
  },

  /**
   * Get puzzles sorted by likes (legacy - kept for backward compatibility)
   */
  getPuzzlesByLikes: async (limit = 50, offset = 0): Promise<QueryResult<PuzzleWithCreator>> => {
    const selectQuery = `
      SELECT p.puzzle_id, p.row_data, p.regions_data, p.dice_data, p.likes, p.created_at, p.updated_at,
             u.name as creator_name, u.email as creator_email
      FROM puzzles p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.likes DESC, p.created_at DESC
      LIMIT $1 OFFSET $2
    `
    return await query<PuzzleWithCreator>(selectQuery, [limit, offset])
  },

  /**
   * Update puzzle likes count
   */
  updatePuzzleLikes: async (puzzleId: string, likes: number): Promise<QueryResult<Puzzle>> => {
    const updateQuery = `
      UPDATE puzzles
      SET likes = $2, updated_at = NOW()
      WHERE puzzle_id = $1
      RETURNING puzzle_id, likes, updated_at
    `
    return await query<Puzzle>(updateQuery, [puzzleId, likes])
  },

  /**
   * Adjust puzzle likes atomically (increment/decrement)
   */
  adjustPuzzleLikes: async (puzzleId: string, delta = 1): Promise<QueryResult<Puzzle>> => {
    const updateQuery = `
      UPDATE puzzles
      SET likes = GREATEST(likes + $2, 0), updated_at = NOW()
      WHERE puzzle_id = $1
      RETURNING puzzle_id, likes, updated_at
    `
    return await query<Puzzle>(updateQuery, [puzzleId, delta])
  },

  /**
   * Update a puzzle
   */
  updatePuzzle: async (
    puzzleId: string,
    puzzleData: Partial<CreatePuzzleInput>
  ): Promise<QueryResult<Puzzle>> => {
    const { row, regions, dice } = puzzleData
    const updateQuery = `
      UPDATE puzzles
      SET row_data = $2, regions_data = $3, dice_data = $4, updated_at = NOW()
      WHERE puzzle_id = $1
      RETURNING *
    `
    return await query<Puzzle>(updateQuery, [
      puzzleId,
      JSON.stringify(row),
      JSON.stringify(regions),
      JSON.stringify(dice),
    ])
  },

  /**
   * Delete a puzzle
   */
  deletePuzzle: async (puzzleId: string): Promise<QueryResult<Puzzle>> => {
    const deleteQuery = 'DELETE FROM puzzles WHERE puzzle_id = $1 RETURNING *'
    return await query<Puzzle>(deleteQuery, [puzzleId])
  },

  /**
   * Get puzzles by user ID with pagination
   */
  getPuzzlesByUser: async (
    userId: number,
    limit = 50,
    offset = 0
  ): Promise<QueryResult<PuzzleWithCreator>> => {
    const selectQuery = `
      SELECT p.puzzle_id, p.row_data, p.regions_data, p.dice_data, p.likes, p.is_verified, p.created_at, p.updated_at,
             u.name as creator_name, u.email as creator_email
      FROM puzzles p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `
    return await query<PuzzleWithCreator>(selectQuery, [userId, limit, offset])
  },

  getPuzzlesTotalCount: async (): Promise<QueryResult<{ total: number }>> => {
    const selectQuery = `
      SELECT COUNT(*)::int as total
      FROM puzzles
    `
    return await query<{ total: number }>(selectQuery, [])
  },

  getPuzzlesTotalCountByUser: async (userId: number): Promise<QueryResult<{ total: number }>> => {
    const selectQuery = `
      SELECT COUNT(*)::int as total
      FROM puzzles
      WHERE user_id = $1
    `
    return await query<{ total: number }>(selectQuery, [userId])
  },
}

/**
 * User like-related database operations
 */
export const likeQueries = {
  /**
   * Add user like (with transaction)
   */
  addUserLike: async (userId: number, puzzleId: string): Promise<LikeResult> => {
    return await withTransaction(async (client) => {
      // Check if user already liked the puzzle
      const checkQuery = 'SELECT id FROM user_likes WHERE user_id = $1 AND puzzle_id = $2'
      const checkResult = await client.query(checkQuery, [userId, puzzleId])

      if (checkResult.rowCount > 0) {
        return {
          alreadyLiked: true,
          likeId: checkResult.rows[0].id,
        }
      }

      // Add like record
      const insertQuery = `
        INSERT INTO user_likes (user_id, puzzle_id, created_at)
        VALUES ($1, $2, NOW())
        RETURNING id
      `
      const insertResult = await client.query(insertQuery, [userId, puzzleId])

      // Update puzzle likes count
      const updateQuery = `
        UPDATE puzzles
        SET likes = likes + 1, updated_at = NOW()
        WHERE puzzle_id = $1
        RETURNING puzzle_id, likes
      `
      const updateResult = await client.query(updateQuery, [puzzleId])

      return {
        alreadyLiked: false,
        likeId: insertResult.rows[0].id,
        puzzleData: updateResult.rows[0],
      }
    })
  },

  /**
   * Remove user like (with transaction)
   */
  removeUserLike: async (userId: number, puzzleId: string): Promise<LikeResult> => {
    return await withTransaction(async (client) => {
      // Check if user liked the puzzle
      const checkQuery = 'SELECT id FROM user_likes WHERE user_id = $1 AND puzzle_id = $2'
      const checkResult = await client.query(checkQuery, [userId, puzzleId])

      if (checkResult.rowCount === 0) {
        return {
          removed: false,
          message: 'User has not liked this puzzle',
        }
      }

      // Delete like record
      const deleteQuery = `
        DELETE FROM user_likes
        WHERE user_id = $1 AND puzzle_id = $2
        RETURNING id
      `
      await client.query(deleteQuery, [userId, puzzleId])

      // Update puzzle likes count
      const updateQuery = `
        UPDATE puzzles
        SET likes = GREATEST(likes - 1, 0), updated_at = NOW()
        WHERE puzzle_id = $1
        RETURNING puzzle_id, likes
      `
      const updateResult = await client.query(updateQuery, [puzzleId])

      return {
        removed: true,
        puzzleData: updateResult.rows[0],
      }
    })
  },

  /**
   * Check if user liked a puzzle
   */
  checkUserLike: async (userId: number, puzzleId: string): Promise<CheckLikeResult> => {
    const checkQuery = 'SELECT id FROM user_likes WHERE user_id = $1 AND puzzle_id = $2'
    const result = await query(checkQuery, [userId, puzzleId])
    return {
      hasLiked: result.rowCount > 0,
    }
  },

  /**
   * Get user liked puzzle IDs (lightweight query)
   */
  getUserLikedPuzzleIds: async (userId: number): Promise<QueryResult<{ puzzle_id: string }>> => {
    const selectQuery = `
      SELECT puzzle_id
      FROM user_likes
      WHERE user_id = $1
    `
    return await query<{ puzzle_id: string }>(selectQuery, [userId])
  },

  /**
   * Get user liked puzzles with details
   */
  getUserLikedPuzzles: async (
    userId: number,
    limit = 50,
    offset = 0
  ): Promise<QueryResult<PuzzleWithCreator>> => {
    const selectQuery = `
      SELECT p.puzzle_id, p.row_data, p.regions_data, p.dice_data, p.likes, p.is_verified, p.created_at, p.updated_at,
             u.name as creator_name, u.email as creator_email,
             ul.created_at as liked_at
      FROM user_likes ul
      JOIN puzzles p ON ul.puzzle_id = p.puzzle_id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE ul.user_id = $1
      ORDER BY ul.created_at DESC
      LIMIT $2 OFFSET $3
    `
    return await query<PuzzleWithCreator>(selectQuery, [userId, limit, offset])
  },

  /**
   * Get users who liked a puzzle
   */
  getPuzzleLikedUsers: async (
    puzzleId: string,
    limit = 50,
    offset = 0
  ): Promise<QueryResult<User>> => {
    const selectQuery = `
      SELECT u.id, u.name, u.email, u.picture, ul.created_at as liked_at
      FROM user_likes ul
      JOIN users u ON ul.user_id = u.id
      WHERE ul.puzzle_id = $1
      ORDER BY ul.created_at DESC
      LIMIT $2 OFFSET $3
    `
    return await query<User>(selectQuery, [puzzleId, limit, offset])
  },
}

/**
 * User-related database operations
 */
export const userQueries = {
  /**
   * Create a new user
   */
  createUser: async (user: CreateUserInput): Promise<QueryResult<User>> => {
    const { id, google_id, email, name, picture } = user
    const hasId = typeof id === 'number'
    const insertQuery = hasId
      ? `
        INSERT INTO users (id, google_id, email, name, picture, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `
      : `
        INSERT INTO users (google_id, email, name, picture, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `
    const params = hasId ? [id, google_id, email, name, picture] : [google_id, email, name, picture]
    return await query<User>(insertQuery, params)
  },

  /**
   * Get user by ID
   */
  getUserById: async (id: number): Promise<QueryResult<User>> => {
    const selectQuery = 'SELECT * FROM users WHERE id = $1'
    return await query<User>(selectQuery, [id])
  },

  /**
   * Get user by Google ID
   */
  getUserByGoogleId: async (googleId: string): Promise<QueryResult<User>> => {
    const selectQuery = 'SELECT * FROM users WHERE google_id = $1'
    return await query<User>(selectQuery, [googleId])
  },

  /**
   * Get user by email
   */
  getUserByEmail: async (email: string): Promise<QueryResult<User>> => {
    const selectQuery = 'SELECT * FROM users WHERE email = $1'
    return await query<User>(selectQuery, [email])
  },

  /**
   * Get all users with pagination
   */
  getAllUsers: async (limit = 50, offset = 0): Promise<QueryResult<User>> => {
    const selectQuery = `
      SELECT id, email, name, picture, google_id, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `
    return await query<User>(selectQuery, [limit, offset])
  },

  /**
   * Update user
   */
  updateUser: async (id: number, data: UpdateUserInput): Promise<QueryResult<User>> => {
    const { google_id, email, name, picture } = data
    const updateQuery = `
      UPDATE users
      SET google_id = $2, email = $3, name = $4, picture = $5, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `
    return await query<User>(updateQuery, [id, google_id, email, name, picture])
  },

  /**
   * Delete user
   */
  deleteUser: async (id: number): Promise<QueryResult<User>> => {
    const deleteQuery = 'DELETE FROM users WHERE id = $1 RETURNING *'
    return await query<User>(deleteQuery, [id])
  },
}

/**
 * Database initialization script
 */
export const initDatabase = async (): Promise<boolean> => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS puzzles (
        id SERIAL PRIMARY KEY,
        puzzle_id VARCHAR(8) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        row_data JSONB NOT NULL,
        regions_data JSONB NOT NULL,
        dice_data JSONB NOT NULL,
        likes INTEGER NOT NULL DEFAULT 0,
        is_verified INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE IF EXISTS puzzles
        ADD COLUMN IF NOT EXISTS likes INTEGER NOT NULL DEFAULT 0;

      ALTER TABLE IF EXISTS puzzles
        ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        picture TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        puzzle_id VARCHAR(8) NOT NULL REFERENCES puzzles(puzzle_id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, puzzle_id)
      );

      CREATE INDEX IF NOT EXISTS idx_puzzles_created_at ON puzzles(created_at);
      CREATE INDEX IF NOT EXISTS idx_puzzles_id ON puzzles(id);
      CREATE INDEX IF NOT EXISTS idx_puzzles_likes ON puzzles(likes);
      CREATE INDEX IF NOT EXISTS idx_puzzles_user_id ON puzzles(user_id);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
      CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON user_likes(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_likes_puzzle_id ON user_likes(puzzle_id);
    `

    await query(createTableQuery)
    logger.info('Database tables initialized successfully')
    return true
  } catch (error) {
    logger.error('Database initialization failed:', error)
    return false
  }
}

export default {
  query,
  getClient,
  testConnection,
  closePool,
  checkPoolHealth,
  withTransaction,
  puzzleQueries,
  likeQueries,
  userQueries,
  initDatabase,
}

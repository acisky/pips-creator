/**
 * Database type definitions for TypeScript
 */

/**
 * Region data structure
 */
export interface Region {
  computedValue: string
  coordinates: Array<{
    x: number
    y: number
  }>
}

/**
 * User table interface
 */
export interface User {
  id: number
  google_id: string
  email: string
  name: string
  picture: string | null
  created_at: Date
  updated_at: Date
}

/**
 * Puzzle table interface
 */
export interface Puzzle {
  id: number
  puzzle_id: string
  user_id: number | null
  row_data: number[][]
  regions_data: Region[]
  dice_data: number[][]
  likes: number
  is_verified: number
  created_at: Date
  updated_at: Date
}

/**
 * User likes table interface
 */
export interface UserLike {
  id: number
  user_id: number
  puzzle_id: string
  created_at: Date
}

/**
 * Input type for creating a puzzle
 */
export interface CreatePuzzleInput {
  id: string
  userId: number | null
  row: number[][]
  regions: Region[]
  dice: number[][]
}

/**
 * Input type for creating a user
 */
export interface CreateUserInput {
  id?: number
  google_id: string
  email: string
  name: string
  picture: string | null
}

/**
 * Input type for updating a user
 */
export interface UpdateUserInput {
  google_id: string
  email: string
  name: string
  picture: string | null
}

/**
 * Puzzle with creator information (joined data)
 */
export interface PuzzleWithCreator extends Puzzle {
  creator_name: string | null
  creator_email: string | null
  hasLiked?: boolean
}

/**
 * Like query result
 */
export interface LikeResult {
  alreadyLiked?: boolean
  removed?: boolean
  likeId?: number
  puzzleData?: {
    puzzle_id: string
    likes: number
  }
  message?: string
}

/**
 * Check like result
 */
export interface CheckLikeResult {
  hasLiked: boolean
}

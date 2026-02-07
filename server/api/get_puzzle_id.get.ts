import { query } from '~/utils/db'
import { logger } from '~/utils/logger'

export default defineEventHandler(async (event) => {
  // Set CORS headers
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  })
  
  // Handle OPTIONS request for CORS preflight
  if (event.method === 'OPTIONS') {
    return {}
  }
  
  try {
    // Get query parameters
    const params = getQuery(event)
    const puzzleId = params.puzzle_id as string

    // Validate required parameters
    if (!puzzleId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameter: puzzle_id'
      })
    }

    // Use JOIN query to get puzzle with creator information
    const selectQuery = `
      SELECT 
        p.*, 
        u.name as creator_name, 
        u.picture as creator_avatar,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'user_id', upp.user_id,
                'duration_seconds', upp.duration_seconds,
                'completed_at', upp.completed_at,
                'user_name', u2.name,
                'user_avatar', u2.picture
              ) ORDER BY upp.duration_seconds ASC
            )
            FROM user_custom_puzzle_progress upp
            LEFT JOIN users u2 ON upp.user_id = u2.id
            WHERE upp.puzzle_id = p.puzzle_id
          ),
          '[]'::json
        ) as progress
      FROM puzzles p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.puzzle_id = $1
    `
    const result = await query(selectQuery, [puzzleId])

    // If puzzle doesn't exist
    if (result.rowCount === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Puzzle with id ${puzzleId} not found`
      })
    }

    // Get the raw puzzle data
    const puzzleData = result.rows[0]

    const completed = puzzleData.progress.length;
    const bestCompletion = completed > 0 ? puzzleData.progress.reduce((min: any, item: any) => item.duration_seconds < min.duration_seconds ? item : min) : null;
    
    // Format the response according to the required structure
    const formattedData = {
      id: puzzleData.puzzle_id,
      row: puzzleData.row_data,
      regions: puzzleData.regions_data,
      dice: puzzleData.dice_data,
      // Preserve other fields that might be needed
      creator_name: puzzleData.creator_name,
      creator_avatar: puzzleData.creator_avatar,
      completed,
      bestCompletion
    }

    // Return result
    return formattedData

  } catch (error: any) {
    logger.error('Error fetching puzzle by id:', error)

    // If it's a known error, throw it directly
    if (error.statusCode) {
      throw error
    }

    // Unknown error, return 500
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch puzzle: ${error.message}`
    })
  }
})
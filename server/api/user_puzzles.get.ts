import { puzzleQueries } from '~/utils/db'
import { logger } from '~/utils/logger'

export default defineEventHandler(async (event) => {
  try {
    // Get user_id from query parameters
    const query = getQuery(event)
    const userId = query.user_id

    // Validate user_id parameter
    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameter: user_id'
      })
    }

    // Validate user_id is a valid number
    const userIdNum = parseInt(userId as string)
    if (isNaN(userIdNum) || userIdNum <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid user_id: must be a positive number'
      })
    }

    // Get pagination parameters
    const limit = parseInt((query.limit as string) || '20')
    const offset = parseInt((query.offset as string) || '0')

    // Validate pagination parameters
    if (limit <= 0 || limit > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid limit: must be between 1 and 100'
      })
    }

    if (offset < 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid offset: must be non-negative'
      })
    }

    // Call database query method
    const result = await puzzleQueries.getPuzzlesByUser(userIdNum, limit, offset)
    const totalResult = await puzzleQueries.getPuzzlesTotalCountByUser(userIdNum)
    const total = totalResult.rows[0]?.total || 0

    // Return result
    return {
      success: true,
      data: result.rows,
      total,
      pagination: {
        limit,
        offset,
        count: result.rows.length,
        total
      },
      message: `Successfully retrieved ${result.rows.length} puzzles for user ${userIdNum}`
    }

  } catch (error: any) {
    logger.error('Error fetching user puzzles:', error)

    // If it's a known error, throw it directly
    if (error.statusCode) {
      throw error
    }

    // Unknown error, return 500
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch user puzzles: ${error.message}`
    })
  }
})
import { puzzleQueries } from '~/utils/db'
import { logger } from '~/utils/logger'

export default defineEventHandler(async (event) => {
  try {
    // Get pagination parameters
    const query = getQuery(event)
    const limit = parseInt((query.limit as string) || '20')
    const offset = parseInt((query.offset as string) || '0')
    const { auth } = event.context
    const userId = auth?.user?.id || query.user_id

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

    const result = await puzzleQueries.getPuzzlesByLikesWithUserStatus(limit, offset, userId)
    const totalResult = await puzzleQueries.getPuzzlesTotalCount()
    const total = totalResult.rows[0]?.total || 0

    return {
      success: true,
      data: result.rows,
      total,
      pagination: {
        limit,
        offset,
        count: result.rows.length
      },
      message: `Successfully retrieved ${result.rows.length} puzzles sorted by likes`
    }

  } catch (error: any) {
    logger.error('Error fetching puzzles by likes:', error)

    // If it's a known error, throw it directly
    if (error.statusCode) {
      throw error
    }

    // Unknown error, return 500
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch puzzles: ${error.message}`
    })
  }
})
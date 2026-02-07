import { puzzleQueries, likeQueries } from '~/utils/db'
import { logger } from '~/utils/logger'

export default defineEventHandler(async (event) => {
  try {
    // Get request body data
    const body = await readBody(event)

    // Validate required parameters
    if (!body.puzzleId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameter: puzzleId',
      })
    }

    // Validate action type
    const action = body.action || 'toggle' // Default to toggle like status
    if (!['toggle', 'like', 'unlike', 'check'].includes(action)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid action: must be toggle, like, unlike, or check',
      })
    }

    // Get authenticated user from session
    const session = await getUserSession(event)
    const userId = session.user?.id

    // For check operation, only verify if user has liked
    if (action === 'check') {
      // If no user ID, consider not liked
      if (!userId) {
        return {
          success: true,
          data: { hasLiked: false },
          message: 'No user ID provided',
        }
      }

      const checkResult = await likeQueries.checkUserLike(userId, body.puzzleId)

      return {
        success: true,
        data: { hasLiked: checkResult.hasLiked },
        message: checkResult.hasLiked ? 'User has liked this puzzle' : 'User has not liked this puzzle',
      }
    }

    // For other operations, require authentication
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required to like/unlike puzzles',
      })
    }

    let result

    // Execute different database operations based on action type
    if (action === 'toggle') {
      // Check if user already liked
      const checkResult = await likeQueries.checkUserLike(userId, body.puzzleId)

      if (checkResult.hasLiked) {
        // If already liked, unlike
        result = await likeQueries.removeUserLike(userId, body.puzzleId)
        result.action = 'unliked'
      } else {
        // If not liked, like
        result = await likeQueries.addUserLike(userId, body.puzzleId)
        result.action = 'liked'
      }
    } else if (action === 'like') {
      // Directly add like
      result = await likeQueries.addUserLike(userId, body.puzzleId)
      result.action = 'liked'
    } else if (action === 'unlike') {
      // Directly remove like
      result = await likeQueries.removeUserLike(userId, body.puzzleId)
      result.action = 'unliked'
    }

    logger.log('Like action completed', {
      action: result.action,
      puzzle_id: body.puzzleId,
      user_id: userId,
      likes: result.puzzleData?.likes,
    })

    // Return success result
    return {
      success: true,
      data: {
        puzzle_id: body.puzzleId,
        likes: result.puzzleData?.likes || 0,
        action: result.action,
      },
      message: `Successfully ${result.action} puzzle ${body.puzzleId}`,
    }
  } catch (error: any) {
    logger.error('Error updating puzzle likes:', error)

    // If it's a known error, throw it directly
    if (error.statusCode) {
      throw error
    }

    // Unknown error, return 500
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to update puzzle likes: ${error.message}`,
    })
  }
})

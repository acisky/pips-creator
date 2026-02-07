import { z } from 'zod'
import { puzzleQueries } from '~/utils/db'
import { logger } from '~/utils/logger'

// Define Zod validation schema for puzzle deletion
const deletePuzzleSchema = z.object({
  puzzleId: z.string().length(8).regex(/^[A-Za-z0-9]+$/, 'Puzzle ID must contain only alphanumeric characters'),
  userId: z.number().int().positive().optional(),
})

export default defineEventHandler(async (event) => {
  try {
    // Get request body data
    const body = await readBody(event).catch(() => ({}))
    
    // Check if body is empty or undefined
    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Request body is required and must contain puzzleId',
      })
    }

    // Validate input with Zod
    const validatedData = deletePuzzleSchema.parse(body)

    // Get authenticated user from session
    const session = await getUserSession(event)
    const sessionUserId = session.user?.id

    // Require authentication for puzzle deletion
    if (!sessionUserId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required to delete puzzles',
      })
    }

    // If userId is provided in the request, verify it matches the authenticated user
    if (validatedData.userId && validatedData.userId !== sessionUserId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Unauthorized: User ID mismatch',
      })
    }

    // Use the userId from session
    const userId = sessionUserId

    // Check if puzzle exists and verify ownership
    const checkResult = await puzzleQueries.getPuzzle(validatedData.puzzleId)
    
    if (checkResult.rowCount === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: `Puzzle with id ${validatedData.puzzleId} not found`,
      })
    }
    
    const puzzle = checkResult.rows[0]
    if (puzzle.user_id !== userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Unauthorized: User does not own this puzzle',
      })
    }
    
    // Use the existing deletePuzzle method
    const result = await puzzleQueries.deletePuzzle(validatedData.puzzleId)

    // Return success response with safe access to result data
    return {
      success: true,
      data: result.rows?.[0] || { puzzleId: validatedData.puzzleId },
      message: `Successfully deleted puzzle ${validatedData.puzzleId}`,
    }
  } catch (error: any) {
    logger.error('Error deleting puzzle:', error)

    // If it's a known error, throw it directly
    if (error.statusCode) {
      throw error
    }

    // For validation errors from Zod
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: `Validation error: ${error || 'Invalid input'}`
      })
    }

    // Unknown error, return 500
    throw createError({
      statusCode: 500,
      statusMessage: 'Server error while deleting puzzle',
    })
  }
})
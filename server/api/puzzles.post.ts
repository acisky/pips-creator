import { z } from 'zod'
import { puzzleQueries } from '~/utils/db'
import { logger } from '~/utils/logger'

// Define Zod validation schema for puzzle creation
const puzzleSchema = z.object({
  id: z.string().length(8).regex(/^[A-Za-z0-9]+$/, 'ID must contain only alphanumeric characters'),
  userId: z.number().int().positive().nullable(),
  row: z.array(z.array(z.number().int().min(0).max(1))).min(1, 'Row data must not be empty'),
  regions: z.array(
    z.object({
      computedValue: z.string(),
      coordinates: z.array(
        z.object({
          x: z.number().int().nonnegative(),
          y: z.number().int().nonnegative(),
        })
      ).min(1, 'Region must have at least one coordinate'),
    })
  ),
  // Use z.tuple() for fixed-length array [pip1, pip2]
  dice: z.array(z.tuple([
    z.number().int().min(0).max(6),
    z.number().int().min(0).max(6)
  ])),
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Validate input with Zod
    const validatedData = puzzleSchema.parse(body)

    // Check user authorization (if needed)
    const session = await getUserSession(event)
    if (validatedData.userId && session.user?.id !== validatedData.userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Unauthorized: User ID mismatch',
      })
    }

    // Check if ID already exists
    const existingPuzzle = await puzzleQueries.getPuzzle(validatedData.id)
    if (existingPuzzle.rows.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Puzzle ID already exists',
      })
    }

    // Save puzzle
    const result = await puzzleQueries.createPuzzle(validatedData)

    if (result.rows.length > 0) {
      logger.log('Puzzle created successfully', {
        puzzle_id: validatedData.id,
        user_id: validatedData.userId,
      })

      return {
        success: true,
        puzzle_id: validatedData.id,
        message: `拼图已成功保存！ID: ${validatedData.id}`,
      }
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: '保存失败，未返回数据',
      })
    }
  } catch (error: any) {
    logger.error('Error saving puzzle:', error)

    // Zod validation error
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input data',
        data: error.errors,
      })
    }

    // Known error
    if (error.statusCode) {
      throw error
    }

    // Unknown error
    throw createError({
      statusCode: 500,
      statusMessage: `保存拼图失败: ${error.message}`,
    })
  }
})
import { userQueries } from '~/utils/db'
import { logger } from '~/utils/logger'

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile', 'openid'],
    authorizationParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
  async onSuccess(event, { user, tokens }) {
    try {
      // Check if user already exists
      let dbUser
      const existingUserResult = await userQueries.getUserByGoogleId(user.sub)

      if (existingUserResult.rows.length > 0) {
        // User exists, update user info
        const existingUser = existingUserResult.rows[0]
        const updateResult = await userQueries.updateUser(existingUser.id, {
          google_id: user.sub,
          email: user.email,
          name: user.name,
          picture: user.picture,
        })
        dbUser = updateResult.rows[0]
        logger.log('Updated existing user', { user_id: dbUser.id })
      } else {
        // Create new user
        const createResult = await userQueries.createUser({
          google_id: user.sub,
          email: user.email,
          name: user.name,
          picture: user.picture,
        })
        dbUser = createResult.rows[0]
        logger.log('Created new user', { user_id: dbUser.id })
      }

      // Set user session with database user ID
      await setUserSession(event, {
        user: {
          id: dbUser.id,
          googleId: user.sub,
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
      }, {
        cookie: {
          domain: '.pips-game.com',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        },
      })

      return sendRedirect(event, '/')
    } catch (error) {
      logger.error('Error handling Google OAuth user:', error)

      // Even if database operation fails, set basic user session
      await setUserSession(event, {
        user: {
          googleId: user.sub,
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
      }, {
        cookie: {
          domain: '.pips-game.com',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        },
      })

      return sendRedirect(event, '/')
    }
  },
})

/**
 * Color configuration for puzzle regions based on computed values
 */

import { logger } from '~/utils/logger'

export interface ColorConfig {
  name: string
  bg: string
  border: string
  text: string
}

export type ColorName = 'equal' | 'notEqual' | 'greaterThan' | 'lessThan' | 'other'

export const COLORS: ColorConfig[] = [
  { name: 'equal', bg: 'bg-equal', border: 'border-equal-border', text: 'text-equal-text' }, // "="
  { name: 'notEqual', bg: 'bg-notEqual', border: 'border-notEqual-border', text: 'text-notEqual-text' }, // "≠"
  { name: 'greaterThan', bg: 'bg-greaterThan', border: 'border-greaterThan-border', text: 'text-greaterThan-text' }, // ">"
  { name: 'lessThan', bg: 'bg-lessThan', border: 'border-lessThan-border', text: 'text-lessThan-text' }, // "<"
  { name: 'other', bg: 'bg-other', border: 'border-other-border', text: 'text-other-text' }, // 其他
]

export const COLOR_MAP: Record<string, ColorConfig> = COLORS.reduce(
  (acc, color) => {
    acc[color.name] = color
    return acc
  },
  {} as Record<string, ColorConfig>
)

export const COLOR_HEX_MAP: Record<ColorName, string> = {
  equal: '0xef4444',
  notEqual: '0x10b981',
  greaterThan: '0xa855f7',
  lessThan: '0xf97316',
  other: '0x3b82f6',
}

/**
 * Get corresponding color based on computed value
 * @param computedValue - Computed value (e.g., "=", "≠", ">5", "<10")
 * @returns Color name
 */
export const getColorByComputedValue = (computedValue: string | null | undefined): ColorName => {
  if (!computedValue) {
    logger.debug('Color selection: Empty value, returning "other"')
    return 'other'
  }

  logger.debug('Color selection: Input value:', { computedValue, type: typeof computedValue })

  // Convert to string and trim whitespace
  const value = String(computedValue).trim()

  if (value === '=') {
    logger.debug('Color selection: Matched "=" -> equal (red)')
    return 'equal'
  } else if (value === '≠' || value === '!=') {
    logger.debug('Color selection: Matched "≠" or "!=" -> notEqual (green)')
    return 'notEqual'
  } else if (value.startsWith('>')) {
    logger.debug('Color selection: Matched ">" prefix -> greaterThan (purple)')
    return 'greaterThan'
  } else if (value.startsWith('<')) {
    logger.debug('Color selection: Matched "<" prefix -> lessThan (orange)')
    return 'lessThan'
  } else {
    logger.debug('Color selection: No special symbol matched -> other (blue)')
    return 'other'
  }
}

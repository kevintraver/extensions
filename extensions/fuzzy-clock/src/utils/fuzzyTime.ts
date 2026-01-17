/**
 * Fuzzy Clock - Converts precise time to natural language
 * Ported from https://github.com/kevintraver/fuzzy-clock-rust
 */

// State-to-format mapping (from fuzzy_map.yml)
const FUZZY_FORMATS: Record<number, string> = {
  0: "{} o'clock",
  1: 'shortly after {}',
  2: 'five past {}',
  3: 'ten past {}',
  4: 'quarter past {}',
  5: 'twenty past {}',
  6: 'twentyfive past {}',
  7: 'half past {}',
  8: 'twentyfive to {}',
  9: 'twenty to {}',
  10: 'quarter to {}',
  11: 'ten to {}',
  12: 'five to {}',
  13: 'nearly {}'
}

// States 8-13 refer to the next hour
const NEXT_HOUR_STATES = new Set([8, 9, 10, 11, 12, 13])

// Hour names (index 0-11 maps to twelve, one, two, ... eleven)
const HOUR_NAMES: string[] = [
  'twelve',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven'
]

/**
 * Calculate the fuzzy clock state based on current time
 * Uses a 30-second step system for smooth transitions
 *
 * State mapping:
 * - 0: o'clock (minute 0-1)
 * - 1: shortly after (minute 1-3)
 * - 2-7: five/ten/quarter/twenty/twentyfive past, half past
 * - 8-12: twentyfive/twenty/quarter/ten/five to
 * - 13: nearly (next hour)
 */
function getState(minutes: number, seconds: number): number {
  // Compute the current 30-second step of the current hour (0-119)
  const step = minutes * 2 + Math.floor(seconds / 30)

  // During the first minute, stick at the full hour
  if (step < 2) {
    return 0
  }

  // Special state before the first full 5 minutes
  if (step <= 5) {
    return 1
  }

  // Round to full 5 minute steps
  if (step < 116) {
    return 1 + Math.floor((step + 4) / 10)
  }

  // Round to full next hour
  return 13
}

/**
 * Get the fuzzy time string for a given Date
 */
export function getFuzzyTime(date: Date = new Date()): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  const state = getState(minutes, seconds)
  const format = FUZZY_FORMATS[state]

  // Determine if we reference current or next hour
  const hourOffset = NEXT_HOUR_STATES.has(state) ? 1 : 0
  const hourIndex = (hours + hourOffset) % 12
  const hourName = HOUR_NAMES[hourIndex]

  return format.replace('{}', hourName)
}

/**
 * Get fuzzy time with optional capitalization
 */
export function getFuzzyTimeFormatted(
  date: Date = new Date(),
  capitalize = true
): string {
  const fuzzyTime = getFuzzyTime(date)
  return capitalize
    ? fuzzyTime.charAt(0).toUpperCase() + fuzzyTime.slice(1)
    : fuzzyTime
}

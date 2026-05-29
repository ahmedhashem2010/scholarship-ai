// Light mode ↔ Dark mode color reference
// Use these patterns consistently across all components

// BACKGROUNDS
// Page:        bg-white dark:bg-gray-900
// Card:        bg-white dark:bg-gray-800
// Card hover:  hover:bg-gray-50 dark:hover:bg-gray-700
// Secondary:   bg-gray-50 dark:bg-gray-800/50
// Muted:       bg-gray-100 dark:bg-gray-800

// TEXT
// Primary:     text-gray-900 dark:text-white
// Secondary:   text-gray-600 dark:text-gray-400
// Tertiary:    text-gray-500 dark:text-gray-500
// Muted:       text-gray-400 dark:text-gray-500

// BORDERS
// Default:     border-gray-200 dark:border-gray-700
// Input:       border-gray-300 dark:border-gray-600

// ACCENT ICON BG
// Blue:        bg-blue-100 dark:bg-blue-900/50    text-blue-600 dark:text-blue-400
// Green:       bg-green-100 dark:bg-green-900/50   text-green-600 dark:text-green-400
// Orange:      bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400
// Red:         bg-red-100 dark:bg-red-900/50       text-red-600 dark:text-red-400

// GRADIENT BG
// Light:  bg-gradient-to-br from-{color}-50 to-{color}-100
// Dark:   dark:from-{color}-900/30 dark:to-{color}-800/30

// BUTTONS
// Primary:     bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800
// Secondary:   bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600
// Outline:     border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300

// SHADOWS
// Light:       shadow-md
// Dark:        dark:shadow-lg dark:shadow-black/20

// NAV
// Light:       bg-white border-b border-gray-100
// Dark:        dark:bg-gray-900 dark:border-gray-800

// FOOTER
// Light:       bg-gray-900
// Dark:        dark:bg-black

export const colorMap = {
  page: "bg-white dark:bg-gray-900",
  card: "bg-white dark:bg-gray-800",
  cardHover: "hover:bg-gray-50 dark:hover:bg-gray-700",
  sectionAlt: "bg-gray-50 dark:bg-gray-800/50",
  text: "text-gray-900 dark:text-white",
  textSecondary: "text-gray-600 dark:text-gray-400",
  textTertiary: "text-gray-500 dark:text-gray-500",
  textMuted: "text-gray-400 dark:text-gray-500",
  border: "border-gray-200 dark:border-gray-700",
  borderInput: "border-gray-300 dark:border-gray-600",
  nav: "bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800",
  footer: "bg-gray-900 dark:bg-black",
} as const

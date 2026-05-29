# ScholarshipAI Design System

## Colors
- Primary Blue: #2563EB (trust, education)
- Success Green: #10B981 (completed)
- Warning Orange: #F59E0B (attention)
- Error Red: #EF4444 (problems)
- Neutral Gray: #6B7280 (secondary)
- Background: #F9FAFB (light gray)

## Typography
- Headlines: 'Sora' or 'Inter' (clean, modern)
- Body: 'Inter' (readable at any size)

## Spacing Scale
- xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px | 2xl: 48px

## Component Sizes
- Card: padding 24px
- Button: 12px vertical, 24px horizontal
- Input: 44px height (mobile-friendly)
- Border radius: 8px (slightly rounded, modern)

## Shadows
- sm: 0 1px 2px rgba(0,0,0,0.05)
- md: 0 4px 6px rgba(0,0,0,0.1)
- lg: 0 10px 15px rgba(0,0,0,0.15)

## Design Principles
1. Always use Tailwind theme variables (bg-card, text-foreground, etc.) — never hardcode light colors
2. Dark mode must work everywhere — use dark: variants where needed
3. RTL support via cn() utility and isRTL from LanguageContext
4. Cards should hover-lift with shadow-float
5. Gradient hero sections for page headers
6. Medal/rank badges for top items
7. Progress bars for completion tracking
8. Icons for every section header (makes it scannable)

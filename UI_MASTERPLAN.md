# SmartScholar v2.0 — Complete Frontend Rebuild

**Version:** 2.0  
**Date:** August 6, 2026  
**Status:** Planning Phase — Zero Implementation

---

## Executive Summary

This is a **complete frontend rebuild** of SmartScholar. Not a redesign. Not CSS improvements. A ground-up reconstruction that makes SmartScholar look like a funded Silicon Valley AI startup.

**What Changes:**
- ✅ Every component rebuilt from scratch
- ✅ Entire landing page replaced
- ✅ Complete dashboard redesign
- ✅ New brand colors (#0F172A + #D4AF37)
- ✅ Modern animations (Framer Motion)
- ✅ English-first default language
- ✅ Premium typography and spacing

**What Stays:**
- ✅ All backend APIs (unchanged)
- ✅ Authentication system (Supabase)
- ✅ Database schema (Prisma)
- ✅ Business logic (matching, AI review)
- ✅ Routing structure (Next.js App Router)

**Design Inspiration:**
Linear • Perplexity AI • Stripe • Vercel • Notion AI • Cursor • OpenAI • Arc Browser

**User Reaction Goal:**
*"This looks like a company that raised millions."*

---

## 1. New Brand Identity

### Color System

```css
/* PRIMARY — Dark Slate */
--primary: #0F172A
--primary-50: #F8FAFC
--primary-100: #F1F5F9
--primary-200: #E2E8F0
--primary-300: #CBD5E1
--primary-400: #94A3B8
--primary-500: #64748B
--primary-600: #475569
--primary-700: #334155
--primary-800: #1E293B
--primary-900: #0F172A

/* ACCENT — Gold */
--accent: #D4AF37
--accent-50: #FEFCE8
--accent-100: #FEF9C3
--accent-200: #FEF08A
--accent-300: #FDE047
--accent-400: #FACC15
--accent-500: #D4AF37
--accent-600: #CA8A04
--accent-700: #A16207
--accent-800: #854D0E
--accent-900: #713F12

/* SEMANTIC COLORS */
--background: #F8FAFC
--surface: #FFFFFF
--text-primary: #0F172A
--text-secondary: #64748B
--text-tertiary: #94A3B8

/* STATE COLORS */
--success: #10B981
--warning: #F59E0B
--error: #EF4444
--info: #3B82F6
```

### Design Principles

**Clean**
- No heavy borders
- No ugly gradients
- No blurry backgrounds
- No random glass effects
- Everything minimal and intentional

**Modern**
- Large headlines (48px-72px)
- Generous whitespace
- Perfect visual hierarchy
- Professional spacing (8px grid)
- Subtle shadows only

**Premium**
- 18-24px border radius
- Smooth Framer Motion animations
- High-quality typography
- Consistent component language

---

## 2. Typography System

### Font Family
IBM Plex Sans + IBM Plex Sans Arabic (keep existing, works perfectly)

### Type Scale

```css
/* DISPLAY (Hero sections only) */
display-2xl: 72px, weight 700, line-height 1.1, tracking -0.02em
display-xl:  60px, weight 700, line-height 1.1, tracking -0.02em
display-lg:  48px, weight 700, line-height 1.2, tracking -0.01em

/* HEADINGS */
h1: 36px, weight 700, line-height 1.2, tracking -0.01em
h2: 30px, weight 600, line-height 1.3, tracking -0.005em
h3: 24px, weight 600, line-height 1.4
h4: 20px, weight 600, line-height 1.5

/* BODY */
xl:   20px, weight 400, line-height 1.7
lg:   18px, weight 400, line-height 1.7
base: 16px, weight 400, line-height 1.6  (default)
sm:   14px, weight 400, line-height 1.5
xs:   12px, weight 500, line-height 1.4
```

### Usage Guidelines
- Hero headlines: `display-lg` or `display-xl`
- Section headers: `h2` (30px)
- Card titles: `h4` (20px)
- Body text: `base` (16px)
- UI labels: `sm` (14px)
- Captions: `xs` (12px)

---

## 3. Spacing System

Based on 8px grid:

```
1:   4px   (hairline gaps)
2:   8px   (xs - tight spacing)
3:   12px  (sm - compact)
4:   16px  (md - default gap)
6:   24px  (lg - comfortable)
8:   32px  (xl - generous)
10:  40px  (2xl - section breaks)
12:  48px  (3xl - major sections)
16:  64px  (4xl - hero spacing)
20:  80px  (5xl - page sections)
24:  96px  (6xl - landing sections)
```

**Usage:**
- Component internal padding: 16-24px
- Card gaps: 16px
- Section vertical spacing: 48-64px
- Hero sections: 96px+ vertical padding
- Landing page sections: 80-128px apart

---

## 4. Component Library (All New Components)

Every component will be rebuilt from scratch. No modifications to existing components.

### 4.1 Buttons

**Primary Button**
```tsx
// Gold accent, high contrast
bg-accent hover:bg-accent/90
text-primary font-semibold
px-6 py-3 rounded-[18px]
transition-all duration-200
shadow-sm hover:shadow-md
```

**Secondary Button**
```tsx
// Outlined, minimal
bg-transparent hover:bg-primary/5
text-primary font-medium
px-6 py-3 rounded-[18px]
border border-primary/10
transition-all duration-200
```

**Ghost Button**
```tsx
// Text only
text-primary/70 hover:text-primary hover:bg-primary/5
px-4 py-2 rounded-[12px]
transition-all duration-150
```

### 4.2 Input Fields

**Text Input**
```tsx
bg-white border border-primary/10
rounded-[16px] px-4 py-3
text-base text-primary
focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
placeholder:text-primary/40
transition-all duration-200
```

**Search Input**
```tsx
// With icon prefix
bg-white border border-primary/10
rounded-[20px] px-5 py-3 pl-12
Icon: absolute left-4, text-primary/40
```

### 4.3 Cards

**Base Card**
```tsx
bg-white rounded-[24px]
border border-primary/8
p-6
hover:shadow-lg hover:border-primary/12
transition-all duration-300
```

**Scholarship Card (New Design)**
```tsx
// Container
bg-white rounded-[24px]
border border-primary/8
p-8
hover:shadow-xl hover:border-accent/20
transition-all duration-300

// Layout
Grid: Logo | Content | Score Badge

// Logo Area
w-16 h-16 rounded-[16px]
bg-primary/5
flex items-center justify-center

// Title
text-xl font-semibold text-primary
mb-2

// Metadata
flex gap-4
text-sm text-primary/60
Icons: 16x16

// Match Score (Right side)
Circular badge: 72x72px
bg-gradient (based on score)
text-2xl font-bold
Animated on mount

// Tags
flex flex-wrap gap-2
bg-primary/5 text-primary/70
px-3 py-1.5 rounded-full text-sm

// CTA Button
Primary button style
w-full mt-6
```

**Feature Card**
```tsx
// For landing page features
bg-white rounded-[24px]
border border-primary/8
p-8
hover:shadow-lg
transition-all duration-300

// Icon Container
w-12 h-12 rounded-[16px]
bg-accent/10
flex items-center justify-center

// Title
text-xl font-semibold mb-3

// Description
text-primary/70 leading-relaxed
```

### 4.4 Navigation

**Top Navbar (New)**
```tsx
// Container
fixed top-0 w-full z-50
bg-white/80 backdrop-blur-xl
border-b border-primary/8

// Content
max-w-7xl mx-auto px-6
h-20 flex items-center justify-between

// Logo
text-2xl font-bold text-primary
SmartScholar wordmark

// Nav Links (Desktop)
flex gap-8
text-base font-medium text-primary/70
hover:text-primary transition-colors

// CTA Button
Primary button (smaller: px-5 py-2.5)

// Mobile Menu
Slide-in drawer from right
Full-height, bg-white
```

**Dashboard Sidebar (New)**
```tsx
// Container
w-72 h-screen fixed left-0
bg-white border-r border-primary/8
p-6

// Logo Area
mb-12

// Navigation Groups
space-y-8

// Nav Item
flex items-center gap-3
px-4 py-3 rounded-[16px]
text-primary/70 hover:text-primary
hover:bg-primary/5
transition-all duration-200

// Active State
bg-accent/10 text-accent
font-semibold

// Icon
w-5 h-5
stroke-width: 2

// Mobile: Hidden, replaced with bottom nav
```

**Mobile Bottom Nav**
```tsx
// Only on mobile (<768px)
fixed bottom-0 w-full
bg-white border-t border-primary/8
safe-area-inset-bottom

// Items
flex justify-around
p-4

// Nav Item
flex flex-col items-center gap-1
text-primary/60 active:text-accent

// Icon
w-6 h-6

// Label
text-xs font-medium
```

### 4.5 Badges & Pills

**Status Badge**
```tsx
// Base
inline-flex items-center gap-1.5
px-3 py-1.5 rounded-full
text-sm font-medium

// Variants
Success: bg-success/10 text-success
Warning: bg-warning/10 text-warning
Error: bg-error/10 text-error
Info: bg-info/10 text-info
Neutral: bg-primary/5 text-primary/70
```

**Score Badge**
```tsx
// Circular score indicator
w-20 h-20 rounded-full
bg-gradient based on score
flex items-center justify-center
text-2xl font-bold text-white
shadow-lg

// Variants by score
90-100: bg-gradient-to-br from-accent to-accent/80
75-89:  bg-gradient-to-br from-success to-success/80
60-74:  bg-gradient-to-br from-info to-info/80
<60:    bg-gradient-to-br from-warning to-warning/80
```

### 4.6 Modals & Dialogs

**Modal**
```tsx
// Overlay
fixed inset-0 z-50
bg-primary/60 backdrop-blur-sm

// Modal Container
max-w-2xl w-full
bg-white rounded-[32px]
shadow-2xl
Framer Motion: scale + fade animation

// Header
px-8 py-6 border-b border-primary/8
text-2xl font-semibold

// Body
px-8 py-6
max-h-[70vh] overflow-y-auto

// Footer
px-8 py-6 border-t border-primary/8
flex justify-end gap-3
```

### 4.7 Loading States

**Skeleton Loader**
```tsx
// Match target component shape
bg-primary/5 rounded-[16px]
animate-pulse
```

**Spinner**
```tsx
// Circular spinner
w-8 h-8 border-4
border-primary/20 border-t-accent
rounded-full animate-spin
```

**Progress Bar**
```tsx
// Track
w-full h-2 bg-primary/10 rounded-full

// Fill
h-2 bg-accent rounded-full
transition-all duration-500
```

### 4.8 Empty States

**Empty State Component**
```tsx
// Container
flex flex-col items-center
text-center py-16 px-6

// Icon
w-20 h-20 text-primary/20 mb-6

// Title
text-2xl font-semibold text-primary mb-3

// Description
text-lg text-primary/60 mb-8
max-w-md

// CTA
Primary button
```

### 4.9 Toast Notifications

**Toast**
```tsx
// Container
fixed top-4 right-4 z-50
max-w-sm w-full

// Toast Item
bg-white rounded-[20px]
border border-primary/10
shadow-xl
p-4
Framer Motion: slide in from right

// Content
flex items-start gap-3

// Icon (colored by type)
w-5 h-5

// Text
flex-1
Title: font-semibold text-sm
Body: text-sm text-primary/70

// Close button
ml-auto text-primary/40 hover:text-primary
```

### 4.10 Tables

**Data Table**
```tsx
// Container
bg-white rounded-[24px]
border border-primary/8
overflow-hidden

// Header
bg-primary/3
text-left font-semibold text-sm
text-primary/70 uppercase tracking-wide
px-6 py-4

// Row
border-t border-primary/8
hover:bg-primary/3
transition-colors duration-150
px-6 py-4

// Cell
text-base text-primary
Numeric: text-right tabular-nums
```

---

## 5. Landing Page (Complete Rebuild)

### New Landing Page Structure

**5.1 Hero Section**

```
┌─────────────────────────────────────────┐
│  Navbar                                 │
├─────────────────────────────────────────┤
│                                         │
│  [Announcement Badge]                   │
│  "✨ New: AI-powered document review"   │
│                                         │
│  Find scholarships you can              │
│  actually win                           │
│                                         │
│  One-sentence value prop               │
│                                         │
│  [Get Started] [See How It Works →]   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │                                   │ │
│  │  Dashboard Preview Mockup        │ │
│  │  (Actual UI preview, not random  │ │
│  │   scholarship cards)             │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Hero Specifications:**
- Announcement badge: rounded-full, bg-accent/10, text-accent
- Headline: display-xl (60px), font-bold, text-primary
- Subheadline: text-xl (20px), text-primary/70, max-w-2xl
- CTA buttons: Large (px-8 py-4)
- Dashboard mockup: Actual dashboard design with:
  - AI Match Score widget
  - 3 scholarship cards with scores
  - Timeline preview
  - Profile completion indicator
  - Upcoming deadlines list
  - AI assistant chat preview

**5.2 Statistics Bar**
```
┌─────────────────────────────────────────┐
│  [234]        [50K+]       [92%]        │
│  Scholarships  Students   Match Rate    │
└─────────────────────────────────────────┘
```

**5.3 Features Section**

3-column grid on desktop, single column on mobile

Each feature card shows:
- Icon (lucide-react, 24x24, stroke-2)
- Title (h3, 24px)
- Description (base, text-primary/70)
- Visual indicator or small demo

**Features:**
1. **AI Matching**
   - Know if you qualify before applying
   - Visual: Percentage match visualization

2. **Personalized Roadmap**
   - Step-by-step timeline for each scholarship
   - Visual: Mini timeline graphic

3. **Document AI Review**
   - Get scored feedback on your CV and essays
   - Visual: Score card preview

4. **Deadline Tracking**
   - Never miss an application window
   - Visual: Calendar widget

5. **Application Progress**
   - Track everything in one place
   - Visual: Progress chart

6. **Multilingual Support**
   - English and Arabic interfaces
   - Visual: Language toggle

**5.4 How It Works**

Horizontal step flow (vertical on mobile)

```
1. Complete Profile → 2. Get Matches → 3. Build Roadmap → 4. Apply with Confidence
```

Each step:
- Number badge (large, accent color)
- Title (h4)
- Description
- Small illustration or icon

**5.5 Dashboard Preview Section**

**"See your scholarship journey at a glance"**

Full-width dashboard screenshot showing:
- Sidebar navigation
- Main content with scholarship matches
- AI assistant in corner
- Timeline widget
- Stats cards

This must look like a REAL product, not placeholder content.

**5.6 Testimonials**

3-column grid

Each testimonial card:
- Quote (italic, text-lg)
- Author name (font-semibold)
- Location + degree (text-sm, text-primary/60)
- Avatar (circular, if available)

**5.7 Pricing Section**

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│   Free   │  │  Premium │  │  Pro     │
└──────────┘  └──────────┘  └──────────┘
```

Center card (Premium) highlighted with:
- border-accent
- shadow-xl
- "Most Popular" badge

Each plan shows:
- Price (display-lg for number, text-lg for "/month")
- Features list (checkmarks)
- CTA button

**5.8 FAQ**

Accordion component
- Question: font-semibold, text-lg
- Chevron icon (rotates on open)
- Answer: text-primary/70, leading-relaxed

**5.9 Footer**

```
┌─────────────────────────────────────────┐
│  SmartScholar                           │
│                                         │
│  [Product] [Company] [Resources] [Legal]│
│                                         │
│  © 2026 SmartScholar                   │
└─────────────────────────────────────────┘
```

---

## 6. Dashboard Pages (Complete Rebuild)

### 6.1 Dashboard Home

**Layout:**
```
┌─────────┬──────────────────────────┐
│         │  Stats Cards Row         │
│ Sidebar │  (4 cards)               │
│         ├──────────────────────────┤
│         │                          │
│         │  Scholarship Matches     │
│         │  (Grid of 6 cards)       │
│         │                          │
│         ├──────────────────────────┤
│         │  Upcoming Deadlines      │
│         │  (Timeline widget)       │
└─────────┴──────────────────────────┘
```

**Stats Cards:**
1. Match Score (large number + trend)
2. Active Applications (number + status breakdown)
3. Documents Ready (number + percentage)
4. Upcoming Deadlines (count + nearest date)

**Widgets:**
- Scholarship Matches grid (cards with match scores)
- Deadline timeline (visual, horizontal)
- AI Assistant floating button (bottom-right)
- Profile completion banner (if incomplete)

### 6.2 Scholarships (Browse & Match)

**Layout:**
```
┌─────────┬──────────────────────────┐
│         │  Search + Filters Bar    │
│ Sidebar ├──────────────────────────┤
│         │  [Filter chips]          │
│         ├──────────────────────────┤
│         │  Scholarship Grid        │
│         │  (2-col cards)           │
│         │  Sorted by match score   │
│         └──────────────────────────┘
```

**Features:**
- Search bar (rounded-[20px], prominent)
- Filter dropdown (country, degree, deadline, funding)
- Sort options (match score, deadline, amount)
- Scholarship cards with match scores
- Save/bookmark toggle on each card
- Compare selection (checkboxes)
- Empty state when no matches

### 6.3 Compare Scholarships

**Layout:**
Side-by-side comparison table

```
┌──────────────┬─────────┬─────────┬─────────┐
│              │ Schol A │ Schol B │ Schol C │
├──────────────┼─────────┼─────────┼─────────┤
│ Match Score  │  92%    │  87%    │  81%    │
│ Country      │  ...    │  ...    │  ...    │
│ Degree       │  ...    │  ...    │  ...    │
│ Deadline     │  ...    │  ...    │  ...    │
│ Funding      │  ...    │  ...    │  ...    │
│ Requirements │  ...    │  ...    │  ...    │
└──────────────┴─────────┴─────────┴─────────┘
```

- Sticky header row
- Highlight best value per row
- Remove column button
- Add scholarship button

### 6.4 Roadmap

**Layout:**
Vertical timeline with milestone cards

```
│
●── Book IELTS Test          [Due: Sep 15]
│   Status: In Progress
│
●── Request Recommendation    [Due: Oct 1]
│   Status: Not Started
│
●── Write Personal Statement  [Due: Oct 20]
│   Status: Not Started
│
●── Submit Application        [Due: Nov 1]
│   Status: Not Started
```

**Features:**
- Vertical timeline with connecting line
- Milestone cards (status, due date, actions)
- Color-coded status (complete, in-progress, upcoming, overdue)
- Check-off animation on completion
- Progress percentage at top

### 6.5 Documents

**Layout:**
```
┌─────────┬──────────────────────────┐
│         │  Upload Dropzone         │
│ Sidebar ├──────────────────────────┤
│         │  Documents List          │
│         │  - CV.pdf (Score: 8.5)   │
│         │  - Essay.pdf (Score: 7)  │
│         │  - Statement.pdf         │
└─────────┴──────────────────────────┘
```

**Features:**
- Drag-and-drop upload zone (dashed border, hover state)
- Document cards with review scores
- Version history indicator
- Quick actions (view, review, delete)
- File type icons
- Upload progress bar

### 6.6 AI Review

**Layout:**
```
┌─────────┬──────────────────────────┐
│         │  Document Preview | Review│
│ Sidebar │  ┌────────┐ ┌──────────┐ │
│         │  │        │ │ Score: 85 │ │
│         │  │  PDF   │ │           │ │
│         │  │  View  │ │ Strengths │ │
│         │  │        │ │ Weaknesses│ │
│         │  │        │ │ Suggestions│ │
│         │  └────────┘ └──────────┘ │
└─────────┴──────────────────────────┘
```

**Features:**
- Split view: document + review
- Animated score ring (0 to score)
- Strengths list (green checkmarks)
- Weaknesses list (amber warnings)
- Prioritized suggestions
- Re-review button
- Version comparison

### 6.7 Profile

**Layout:**
```
┌─────────┬──────────────────────────┐
│         │  Profile Header          │
│ Sidebar │  Avatar + Name + Complete%│
│         ├──────────────────────────┤
│         │  Tabbed Sections:        │
│         │  [Personal][Academic][...] │
│         │                          │
│         │  Form fields per section │
└─────────┴──────────────────────────┘
```

**Features:**
- Profile completion ring
- Tabbed sections (Personal, Academic, Preferences)
- Clean form inputs
- Save with success toast
- Avatar upload

### 6.8 Payments / Credits

**Layout:**
```
┌─────────┬──────────────────────────┐
│         │  Credit Balance Card     │
│ Sidebar │  Large number + Buy button│
│         ├──────────────────────────┤
│         │  Credit Packages         │
│         │  [Package cards]         │
│         ├──────────────────────────┤
│         │  Transaction History     │
│         │  (Table)                 │
└─────────┴──────────────────────────┘
```

**Features:**
- Balance card (prominent, gold accent)
- Credit package cards (Stripe + manual methods)
- Payment method selection
- Transaction history table
- Manual payment instructions (Vodafone Cash, InstaPay)

### 6.9 Admin (Payments)

**Layout:**
```
┌─────────┬──────────────────────────┐
│         │  Admin Stats Row         │
│ Sidebar ├──────────────────────────┤
│         │  Pending Payments Table  │
│         │  - Approve/Reject actions│
│         │  - User, amount, method  │
└─────────┴──────────────────────────┘
```

**Features:**
- Admin-only access (gated on ADMIN_EMAIL)
- Pending payment approvals
- User management table
- Approve/reject with confirmation modal
- Filter and search

---

## 7. Mobile Experience

### Breakpoints
```
Mobile:  375px, 390px, 430px
Tablet:  768px
Desktop: 1024px, 1280px, 1440px+
```

### Mobile-Specific Patterns
- Bottom tab navigation (replaces sidebar)
- Hamburger menu for secondary nav
- Full-width cards (single column)
- Sticky CTAs at bottom
- Swipeable card carousels
- Touch-friendly hit targets (min 44px)
- Collapsible sections
- Bottom sheet modals (instead of center modals)

### Responsive Rules
- Landing hero: Stack vertically on mobile
- Feature grid: 3-col → 1-col
- Dashboard: Sidebar → bottom nav
- Tables: Horizontal scroll or card view
- Comparison: Swipeable columns
- No horizontal overflow anywhere

---

## 8. Animation System (Framer Motion)

### Page Transitions
```tsx
// Fade + slide up
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -20 }}
transition={{ duration: 0.3, ease: "easeOut" }}
```

### Card Entrance (Stagger)
```tsx
// Container
staggerChildren: 0.08

// Each card
initial={{ opacity: 0, y: 16 }}
animate={{ opacity: 1, y: 0 }}
```

### Hover Effects
```tsx
// Cards
whileHover={{ y: -4, transition: { duration: 0.2 } }}

// Buttons
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}
```

### Score Animations
```tsx
// Count up numbers
Animated from 0 to target value
Duration: 1.5s ease-out

// Ring fill
strokeDashoffset animation
```

### Loading Skeletons
```tsx
// Pulse animation
animate-pulse on bg-primary/5
```

### Modal Animations
```tsx
// Backdrop
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}

// Content
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
```

**Accessibility:** All animations respect `prefers-reduced-motion`

---

## 9. Component Inventory (Complete List)

### Existing Components to Rebuild

| Component | Current File | Action |
|-----------|-------------|--------|
| Navigation | `src/components/nav.tsx` | Rebuild |
| Sidebar | `src/components/sidebar.tsx` | Rebuild |
| User Nav | `src/components/user-nav.tsx` | Rebuild |
| Chat Widget | `src/components/chat-widget.tsx` | Rebuild |
| Scholarship Card | `src/components/ui/scholarship-card.tsx` | Rebuild |
| Scholarship Card List | `src/components/scholarship-card-list.tsx` | Rebuild |
| Compare Selector | `src/components/compare-selector.tsx` | Rebuild |
| Document Progress | `src/components/DocumentProgress.tsx` | Rebuild |
| Improvement Checklist | `src/components/ImprovementChecklist.tsx` | Rebuild |
| Review Display | `src/components/ReviewDisplay.tsx` | Rebuild |
| PDF Viewer | `src/components/pdf-viewer.tsx` | Keep logic, restyle |
| Help Tooltip | `src/components/help-tooltip.tsx` | Rebuild |
| Upload Dropzone | `src/components/documents/upload-dropzone.tsx` | Rebuild |
| Score Ring | `src/components/scholarship/score-ring.tsx` | Rebuild |
| Empty States | `src/components/scholarship/empty-states.tsx` | Rebuild |
| Feedback Section | `src/components/scholarship/feedback-section.tsx` | Rebuild |
| Version Timeline | `src/components/scholarship/version-timeline.tsx` | Rebuild |

### UI Primitives to Rebuild

| Primitive | File | Action |
|-----------|------|--------|
| Button | `src/components/ui/button.tsx` | Rebuild |
| Input | `src/components/ui/input.tsx` | Rebuild |
| Card | `src/components/ui/card.tsx` | Rebuild |
| Badge | `src/components/ui/badge.tsx` | Rebuild |
| Select | `src/components/ui/select.tsx` | Rebuild |
| Dropdown Menu | `src/components/ui/dropdown-menu.tsx` | Rebuild |
| Checkbox | `src/components/ui/checkbox.tsx` | Rebuild |
| Tabs | `src/components/ui/tabs.tsx` | Rebuild |
| Toast | `src/components/ui/toast.tsx` | Rebuild |
| Skeleton | `src/components/ui/skeleton.tsx` | Rebuild |
| Progress | `src/components/ui/progress.tsx` | Rebuild |
| Progress Bar | `src/components/ui/progress-bar.tsx` | Rebuild |
| Avatar | `src/components/ui/avatar.tsx` | Rebuild |
| Accordion | `src/components/ui/accordion.tsx` | Rebuild |
| Collapsible | `src/components/ui/collapsible.tsx` | Rebuild |
| Separator | `src/components/ui/separator.tsx` | Rebuild |
| Label | `src/components/ui/label.tsx` | Rebuild |
| Scroll Area | `src/components/ui/scroll-area.tsx` | Rebuild |
| Status Badge | `src/components/ui/status-badge.tsx` | Rebuild |
| Fit Score | `src/components/ui/fit-score.tsx` | Rebuild |
| Deadline Indicator | `src/components/ui/deadline-indicator.tsx` | Rebuild |
| Empty | `src/components/ui/empty.tsx` | Rebuild |

### New Components to Create

| Component | Purpose |
|-----------|---------|
| `AnnouncementBadge` | Hero announcement pill |
| `DashboardPreview` | Landing page product mockup |
| `StatCard` | Dashboard metric cards |
| `FeatureCard` | Landing feature cards |
| `TestimonialCard` | Social proof cards |
| `PricingCard` | Pricing plan cards |
| `Timeline` | Roadmap/deadline timeline |
| `MatchScoreRing` | Animated circular score |
| `AIAssistant` | Floating chat widget |
| `MobileBottomNav` | Mobile navigation |
| `PageTransition` | Framer Motion wrapper |
| `Modal` | Reusable dialog |
| `CommandMenu` | Cmd+K quick nav (optional) |

---

## 10. Priority Order (Highest Impact First)

### Phase 1: Foundation (Design System)
1. **Global CSS + Tailwind config** — New color tokens, typography, spacing
2. **Core UI primitives** — Button, Input, Card, Badge
3. **Layout components** — Navbar, Sidebar, Footer
4. **Framer Motion setup** — Page transitions, animation utilities

### Phase 2: Landing Page (First Impression)
5. **Hero section** — Headline, CTAs, announcement badge
6. **Dashboard preview mockup** — The centerpiece
7. **Features section** — Feature cards
8. **How it works** — Step flow
9. **Testimonials + Statistics**
10. **Pricing section**
11. **FAQ + Footer**

### Phase 3: Dashboard Core
12. **Dashboard home** — Stats, matches, widgets
13. **Scholarship browse/match** — Cards, filters, search
14. **Scholarship detail page**

### Phase 4: Feature Pages
15. **AI Review** — Split view, score animations
16. **Documents** — Upload, list, versions
17. **Roadmap** — Timeline
18. **Compare** — Comparison table

### Phase 5: Account & Admin
19. **Profile** — Tabbed form
20. **Payments/Credits** — Balance, packages
21. **Admin** — Payment approvals

### Phase 6: Polish
22. **Mobile refinements** — Bottom nav, responsive fixes
23. **Loading states** — Skeletons everywhere
24. **Empty states** — All pages
25. **Micro-interactions** — Hover, transitions
26. **Accessibility audit** — Focus states, ARIA

---

## 11. Estimated Development Time

| Screen / Section | Estimated Time |
|------------------|----------------|
| Design system foundation | 6-8 hours |
| Core UI primitives (all) | 8-10 hours |
| Navbar + Sidebar + Footer | 4-6 hours |
| Landing: Hero + mockup | 6-8 hours |
| Landing: Features + How It Works | 4-5 hours |
| Landing: Testimonials + Stats + Pricing | 4-5 hours |
| Landing: FAQ + Footer | 2-3 hours |
| Dashboard home | 5-7 hours |
| Scholarships browse/match | 5-7 hours |
| Scholarship detail | 3-4 hours |
| Compare page | 3-4 hours |
| Roadmap | 4-5 hours |
| Documents | 4-5 hours |
| AI Review | 5-6 hours |
| Profile | 3-4 hours |
| Payments/Credits | 4-5 hours |
| Admin | 3-4 hours |
| Auth pages (login/signup/verify) | 3-4 hours |
| Onboarding wizard | 4-5 hours |
| Mobile responsive pass | 6-8 hours |
| Loading + empty states | 4-6 hours |
| Animation polish | 4-6 hours |
| Accessibility + QA | 4-6 hours |
| **TOTAL** | **~100-135 hours** |

---

## 12. Files That Will Need Modification

> **NOTE:** This is a reference list only. No files modified in this planning phase.

### Global / Config Files
```
tailwind.config.ts          — New color tokens, typography scale
src/app/globals.css         — New CSS variables, base styles
src/app/layout.tsx          — Font setup, providers, lang default
package.json                — Add framer-motion dependency
```

### Landing & Marketing Pages
```
src/app/page.tsx            — Complete rebuild (landing)
src/app/pricing/page.tsx    — Rebuild
src/app/success-stories/page.tsx — Rebuild
src/app/glossary/page.tsx   — Restyle
src/app/help/page.tsx       — Restyle
src/app/privacy/page.tsx    — Restyle
src/app/terms/page.tsx      — Restyle
```

### Auth Pages
```
src/app/auth/login/page.tsx    — Rebuild
src/app/auth/signup/page.tsx   — Rebuild
src/app/auth/verify/page.tsx   — Rebuild
src/app/onboarding/page.tsx    — Rebuild
src/app/profile/edit/page.tsx  — Rebuild
```

### Dashboard Pages
```
src/app/dashboard/page.tsx                       — Rebuild
src/app/dashboard/profile/page.tsx               — Rebuild
src/app/dashboard/documents/page.tsx             — Rebuild
src/app/dashboard/roadmap/page.tsx               — Rebuild
src/app/dashboard/credits/page.tsx               — Rebuild
src/app/dashboard/credits/manual/page.tsx        — Rebuild
src/app/dashboard/compare/page.tsx               — Rebuild
src/app/dashboard/reviews/[id]/page.tsx          — Rebuild
src/app/dashboard/applications/[scholarshipId]/page.tsx — Rebuild
src/app/scholarships/page.tsx                    — Rebuild
src/app/scholarships/[id]/page.tsx               — Rebuild
src/app/admin/payments/page.tsx                  — Rebuild
```

### Components (all listed in Section 9)
```
src/components/**/*.tsx     — Rebuild per inventory table
src/components/ui/*.tsx     — Rebuild per inventory table
```

### Language (see Section 13)
```
src/contexts/LanguageContext.tsx  — Change default to English
```

### What NOT to Touch
```
src/app/api/**/*            — All API routes (unchanged)
src/lib/ai-review.ts        — AI logic (unchanged)
src/lib/scholarship-matcher.ts — Matching logic (unchanged)
src/lib/roadmap-generator.ts — Roadmap logic (unchanged)
src/middleware.ts           — Auth guard (unchanged)
prisma/schema.prisma        — Database (unchanged)
src/lib/supabase/*          — Auth clients (unchanged)
src/lib/email*.ts           — Email (unchanged)
src/lib/prisma.ts           — DB client (unchanged)
```

---

## 13. English Language Changes

### Why the Site Currently Opens in Arabic

The `LanguageContext` (`src/contexts/LanguageContext.tsx`) initializes state with Arabic as the default:

```tsx
// Line 31 — current behavior
const [language, setLanguageState] = useState<Language>("ar");
```

The comment explains the original intent:
> "Arabic is the default — this is an Arabic-first product for Arab students."

On first visit (no saved preference in localStorage), every user sees Arabic with RTL layout. The `useEffect` on mount only restores a *previously saved* choice — it does not detect browser language or default to English.

Additionally, `src/app/layout.tsx` likely sets `lang="ar" dir="rtl"` on the initial server render (per AGENTS.md: "RTL: Arabic-first (default `lang="ar" dir="rtl"`)").

### Which Files Control This Behavior

| File | Role |
|------|------|
| `src/contexts/LanguageContext.tsx` | **Primary** — Sets default language state to `"ar"` (line 31) |
| `src/app/layout.tsx` | Sets initial `<html lang dir>` attributes on server render |
| `src/lib/i18n.ts` | Translation dictionary + `Language` type definition |

### Exactly What Will Change (Implementation Phase)

**1. `src/contexts/LanguageContext.tsx` (line 31)**
```tsx
// BEFORE
const [language, setLanguageState] = useState<Language>("ar");

// AFTER
const [language, setLanguageState] = useState<Language>("en");
```

The existing `useEffect` (lines 36-43) already correctly restores a saved preference from localStorage — so returning users who chose Arabic will keep it. Only the *first-visit default* changes to English.

**2. `src/app/layout.tsx`**
```tsx
// BEFORE
<html lang="ar" dir="rtl">

// AFTER
<html lang="en" dir="ltr">
```
This ensures the server-rendered HTML matches the new English default and avoids a hydration flash.

### Behavior After Change

| Scenario | Result |
|----------|--------|
| New visitor, first load | English (LTR) ✅ |
| Login / signup pages | English ✅ |
| Dashboard for new user | English ✅ |
| Refresh page | Stays English (no auto-switch) ✅ |
| User selects Arabic | Switches to Arabic, saved to localStorage ✅ |
| Returning user (chose Arabic) | Opens in Arabic ✅ |
| Returning user (chose English) | Opens in English ✅ |

### How to Revert (If Needed)

Simply change the two values back:
```tsx
// LanguageContext.tsx line 31
useState<Language>("ar")   // revert to Arabic default

// layout.tsx
<html lang="ar" dir="rtl">  // revert to Arabic server render
```

No other code depends on the default — the language switcher, translation function, and localStorage persistence all work identically regardless of which language is the default. **The change is fully reversible with a two-line edit.**

### Important Notes
- Do NOT add browser language auto-detection (the requirement is explicit: English always default)
- Do NOT auto-redirect to Arabic under any condition
- The `toggleLanguage` and `setLanguage` functions remain unchanged
- localStorage key stays `smartscholar.lang`
- All existing Arabic translations remain fully functional

---

## 14. Technical Implementation Notes

### Dependencies to Add
```json
{
  "framer-motion": "^11.x"  // Animation library
}
```

### Architecture Guidelines
- **Reusable components:** Every UI element is a shared component
- **No inline styles:** Use Tailwind classes exclusively
- **No duplicated code:** Extract patterns into components
- **Composition over repetition:** Build small, composable pieces
- **Keep APIs intact:** Never modify `src/app/api/**`
- **Preserve data contracts:** Components consume the same API shapes
- **Type safety:** Maintain strict TypeScript (zero `tsc` errors)

### Design Tokens Location
All design tokens (colors, spacing, radius, shadows) live in:
- `tailwind.config.ts` (Tailwind theme)
- `src/app/globals.css` (CSS variables)

### Testing Checklist (Per Screen)
- [ ] Renders correctly on 375px, 390px, 430px
- [ ] Renders correctly on tablet (768px)
- [ ] Renders correctly on desktop (1280px+)
- [ ] No horizontal overflow
- [ ] All interactive elements have hover states
- [ ] Loading state implemented
- [ ] Empty state implemented
- [ ] Error state handled
- [ ] Animations respect reduced-motion
- [ ] Keyboard navigable
- [ ] English default confirmed
- [ ] Arabic (RTL) still works
- [ ] API integration unchanged

---

## 15. Success Criteria

The rebuild is complete when:

1. ✅ Every page uses the new design system consistently
2. ✅ Landing page has a real dashboard preview (not placeholder cards)
3. ✅ Site opens in English by default for all new visitors
4. ✅ Arabic remains fully functional via switcher
5. ✅ All animations use Framer Motion smoothly
6. ✅ Perfect responsive behavior (375px → desktop)
7. ✅ Zero TypeScript errors (`npm run build` passes)
8. ✅ All backend APIs work exactly as before
9. ✅ Authentication, database, routing unchanged
10. ✅ A new visitor immediately thinks: *"This looks like a company that raised millions."*

---

*End of Masterplan. Ready for phased implementation, one screen at a time.*
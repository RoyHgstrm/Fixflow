# FixFlow Design Guidelines

## Overview

This document establishes the design principles, visual language, and UI/UX patterns for FixFlow - a professional SaaS platform for cleaning, maintenance, and repair businesses. These guidelines ensure consistency, accessibility, and scalability across all user interfaces.

---

## Design Philosophy

### Core Principles

1. **Professional First**: Clean, minimal, and trustworthy design that instills confidence in business users
2. **Dark Mode Focus**: Optimized for reduced eye strain during long work sessions
3. **Mobile-First Responsive**: Seamless experience across all devices and screen sizes
4. **Accessibility-Driven**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
5. **Performance-Oriented**: Fast loading times and smooth animations
6. **Role-Adaptive**: Interface adapts intelligently based on user permissions and role

---

## Visual Identity

### Color Palette

#### Primary Colors
- **Primary Blue**: `#3B82F6` - Main brand color, CTAs, active states
- **Primary Gradient**: `from-primary to-blue-600` - Hero sections, buttons
- **Secondary Purple**: `#8B5CF6` - Accents, special highlights

#### Semantic Colors
- **Success Green**: `#10B981` - Completed tasks, positive states
- **Warning Yellow**: `#F59E0B` - Pending items, caution states
- **Error Red**: `#EF4444` - Errors, destructive actions
- **Info Blue**: `#06B6D4` - Information, neutral highlights

#### Neutral Palette (Dark Mode)
- **Background**: `#0A0A0B` - Main app background
- **Surface**: `#111111` - Card backgrounds
- **Muted**: `#1A1A1A` - Secondary surfaces
- **Border**: `#2A2A2A` - Dividers, outlines
- **Text Primary**: `#FFFFFF` - Main text
- **Text Secondary**: `#A1A1AA` - Supporting text
- **Text Muted**: `#71717A` - Placeholders, labels

### Typography

#### Font Family
- **Primary**: Inter (System fallback: -apple-system, BlinkMacSystemFont)
- **Monospace**: JetBrains Mono (fallback: Consolas, Monaco)

#### Type Scale
```css
/* Headings */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; } /* H1 */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; } /* H2 */
.text-2xl { font-size: 1.5rem; line-height: 2rem; } /* H3 */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; } /* H4 */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; } /* H5 */

/* Body Text */
.text-base { font-size: 1rem; line-height: 1.5rem; } /* Body */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; } /* Small */
.text-xs { font-size: 0.75rem; line-height: 1rem; } /* Caption */
```

#### Font Weights
- **Light**: 300 - Rarely used, subtle text
- **Regular**: 400 - Body text, default
- **Medium**: 500 - Emphasis, labels
- **Semi-Bold**: 600 - Headings, important text
- **Bold**: 700 - Major headings, strong emphasis

---

## Spacing & Layout

### Spacing Scale
```css
/* Consistent spacing using 4px base unit */
.space-1 { 0.25rem } /* 4px */
.space-2 { 0.5rem }  /* 8px */
.space-3 { 0.75rem } /* 12px */
.space-4 { 1rem }    /* 16px */
.space-6 { 1.5rem }  /* 24px */
.space-8 { 2rem }    /* 32px */
.space-12 { 3rem }   /* 48px */
.space-16 { 4rem }   /* 64px */
.space-24 { 6rem }   /* 96px */
```

### Grid System
- **Container Max-Width**: 1400px
- **Breakpoints**: sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px)
- **Gutter**: 16px on mobile, 24px on tablet, 32px on desktop

---

## Component Patterns

### Glass Morphism Effect
```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Gradient Buttons
```css
.gradient-primary {
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
}

.gradient-secondary {
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
}
```

### Shadow System
```css
.shadow-glow {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

.shadow-glow-lg {
  box-shadow: 0 0 40px rgba(59, 130, 246, 0.4);
}
```

---

## Component Library

### Cards
- **Default**: Glass effect with subtle border
- **Interactive**: Hover effects with scale and glow
- **Status**: Color-coded borders based on state

### Buttons
- **Primary**: Gradient background with glow shadow
- **Secondary**: Outline style with glass background
- **Ghost**: Transparent with hover background
- **Destructive**: Red gradient for dangerous actions

### Forms
- **Inputs**: Glass background with focus ring
- **Labels**: Medium weight, appropriate contrast
- **Validation**: Inline errors with icons
- **Groups**: Logical spacing and visual hierarchy

### Navigation
- **Sidebar**: Collapsible with search functionality
- **Breadcrumbs**: Context-aware navigation path
- **Tabs**: Underlined active states

---

## Role-Based UI Patterns

### Admin Interface
- **Color Theme**: Primary blue with shield icons
- **Layout**: Full-width dashboards with comprehensive data
- **Navigation**: Complete access to all sections
- **Features**: User management, system analytics, global settings

### Technician Interface
- **Color Theme**: Green accents with wrench/tool icons
- **Layout**: Job-focused with mobile-optimized views
- **Navigation**: Streamlined for field work
- **Features**: Job assignments, status updates, schedule views

### Client Interface
- **Color Theme**: Blue accents with user icons
- **Layout**: Simplified with request-focused workflows
- **Navigation**: Limited to relevant client features
- **Features**: Service requests, status tracking, communication

---

## Animation Guidelines

### Motion Principles
- **Purposeful**: Every animation serves a functional purpose
- **Subtle**: Smooth, understated movements (300-500ms duration)
- **Responsive**: Adapts to user preferences (prefers-reduced-motion)
- **Consistent**: Unified easing curves and timing

### Animation Types
```css
/* Standard Easing */
.ease-custom { transition-timing-function: cubic-bezier(0.6, -0.05, 0.01, 0.99); }

/* Page Transitions */
.fade-in { opacity: 0 → 1; duration: 300ms; }
.slide-in { transform: translateY(20px) → 0; duration: 400ms; }

/* Hover Effects */
.scale-hover { transform: scale(1.02); duration: 200ms; }
.glow-hover { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
```

---

## Responsive Design

### Mobile-First Approach
1. **Base Design**: Mobile (320px+)
2. **Progressive Enhancement**: Tablet (768px+), Desktop (1024px+)
3. **Touch Targets**: Minimum 44px for interactive elements
4. **Content Priority**: Most important content visible first

### Breakpoint Strategy
- **Mobile**: Single column, collapsible navigation, touch-optimized
- **Tablet**: Hybrid layouts, side navigation, optimized for both orientations
- **Desktop**: Multi-column grids, persistent navigation, hover states

---

## Accessibility Standards

### Color & Contrast
- **Text Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus Indicators**: Visible focus rings on all interactive elements
- **Color Independence**: Never rely solely on color to convey information

### Keyboard Navigation
- **Tab Order**: Logical sequence through interface
- **Skip Links**: Direct access to main content
- **Keyboard Shortcuts**: Power user functionality

### Screen Readers
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **ARIA Labels**: Descriptive labels for complex interactions
- **Status Updates**: Live regions for dynamic content

---

## Performance Guidelines

### Loading States
- **Skeleton Screens**: For content that takes time to load
- **Progressive Loading**: Show basic layout first, enhance progressively
- **Optimistic Updates**: Update UI immediately, sync with server

### Image Optimization
- **Next.js Image**: Use Next.js Image component for automatic optimization
- **Lazy Loading**: Images load as they enter viewport
- **WebP Support**: Modern format with fallbacks

---

## Data Visualization

### Charts & Graphs
- **Color Palette**: Use semantic colors for status representation
- **Accessibility**: Patterns and labels in addition to colors
- **Responsiveness**: Mobile-optimized chart layouts

### Tables
- **Zebra Striping**: Subtle row alternation for readability
- **Sorting Indicators**: Clear visual feedback for column sorting
- **Mobile Strategy**: Card-based layout on small screens

---

## Error Handling

### Error States
- **Validation Errors**: Inline with clear messaging
- **Network Errors**: Global notification with retry options
- **Empty States**: Helpful illustrations with actionable guidance

### Success Feedback
- **Toast Notifications**: Non-intrusive confirmation messages
- **Visual Indicators**: Color changes and icons for success states
- **Progress Feedback**: Clear indication of ongoing processes

---

## Implementation Notes

### CSS Variables
Use CSS custom properties for theme consistency:
```css
:root {
  --color-primary: 59 130 246;
  --color-background: 10 10 11;
  --radius-base: 0.5rem;
  --shadow-glow: 0 0 20px rgb(var(--color-primary) / 0.3);
}
```

### Component Composition
- **Atomic Design**: Build from atoms → molecules → organisms → templates
- **Compound Components**: Related components that work together
- **Render Props**: Flexible component composition patterns

### Testing Strategy
- **Visual Regression**: Screenshot testing for UI consistency
- **Accessibility Testing**: Automated a11y checks in CI/CD
- **Cross-Browser**: Testing across major browsers and devices

---

## Maintenance & Evolution

### Design Tokens
- **Centralized Values**: All design decisions in token files
- **Tooling Integration**: Sync between design tools and code
- **Version Control**: Track design system changes over time

### Documentation
- **Component Storybook**: Interactive component documentation
- **Usage Guidelines**: When and how to use each component
- **Migration Guides**: Help for updating to new patterns

### Review Process
- **Design Reviews**: Regular evaluation of design decisions
- **User Testing**: Validation with actual users
- **Performance Audits**: Regular checks for speed and accessibility

---

*Last Updated: January 2025*
*Version: 1.0* 
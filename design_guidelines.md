# Social Media Graphics Automation Tool - Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from modern design tools like Canva and Figma, with productivity-focused patterns from Notion and Linear. This utility-focused application prioritizes efficiency and learnability for social media managers.

## Core Design Elements

### Color Palette
**Light Mode:**
- Primary: 264 100% 50% (vibrant purple for creative energy)
- Secondary: 220 15% 25% (dark slate for text)
- Background: 0 0% 98% (soft white)
- Surface: 0 0% 100% (pure white cards)
- Accent: 142 76% 50% (success green, used sparingly)

**Dark Mode:**
- Primary: 264 100% 60% (lighter purple for contrast)
- Secondary: 210 40% 85% (light gray text)
- Background: 222 20% 12% (deep dark blue)
- Surface: 220 15% 16% (elevated dark cards)
- Accent: 142 76% 60% (success green)

### Typography
- **Primary Font**: Inter (Google Fonts) - excellent readability for interfaces
- **Display Font**: Plus Jakarta Sans (Google Fonts) - friendly, modern for headings
- **Hierarchy**: h1 (32px), h2 (24px), h3 (20px), body (16px), small (14px)

### Layout System
**Tailwind Spacing**: Use units of 2, 4, 6, 8, 12, 16 for consistent rhythm
- Base padding: p-4, p-6, p-8
- Component margins: m-2, m-4, m-8
- Heights: h-8, h-12, h-16 for consistent component sizing

### Component Library

**Navigation:**
- Clean sidebar with icon + text labels
- Top header with search and user profile
- Breadcrumb navigation for deep workflows

**Content Creation:**
- Canvas area with drag-drop interface
- Tool palette with categorized options
- Property panel for selected elements
- Template gallery with preview cards

**Data Management:**
- Table views with sorting/filtering
- Card layouts for visual content
- Upload areas with drag-drop zones
- Progress indicators for processing

**Privacy Controls:**
- Toggle switches for privacy settings
- Clear data usage indicators
- Consent management modal
- Export/delete data options

**Forms:**
- Floating labels for inputs
- Clear validation states
- Multi-step wizards for complex flows
- Auto-save indicators

### Visual Hierarchy
- Use 4-6 shades of gray for text hierarchy
- Bold typography for primary actions
- Subtle shadows for card elevation
- Strategic use of the accent color for success states only

### Interactions
- Hover states with subtle scale (102%) and shadow changes
- Loading states with skeleton screens
- Smooth transitions (200-300ms ease-out)
- Clear focus indicators for accessibility

## Images
**Hero Section**: Medium-sized hero (60vh) showcasing the graphic creation interface with a blurred background featuring sample social media posts. Place a primary CTA button with variant="outline" and blurred background overlay.

**Feature Sections**: Screenshots of the interface, template gallery, and brand kit management. Use actual interface mockups rather than abstract illustrations.

**Template Gallery**: Preview thumbnails of social media templates organized by platform and category.

This design prioritizes usability and efficiency while maintaining visual appeal appropriate for creative professionals.
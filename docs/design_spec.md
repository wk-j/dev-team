# Design Specification: Dev Team Task Tracker

## Visual Design Strategy
The application will feature a **Premium Dark Mode** aesthetic, utilizing deep slate backgrounds with vibrant neon accents to create a modern, high-tech feel suitable for a development tool.

### Key Principles
- **Glassmorphism**: Use translucent backgrounds with blur effects for cards and overlays to establish depth.
- **Vibrant Accents**: Electric blue and purple gradients to highlight actions and active states.
- **Clean Typography**: Sans-serif fonts (Inter) for maximum readability.
- **Spacious Layout**: Generous padding and margins to prevent clutter.

## Color Palette
- **Background**: `#0f172a` (Slate 900) to `#1e293b` (Slate 800)
- **Primary Accent**: Gradient from `#6366f1` (Indigo 500) to `#8b5cf6` (Violet 500)
- **Text**: `#f8fafc` (Slate 50) for headings, `#94a3b8` (Slate 400) for secondary text.
- **Status Colors**:
  - *Todo*: `#64748b` (Slate 500)
  - *In Progress*: `#3b82f6` (Blue 500)
  - *Review*: `#eab308` (Yellow 500)
  - *Done*: `#22c55e` (Green 500)

## Dashboard Mockup
Below is the high-fidelity concept for the main dashboard view.

![Dashboard Mockup](assets/dashboard_mockup.png)

### Layout Structure
1.  **Sidebar**: Navigation (Dashboard, Tasks, Team, Settings).
2.  **Top Bar**: Global search, notifications, user profile.
3.  **Main Content**:
    - **Stats Row**: Quick metrics (Velocity, Active Tasks).
    - **Kanban Board**: The core workspace for tracking tasks.

## Interaction Design
- **Hover Effects**: Cards lift slightly and glow on hover.
- **Transitions**: Smooth fade-ins for page loads and modal appearances.
- **Drag & Drop**: Fluid movement for Kanban cards (using `dnd-kit` or similar).

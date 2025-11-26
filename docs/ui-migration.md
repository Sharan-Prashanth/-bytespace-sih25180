# UI Migration Guide

This guide details the changes made to the Admin Dashboard and provides instructions for applying the refactor.

## Overview
The Admin Dashboard has been refactored to use a modern, component-based architecture with a light theme, sidebar navigation, and interactive charts.

## Dependencies
You need to install the following packages for the new UI to work correctly:

```bash
npm install chart.js react-chartjs-2 react-beautiful-dnd lucide-react
```

## New Components
The following components have been added to `client/src/components/Dashboard/`:

- **Layout/DashboardLayout.jsx**: Main wrapper with responsive sidebar and header.
- **Sidebar/Sidebar.jsx**: Draggable, collapsible sidebar with local storage persistence.
- **Stats/StatCard.jsx**: Modern stat card with sparklines and trend indicators.
- **Stats/AnimatedCounter.jsx**: Reusable counter animation.
- **Charts/**: `DonutChart.jsx`, `BarChart.jsx`, `Sparkline.jsx` wrappers for Chart.js.
- **Tables/CardRow.jsx**: Card view component for tables.

## Changes to `dashboard-admin.jsx`
The `AdminDashboard` component has been completely rewritten to use the new components.
- Logic for fetching data, filtering, and calculating stats has been **preserved exactly**.
- The layout structure has been replaced with `DashboardLayout`.
- Hardcoded stats HTML has been replaced with `StatCard` components.
- Tables now support a "Card View" toggle using `CardRow`.

## Tailwind Configuration
Ensure your `tailwind.config.js` includes the following colors (if not already present, the code uses standard Tailwind colors + custom hex codes where needed):

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#FF7A59',
        accent: {
          1: '#6C5CE7',
          2: '#03C4A1',
          3: '#FF4DA6',
        }
      }
    }
  }
}
```
*Note: The components use standard Tailwind classes like `bg-orange-500`, `text-blue-600`, etc., so strict config changes are optional but recommended for consistency.*

## Verification
1. **Build**: Run `npm run build` to ensure no import errors.
2. **Runtime**: Navigate to `/admin` (or the dashboard route).
3. **Sidebar**: Test expanding/collapsing and dragging items. Refresh to check persistence.
4. **Charts**: Verify charts load and animate.
5. **Tables**: Toggle between List and Card views. Test filters.

## Troubleshooting
- **Hydration Errors**: If you see hydration errors related to the Sidebar, ensure `react-beautiful-dnd` is only rendered on the client (the code already handles this with `isClient` check).
- **Chart Errors**: If charts don't appear, ensure `chart.js` is installed and registered (the code registers components).

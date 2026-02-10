import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  // Public routes (no auth required)
  layout('components/layout/public-layout.tsx', [
    index('routes/landing.tsx'),
    route('rules', 'routes/rules.tsx'),
    route('contact', 'routes/contact.tsx'),
    route('login', 'routes/login.tsx'),
  ]),

  // Authenticated routes (requires login)
  layout('components/layout/auth-layout.tsx', [
    route('dashboard', 'routes/dashboard.tsx'),
    route('players', 'routes/players-table.tsx'),
    route('players/:id', 'routes/player.tsx'),
    route('divisions', 'routes/divisions.tsx'),
    route('divisions/:id', 'routes/division.tsx'),
    route('matches', 'routes/matches-table.tsx'),
    route('standings', 'routes/standings.tsx'),
    route('profile', 'routes/profile.tsx'),
  ]),
] satisfies RouteConfig;

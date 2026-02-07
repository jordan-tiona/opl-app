import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/dashboard.tsx'),
  route('players', 'routes/players-table.tsx'),
  route('players/:id', 'routes/player.tsx'),
  route('divisions', 'routes/divisions.tsx'),
  route('divisions/:id', 'routes/division.tsx'),
  route('matches', 'routes/matches-table.tsx'),
  route('standings', 'routes/standings.tsx'),
] satisfies RouteConfig;

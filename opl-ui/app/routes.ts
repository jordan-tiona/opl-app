import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/dashboard.tsx'),
  route('players', 'routes/players-table.tsx'),
  route('players/:id', 'routes/player.tsx'),
  route('matches', 'routes/matches-table.tsx'),
  route('standings', 'routes/standings.tsx'),
] satisfies RouteConfig;

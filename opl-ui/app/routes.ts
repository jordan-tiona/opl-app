import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  route('players', 'routes/players.tsx'),
  route('players/:id', 'routes/players.$id.tsx'),
  route('matches', 'routes/matches.tsx'),
  route('matches/:id', 'routes/matches.$id.tsx'),
  route('standings', 'routes/standings.tsx'),
] satisfies RouteConfig;

import { type RouteConfig, index, layout, route } from '@react-router/dev/routes'

export default [
    // Public routes (no auth required)
    layout('components/layout/public-layout.tsx', [
        index('routes/public/landing.tsx'),
        route('about', 'routes/public/about.tsx'),
        route('join', 'routes/public/join.tsx'),
        route('login', 'routes/public/login.tsx'),
    ]),

    // Standalone routes (no layout chrome)
    route('matches/print', 'routes/matches/print.tsx'),

    // Authenticated routes (requires login)
    layout('components/layout/auth-layout.tsx', [
        route('dashboard', 'routes/user/dashboard.tsx'),
        route('players', 'routes/players/list.tsx'),
        route('players/:id', 'routes/players/detail.tsx'),
        route('divisions', 'routes/divisions/list.tsx'),
        route('divisions/:id', 'routes/divisions/detail.tsx'),
        route('sessions', 'routes/sessions/list.tsx'),
        route('sessions/:id', 'routes/sessions/detail.tsx'),
        route('matches', 'routes/matches/list.tsx'),
        route('messages', 'routes/messages/list.tsx'),
        route('standings', 'routes/divisions/standings.tsx'),
        route('contact', 'routes/public/contact.tsx'),
        route('profile', 'routes/user/profile.tsx'),
    ]),
] satisfies RouteConfig

import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://epordyoctdahwhkmumgj.supabase.co';

export const handlers = [
  // Mock Supabase auth endpoints
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        role: 'authenticated'
      }
    });
  }),

  http.post(`${SUPABASE_URL}/auth/v1/signup`, () => {
    return HttpResponse.json({
      id: 'new-user-id',
      email: 'new@example.com',
      role: 'authenticated'
    });
  }),

  http.post(`${SUPABASE_URL}/auth/v1/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Mock profiles endpoint
  http.get(`${SUPABASE_URL}/rest/v1/profiles`, ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');
    
    return HttpResponse.json([{
      id: userId || 'mock-user-id',
      username: 'testuser',
      email: 'test@example.com',
      role: 'free',
      sports: ['aerial-hoop'],
      avatar_url: null,
      bio: null,
      created_at: new Date().toISOString()
    }]);
  }),

  // Mock challenges endpoint
  http.get(`${SUPABASE_URL}/rest/v1/challenges`, () => {
    return HttpResponse.json([
      {
        id: 'challenge-1',
        title: 'Wyzwanie 30 dni',
        description: 'Opis wyzwania testowego',
        type: 'daily',
        status: 'published',
        premium: false,
        difficulty_level: 'beginner',
        created_at: new Date().toISOString()
      },
      {
        id: 'challenge-2',
        title: 'Wyzwanie Premium',
        description: 'Wyzwanie premium',
        type: 'daily',
        status: 'published',
        premium: true,
        difficulty_level: 'intermediate',
        created_at: new Date().toISOString()
      }
    ]);
  }),

  // Mock sport categories endpoint
  http.get(`${SUPABASE_URL}/rest/v1/sport_categories`, () => {
    return HttpResponse.json([
      {
        id: 'sport-1',
        name: 'Aerial Hoop',
        key_name: 'aerial-hoop',
        description: 'Figury na kole',
        price_pln: 9900,
        price_usd: 2500,
        is_published: true,
        free_levels_count: 2,
        icon: 'circle'
      },
      {
        id: 'sport-2',
        name: 'Pole Dance',
        key_name: 'pole-dance',
        description: 'Figury na rurze',
        price_pln: 9900,
        price_usd: 2500,
        is_published: true,
        free_levels_count: 2,
        icon: 'cylinder'
      }
    ]);
  }),

  // Mock sport levels endpoint
  http.get(`${SUPABASE_URL}/rest/v1/sport_levels`, () => {
    return HttpResponse.json([
      {
        id: 'level-1',
        level_number: 1,
        level_name: 'Poziom 1 - Podstawy',
        sport_category: 'aerial-hoop',
        status: 'published',
        is_demo: true,
        point_limit: 100
      },
      {
        id: 'level-2',
        level_number: 2,
        level_name: 'Poziom 2 - Rozgrzewka',
        sport_category: 'aerial-hoop',
        status: 'published',
        is_demo: true,
        point_limit: 200
      },
      {
        id: 'level-3',
        level_number: 3,
        level_name: 'Poziom 3 - Figury',
        sport_category: 'aerial-hoop',
        status: 'published',
        is_demo: false,
        point_limit: 300
      }
    ]);
  }),

  // Mock figures endpoint
  http.get(`${SUPABASE_URL}/rest/v1/figures`, () => {
    return HttpResponse.json([
      {
        id: 'figure-1',
        name: 'Siedząca pozycja',
        description: 'Podstawowa pozycja siedząca',
        difficulty_level: 'beginner',
        type: 'static',
        premium: false,
        video_url: null,
        image_url: null
      }
    ]);
  }),

  // Mock training sessions endpoint
  http.get(`${SUPABASE_URL}/rest/v1/training_sessions`, () => {
    return HttpResponse.json([
      {
        id: 'session-1',
        title: 'Trening poranny',
        description: 'Rozgrzewka i podstawy',
        duration_minutes: 30,
        difficulty_level: 'beginner',
        premium: false,
        published: true
      }
    ]);
  }),

  // Mock RPC endpoints
  http.post(`${SUPABASE_URL}/rest/v1/rpc/update_user_login_tracking`, () => {
    return HttpResponse.json({ success: true });
  }),
];

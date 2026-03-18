// Auth helper functions — replaces @/utils/supabase/client and server
// Uses Auth.js v5 session management

export type { Session } from 'next-auth';

// Re-export auth for server components / API routes
export { auth } from '@/auth';

// Re-export signIn/signOut for client use (via server actions or direct call)
export { signIn, signOut } from '@/auth';

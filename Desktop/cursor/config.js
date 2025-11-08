// Supabase Configuration
// Replace these with your Supabase project credentials
// Get them from: https://app.supabase.com -> Project Settings -> API

const SUPABASE_URL = 'https://uycbpzuqasdrvgzaxlif.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Y2JwenVxYXNkcnZnemF4bGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDg5MTIsImV4cCI6MjA3ODE4NDkxMn0.__tmuJPCbiRUzGfzOFzdSzIUD8mee78WHjicTYG7USE';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


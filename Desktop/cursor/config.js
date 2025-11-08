// Supabase Configuration
// Replace these with your Supabase project credentials
// Get them from: https://app.supabase.com -> Project Settings -> API

const SUPABASE_URL = 'https://uycbpzuqasdrvgzaxlif.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Y2JwenVxYXNkcnZnemF4bGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDg5MTIsImV4cCI6MjA3ODE4NDkxMn0.__tmuJPCbiRUzGfzOFzdSzIUD8mee78WHjicTYG7USE';

// Initialize Supabase client
// The Supabase CDN script (@supabase/supabase-js@2) from jsdelivr exposes it as a global
// We need to wait for the script to load before initializing
let supabase;

// Function to initialize Supabase once the library is loaded
function initSupabase() {
    try {
        // The jsdelivr CDN for @supabase/supabase-js@2 exposes it as window.supabase
        // Check if the library is available
        if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
            // Initialize our client using the library
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase initialized successfully');
            return true;
        } else {
            // Library not loaded yet
            return false;
        }
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
        return false;
    }
}

// Try to initialize immediately (script might already be loaded)
if (!initSupabase()) {
    // If not loaded yet, wait for it
    let retries = 0;
    const maxRetries = 10;
    const checkInterval = setInterval(() => {
        retries++;
        if (initSupabase() || retries >= maxRetries) {
            clearInterval(checkInterval);
            if (retries >= maxRetries && !supabase) {
                console.error('❌ Failed to initialize Supabase after multiple attempts. Make sure the CDN script is loaded.');
            }
        }
    }, 100);
}


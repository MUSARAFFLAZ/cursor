// Global variables
let currentUser = null;
let editingNoteId = null;
let allNotes = [];

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Check for email verification token in URL
    await handleEmailVerification();
    await checkAuthStatus();
    setupEventListeners();
});

// Handle email verification from URL
async function handleEmailVerification() {
    if (!supabase) {
        // Wait for Supabase to initialize
        let retries = 0;
        while (!supabase && retries < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }
    }

    if (!supabase) return;

    try {
        // Check URL parameters for email verification
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const type = urlParams.get('type');
        const tokenHash = urlParams.get('token_hash');
        
        // Check URL hash for access token (Supabase redirects here)
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        // Handle error in URL
        if (error) {
            console.error('Auth error from URL:', error, errorDescription);
            alert(`Authentication error: ${errorDescription || error}`);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }

        // Handle hash-based verification (most common for Supabase email verification)
        if (accessToken && refreshToken) {
            // Set the session from the tokens in the URL
            const { data, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            });

            if (sessionError) {
                console.error('Session error:', sessionError);
                alert('Email verification failed. Please try again.');
            } else if (data && data.user) {
                // Email verified successfully
                currentUser = data.user;
                updateUIForLoggedInUser();
                await loadNotes();
                alert('✅ Email verified successfully! You are now logged in.');
                
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
        // Handle token-based verification (alternative method)
        else if (token && type === 'email') {
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
                token_hash: token,
                type: 'email'
            });

            if (verifyError) {
                console.error('Email verification error:', verifyError);
                alert('Email verification failed. Please try again or request a new verification link.');
            } else if (data && data.user) {
                currentUser = data.user;
                updateUIForLoggedInUser();
                await loadNotes();
                alert('✅ Email verified successfully! You are now logged in.');
                
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
        // Handle token_hash parameter (another method)
        else if (tokenHash) {
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: 'email'
            });

            if (verifyError) {
                console.error('Email verification error:', verifyError);
                alert('Email verification failed. Please try again.');
            } else if (data && data.user) {
                currentUser = data.user;
                updateUIForLoggedInUser();
                await loadNotes();
                alert('✅ Email verified successfully! You are now logged in.');
                
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    } catch (error) {
        console.error('Error handling email verification:', error);
        alert('An error occurred during email verification. Please try again.');
    }
}

// Check authentication status on page load
async function checkAuthStatus() {
    try {
        // Wait a bit for Supabase to initialize if needed
        let retries = 0;
        while (!supabase && retries < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }

        if (!supabase) {
            console.error('Supabase client not initialized. Check config.js');
            return;
        }

        // Get session from localStorage (Supabase stores it automatically)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Auth session error:', error);
            // Clear any invalid session
            await supabase.auth.signOut();
            updateUIForLoggedOutUser();
            return;
        }

        if (session && session.user) {
            currentUser = session.user;
            console.log('✅ User session found:', currentUser.email);
            updateUIForLoggedInUser();
            await loadNotes();
        } else {
            console.log('ℹ️ No active session found');
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        showError('note-error', 'Failed to check authentication status');
        updateUIForLoggedOutUser();
    }
}

// Listen for auth state changes
// This ensures the UI updates when auth state changes (login, logout, token refresh)
function setupAuthListener() {
    if (supabase) {
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session?.user?.email || 'no user');
            
            if (event === 'SIGNED_IN' && session && session.user) {
                currentUser = session.user;
                console.log('✅ User signed in:', currentUser.email);
                updateUIForLoggedInUser();
                loadNotes();
            } else if (event === 'SIGNED_OUT' || !session) {
                currentUser = null;
                console.log('ℹ️ User signed out');
                updateUIForLoggedOutUser();
                allNotes = [];
                const notesContainer = document.getElementById('notes-container');
                if (notesContainer) {
                    notesContainer.innerHTML = '';
                }
            } else if (event === 'TOKEN_REFRESHED' && session) {
                // Session refreshed, update current user
                if (session.user) {
                    currentUser = session.user;
                    console.log('🔄 Session refreshed');
                }
            }
        });
    } else {
        // Retry setting up listener if Supabase isn't ready yet
        setTimeout(setupAuthListener, 100);
    }
}

// Setup auth listener when Supabase is ready
setupAuthListener();

// Update UI for logged in user
function updateUIForLoggedInUser() {
    document.getElementById('auth-buttons').style.display = 'none';
    document.getElementById('user-info').style.display = 'flex';
    document.getElementById('notes-link').style.display = 'block';
    document.getElementById('notes').style.display = 'block';
    document.getElementById('user-email').textContent = currentUser.email;
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
    document.getElementById('auth-buttons').style.display = 'flex';
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('notes-link').style.display = 'none';
    document.getElementById('notes').style.display = 'none';
    closeModal('note-modal');
}

// Setup event listeners
function setupEventListeners() {
    // Close modal when clicking outside
    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    };

    // Close modal on ESC key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal('login-modal');
            closeModal('signup-modal');
            closeModal('note-modal');
        }
    });
}

// ============ AUTHENTICATION FUNCTIONS ============

// Show login modal
function showLoginModal() {
    document.getElementById('login-modal').style.display = 'block';
    document.getElementById('login-error').textContent = '';
    document.getElementById('login-form').reset();
}

// Show signup modal
function showSignupModal() {
    document.getElementById('signup-modal').style.display = 'block';
    document.getElementById('signup-error').textContent = '';
    document.getElementById('signup-form').reset();
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    if (modalId === 'note-modal') {
        editingNoteId = null;
        document.getElementById('note-form').reset();
        document.getElementById('note-modal-title').textContent = 'Add New Note';
        document.getElementById('note-error').textContent = '';
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    if (!supabase) {
        alert('Supabase client not initialized. Please check your configuration.');
        return;
    }

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        errorDiv.textContent = '';
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        currentUser = data.user;
        closeModal('login-modal');
        updateUIForLoggedInUser();
        await loadNotes();
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = error.message || 'Failed to login. Please check your credentials.';
    }
}

// Handle signup
async function handleSignup(event) {
    event.preventDefault();
    
    if (!supabase) {
        alert('Supabase client not initialized. Please check your configuration.');
        return;
    }

    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const errorDiv = document.getElementById('signup-error');

    try {
        errorDiv.textContent = '';
        
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        // Get the current page URL for redirect after email verification
        const redirectUrl = window.location.origin + window.location.pathname;
        
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: redirectUrl
            }
        });

        if (error) throw error;

        // Check if email confirmation is required
        if (data.user && !data.session) {
            // Email confirmation required
            errorDiv.textContent = 'Account created! Please check your email to verify your account before logging in.';
            errorDiv.style.color = 'orange';
            return;
        }

        // If session exists, user is automatically logged in
        if (data.session && data.user) {
            currentUser = data.user;
            errorDiv.textContent = 'Account created successfully! You are now logged in.';
            errorDiv.style.color = 'green';
            
            setTimeout(() => {
                closeModal('signup-modal');
                updateUIForLoggedInUser();
                loadNotes();
            }, 1500);
        } else {
            // Try to sign in automatically (if email confirmation is disabled)
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (!loginError && loginData.user) {
                currentUser = loginData.user;
                errorDiv.textContent = 'Account created and logged in successfully!';
                errorDiv.style.color = 'green';
                
                setTimeout(() => {
                    closeModal('signup-modal');
                    updateUIForLoggedInUser();
                    loadNotes();
                }, 1500);
            } else {
                errorDiv.textContent = 'Account created! Please check your email to verify your account.';
                errorDiv.style.color = 'orange';
            }
        }
    } catch (error) {
        console.error('Signup error:', error);
        errorDiv.textContent = error.message || 'Failed to create account. Please try again.';
        errorDiv.style.color = 'red';
    }
}

// Handle logout
async function handleLogout() {
    if (!supabase) {
        alert('Supabase client not initialized. Please check your configuration.');
        return;
    }

    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        allNotes = [];
        updateUIForLoggedOutUser();
    } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout. Please try again.');
    }
}

// ============ NOTES CRUD FUNCTIONS ============

// Load all notes for current user
async function loadNotes() {
    if (!currentUser) return;
    
    if (!supabase) {
        console.error('Supabase client not initialized');
        return;
    }

    try {
        // RLS policies automatically filter by user_id, but we keep the filter for extra security
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            throw error;
        }

        allNotes = data || [];
        displayNotes(allNotes);
    } catch (error) {
        console.error('Error loading notes:', error);
        // Show more specific error messages
        let errorMessage = 'Failed to load notes. ';
        if (error.message) {
            if (error.message.includes('permission denied') || error.message.includes('RLS')) {
                errorMessage += 'Permission denied. Please check your database policies.';
            } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
                errorMessage += 'Notes table not found. Please create the table in Supabase.';
            } else {
                errorMessage += error.message;
            }
        } else {
            errorMessage += 'Please refresh the page.';
        }
        showError('note-error', errorMessage);
    }
}

// Display notes in the grid
function displayNotes(notes) {
    const container = document.getElementById('notes-container');
    const emptyState = document.getElementById('empty-state');

    if (notes.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    container.innerHTML = notes.map(note => `
        <div class="note-card" data-note-id="${note.id}">
            <div class="note-header">
                <h3 class="note-title">${escapeHtml(note.title)}</h3>
                <div class="note-actions">
                    <button class="icon-btn edit-btn" onclick="editNote('${note.id}')" title="Edit">
                        ✏️
                    </button>
                    <button class="icon-btn delete-btn" onclick="deleteNote('${note.id}')" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="note-content">${escapeHtml(note.content).replace(/\n/g, '<br>')}</div>
            <div class="note-footer">
                <small class="note-date">${formatDate(note.created_at)}</small>
                ${note.updated_at !== note.created_at ? `<small class="note-updated">Updated: ${formatDate(note.updated_at)}</small>` : ''}
            </div>
        </div>
    `).join('');
}

// Show note modal
function showNoteModal() {
    if (!currentUser) {
        alert('Please login to create notes');
        showLoginModal();
        return;
    }
    editingNoteId = null;
    document.getElementById('note-modal-title').textContent = 'Add New Note';
    document.getElementById('note-form').reset();
    document.getElementById('note-error').textContent = '';
    document.getElementById('note-modal').style.display = 'block';
}

// Edit note
async function editNote(noteId) {
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return;

    editingNoteId = noteId;
    document.getElementById('note-modal-title').textContent = 'Edit Note';
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content').value = note.content;
    document.getElementById('note-error').textContent = '';
    document.getElementById('note-modal').style.display = 'block';
}

// Save note (Create or Update)
async function saveNote(event) {
    event.preventDefault();
    if (!currentUser) return;
    
    if (!supabase) {
        alert('Supabase client not initialized. Please check your configuration.');
        return;
    }

    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    const errorDiv = document.getElementById('note-error');

    if (!title || !content) {
        errorDiv.textContent = 'Please fill in both title and content';
        return;
    }

    try {
        errorDiv.textContent = '';

        if (editingNoteId) {
            // Update existing note
            // Note: updated_at is automatically updated by database trigger
            const { data, error } = await supabase
                .from('notes')
                .update({
                    title: title,
                    content: content
                })
                .eq('id', editingNoteId)
                .eq('user_id', currentUser.id)
                .select();

            if (error) {
                console.error('Update error:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('Note not found or you do not have permission to update it.');
            }

            // Update local array
            const index = allNotes.findIndex(n => n.id === editingNoteId);
            if (index !== -1) {
                allNotes[index] = data[0];
            }
        } else {
            // Create new note
            const { data, error } = await supabase
                .from('notes')
                .insert({
                    user_id: currentUser.id,
                    title: title,
                    content: content
                })
                .select();

            if (error) {
                console.error('Insert error:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('Failed to create note. Please try again.');
            }

            allNotes.unshift(data[0]);
        }

        closeModal('note-modal');
        displayNotes(allNotes);
    } catch (error) {
        console.error('Error saving note:', error);
        let errorMessage = 'Failed to save note. ';
        if (error.message) {
            if (error.message.includes('permission denied') || error.message.includes('RLS')) {
                errorMessage += 'Permission denied. Please check your database policies.';
            } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
                errorMessage += 'Notes table not found. Please create the table in Supabase.';
            } else {
                errorMessage += error.message;
            }
        } else {
            errorMessage += 'Please try again.';
        }
        errorDiv.textContent = errorMessage;
    }
}

// Delete note
async function deleteNote(noteId) {
    if (!currentUser) return;
    
    if (!supabase) {
        alert('Supabase client not initialized. Please check your configuration.');
        return;
    }

    if (!confirm('Are you sure you want to delete this note?')) {
        return;
    }

    try {
        const { error, data } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId)
            .eq('user_id', currentUser.id)
            .select();

        if (error) {
            console.error('Delete error:', error);
            throw error;
        }

        // Remove from local array
        allNotes = allNotes.filter(n => n.id !== noteId);
        displayNotes(allNotes);
    } catch (error) {
        console.error('Error deleting note:', error);
        let errorMessage = 'Failed to delete note. ';
        if (error.message) {
            if (error.message.includes('permission denied') || error.message.includes('RLS')) {
                errorMessage = 'Permission denied. You may not have permission to delete this note.';
            } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
                errorMessage = 'Notes table not found. Please create the table in Supabase.';
            } else {
                errorMessage += error.message;
            }
        } else {
            errorMessage += 'Please try again.';
        }
        alert(errorMessage);
    }
}

// Filter notes by search query
function filterNotes() {
    const searchQuery = document.getElementById('search-notes').value.toLowerCase().trim();
    
    if (!searchQuery) {
        displayNotes(allNotes);
        return;
    }

    const filteredNotes = allNotes.filter(note => 
        note.title.toLowerCase().includes(searchQuery) ||
        note.content.toLowerCase().includes(searchQuery)
    );

    displayNotes(filteredNotes);
}

// ============ UTILITY FUNCTIONS ============

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show error message
function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.color = 'red';
    }
}

// ============ ORIGINAL WEBSITE FUNCTIONALITY ============

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form submission handler
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Thank you for your message! We will get back to you soon.');
        this.reset();
    });
}

// CTA button handler
const ctaButton = document.querySelector('.cta-button');
if (ctaButton) {
    ctaButton.addEventListener('click', function() {
        document.querySelector('#contact').scrollIntoView({
            behavior: 'smooth'
        });
    });
}

// Add scroll animation
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe service cards
document.querySelectorAll('.service-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

# Modern Website with Notes App

A beautiful, modern website with authentication and notes management built with HTML, CSS, JavaScript, and Supabase.

## Features

- 🎨 Modern, clean UI inspired by Halo Lab design
- 🔐 User authentication (Login/Signup/Logout) with Supabase
- 📝 Personal notes management with full CRUD operations
- 🔍 Search functionality for notes
- 📱 Fully responsive design
- ✨ Smooth animations and transitions
- 🚀 Fast and lightweight

## Getting Started

### Prerequisites

- A Supabase account (free at [supabase.com](https://supabase.com))
- A modern web browser

### Setup Instructions

#### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Wait for the project to be set up (takes a few minutes)

#### 2. Understanding Supabase Auth (Important!)

**You don't need to create a users table!** Supabase Auth automatically manages user authentication data in a system table called `auth.users`. This table:

- Is automatically created when you set up your Supabase project
- Stores user email, password (hashed), and authentication data
- Is managed by Supabase and not visible in the Table Editor
- Can be viewed in the **Authentication** section of your Supabase dashboard
- Is referenced by the `notes` table via `user_id UUID REFERENCES auth.users(id)`

**To view your users:**
1. Go to your Supabase dashboard
2. Click on **Authentication** in the left sidebar
3. Click on **Users** to see all registered users

#### 3. Create the Notes Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Run the following SQL to create the `notes` table:

```sql
-- Create notes table
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own notes
CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own notes
CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own notes
CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own notes
CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 4. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon/public key**

#### 5. Configure the Application

1. Open `config.js` in the project root
2. Replace the placeholder values with your Supabase credentials:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';  // Replace with your Project URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';  // Replace with your anon key
```

#### 6. Run the Application

1. Simply open `index.html` in your web browser
2. Or use a local development server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

3. Navigate to `http://localhost:8000` in your browser

## Usage

### Authentication

1. Click **Sign Up** to create a new account
2. Enter your email and password (minimum 6 characters)
3. After signup, you'll be automatically logged in
4. Use **Login** if you already have an account
5. Click **Logout** when you're done

### Notes Management

Once logged in:

1. Navigate to **My Notes** in the navigation
2. Click **+ Add New Note** to create a note
3. Enter a title and content
4. Click **Save Note** to save
5. Use the **✏️** button to edit a note
6. Use the **🗑️** button to delete a note
7. Use the search box to filter notes by title or content

## File Structure

```
.
├── index.html          # Main HTML structure
├── styles.css          # All styling and responsive design
├── script.js           # Authentication and CRUD functionality
├── config.js           # Supabase configuration
└── README.md           # This file
```

## Security Features

- Row Level Security (RLS) enabled on the notes table
- Users can only access their own notes
- Secure authentication handled by Supabase
- Password requirements enforced

## Browser Support

Works on all modern browsers including:
- Chrome
- Firefox
- Safari
- Edge

## Customization

You can easily customize:
- **Colors**: Edit color values in `styles.css`
- **Content**: Modify text in `index.html`
- **Sections**: Add or remove sections as needed
- **Styling**: Adjust styles to match your brand

## Troubleshooting

### Notes not loading?
- Check that you've created the notes table in Supabase
- Verify your Supabase credentials in `config.js`
- Check the browser console for errors

### Can't sign up/login?
- Ensure email confirmation is disabled in Supabase (Settings → Auth → Email Auth)
- Or check your email for the confirmation link
- Verify your Supabase credentials are correct

### Database errors?
- Make sure you've run the SQL script to create the table
- Check that RLS policies are correctly set up
- Verify your user is authenticated

### Where are users stored?
- Users are automatically stored in Supabase's `auth.users` system table
- This table is managed by Supabase Auth and is not visible in Table Editor
- View users in: **Authentication** → **Users** in your Supabase dashboard
- You only need to create the `notes` table - user authentication is handled automatically!

## License

This project is open source and available for personal and commercial use.

Enjoy your new website! 🎉

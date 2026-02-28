# URL Shortener Architecture

This project is a modern URL shortener built with lightweight frontend technologies and Supabase for the backend. It uses Vite as the build tool and development server.

## Overview
- **Frontend**: Vanilla HTML, CSS, and JavaScript.
- **Backend/Database**: Supabase (PostgreSQL).
- **Tooling**: Vite.
- **Hosting**: Designed to be hosted on Vercel.

## File Structure
- `index.html`: The main entry point. Contains the UI which mimics a Google Search aesthetic. The main form is hidden initially until a redirect check is complete.
- `style.css`: Contains all styling. Uses variables for a dark theme design.
- `app.js`: The core logic file. Loaded as a module (`type="module"`) via Vite.
- `.env`: (Ignored in Git) Contains Supabase credentials. Used by Vite via `import.meta.env`.

## Key Logic (`app.js`)
### Initialization
1. Reads environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. Initializes the Supabase client.
3. Checks if the URL contains a short code query parameter (e.g., `?c=xyz`).

### Redirection Flow
If `?c=XYZ` is present:
1. Shows a loading screen.
2. Queries the `urls` table in Supabase for `short_code = 'XYZ'`.
3. If found, redirects the window to `original_url`.
4. If not found, displays a 404 screen.

### Shortening Flow (Form Submit)
If no short code is in the URL, the main UI is shown. When a user submits a URL:
1. Validates and formats the URL (adds `http://` if missing).
2. **Duplication Check**: Queries Supabase to see if `original_url` already exists in the database.
   - If it exists: Retrieves the existing `short_code`, constructs the short URL, displays it, and terminates the flow. This prevents duplicate entries.
3. **Generation**: If it doesn't exist, generates a random 6-character Base62 string.
4. **Collision Check**: Verifies the code is unique by querying the database (retries up to 3 times).
5. **Insertion**: Inserts the new `{ short_code, original_url }` into the `urls` table.
6. Displays the newly generated short URL to the user.

## Database Schema (Supabase)
Table name: `urls`
- `id` (bigint): Primary Key, auto-increment.
- `short_code` (text): Unique, not null (e.g. 'aB3x9').
- `original_url` (text): Not null.
- `created_at` (timestampz): Default `now()`.

RLS (Row Level Security) is enabled. Public insert and read access must be allowed.

## AI Instructions
- Please provide concise responses when answering queries related to this project.

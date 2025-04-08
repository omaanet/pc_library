# Project Tech Stack Analysis

## Frontend

-   **Framework**: Next.js 15 (App Router)
-   **UI Library**: React 19 (RC)
-   **Styling**: Tailwind CSS with Shadcn UI components
-   **UI Primitives**: Radix UI
-   **Form Handling**: React Hook Form with Zod validation
-   **Theming**: Next Themes for dark mode support
-   **Icons**: Lucide React
-   **State Management**: React Context (found in src/context)
-   **Type Checking**: TypeScript 5.8

## Backend

-   **API Layer**: Next.js API routes
-   **Database**: SQLite (better-sqlite3 driver)
-   **Email**: Nodemailer
-   **Database Schema**: Defined in `db/schema.sql`

## API Routes

### Audiobooks

-   `GET /api/audiobooks` - List all audiobooks
-   `GET /api/audiobooks/[id]` - Get specific audiobook

### Authentication

-   `POST /api/auth/login` - User login
-   `POST /api/auth/register` - User registration
-   `GET /api/auth/session` - Get current session
-   `POST /api/auth/logout` - Logout

### Books

-   `GET /api/books` - List all books
-   `GET /api/books/[id]` - Get specific book

### Covers

-   `GET /api/covers/[id]` - Get book cover image

### User

-   `GET /api/user` - Get user profile
-   `POST /api/user/preferences` - Update user preferences

## Database Structure

Key tables:

-   `books` - Core book information
-   `audiobooks` - Audio-specific book data
-   `users` - User accounts
-   `user_preferences` - User settings
-   `book_progress` - Reading progress tracking
-   `reading_sessions` - Session history
-   `audio_sessions` - Audio listening history

## Component Structure

### Auth Components

-   `LoginForm` - User login form
-   `RegisterForm` - User registration form
-   `AuthProvider` - Authentication context
-   `ProtectedRoute` - Route guard

### Book Components

-   `BookCard` - Book display card
-   `BookList` - Book collection view
-   `BookDetails` - Detailed book view
-   `BookProgress` - Reading progress tracker

### UI Components (Shadcn)

-   `Button`, `Card`, `Dropdown`, `Input`, etc.

### Layout Components

-   `MainLayout` - Primary application layout

### Settings Components

-   `ProfileSettings` - User profile editor
-   `PreferencesSettings` - User preferences
-   `AppearanceSettings` - Theme customization

### Shared Components

-   `Header` - Main navigation
-   `Footer` - App footer

### Theme Components

-   `ThemeProvider` - Theme context
-   `ThemeSwitcher` - Dark/light mode toggle

## Type System

Defined in `src/types/index.ts`:

-   `Book` - Core book type
-   `AudioBook` - Audio-specific book type
-   `User` - User account type
-   `UserPreferences` - User settings type
-   `UserStats` - Reading statistics

## Development Tools

-   **Bundler**: Next.js (Webpack)
-   **Linting**: ESLint
-   **CSS Processing**: PostCSS with Autoprefixer
-   **Build Optimization**: Turbo mode enabled

## Key Architectural Features

-   App Router based architecture
-   Type-safe database operations
-   Comprehensive user preference system
-   Detailed reading progress tracking
-   Dark mode support
-   Responsive design with Tailwind

## Deployment

-   Uses custom ports (3005 for dev, 3006 for production)
-   SQLite database stored in `db/books.db3`
-   Environment variables for configuration

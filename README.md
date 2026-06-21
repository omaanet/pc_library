# Racconti in Voce e Caratteri

A modern Next.js web application for reading and listening to creative fiction stories. The platform features both text-based books and audiobooks, with a focus on charitable reading initiatives.

## 🌟 Features

- **📚 Digital Library**: Browse and read a curated collection of creative fiction stories
- **🎧 Audiobook Support**: Listen to audio versions of stories with integrated Mux media player
- **👤 User Authentication**: Secure registration, email verification, and session management
- **🎨 Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **🌓 Dark Mode**: Full theme support with system preference detection
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **🔍 Advanced Search & Filtering**: Filter books by category, rating, and availability
- **💬 Comments System**: Engage with stories through comments and replies
- **📖 Image-Based Page Reader**: Read books with single/double page views, zoom, and pan controls
- **⚡ Performance**: Leveraging Next.js 15 with Turbopack for fast development
- **🗄️ PostgreSQL Database**: Powered by Neon serverless PostgreSQL

## 🛠️ Tech Stack

### Core Framework
- **Next.js 16.2.4** - React framework with App Router and Turbopack
- **React 19.2.0** - UI library (stable release)
- **TypeScript 5.9.3** - Type safety

### UI & Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **next-themes** - Theme management

### Database & Backend
- **Neon PostgreSQL** - Serverless PostgreSQL database
- **@neondatabase/serverless** - Neon database client

### Media & Content
- **@mux/mux-player-react** - Video/audio player for audiobooks
- **Sharp** - Image optimization
- **DOMPurify** - HTML sanitization

### Forms & Validation
- **React Hook Form 7.56.4** - Form management
- **Zod 3.24.4** - Schema validation
- **@hookform/resolvers** - Form validation integration

### Email
- **Nodemailer 6.10.1** - Email sending for verification and notifications

### Development Tools
- **pnpm** - Fast, disk space efficient package manager
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 📋 Prerequisites

- **Node.js** 18.18.0 or higher (Node.js 20+ recommended)
- **pnpm** 8.x or higher
- **PostgreSQL database** (Neon recommended)
- **SMTP server** for email functionality

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd my-app_claude
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# App URL (used for verification links)
NEXT_PUBLIC_APP_URL=http://localhost:3005

# Security
PASSWORD_SALT=your-random-salt-string

# Database
DATABASE_URL=postgresql://user:password@host-pooler:port/database?sslmode=require
```

**Note**: The DATABASE_URL should use Neon's pooled endpoint (contains `-pooler`) for optimal performance. Connection pooling enables up to 10,000 concurrent connections.

#### Environment Variables Explained

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_URL` | Base URL of your application | Yes |
| `PASSWORD_SALT` | Salt for password hashing | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |

### 4. Database Setup

The application uses Neon PostgreSQL. Ensure your database has the following tables:

- `books` - Book metadata and content
- `audiobooks` - Audiobook media information
- `users` - User accounts
- `user_preferences` - User settings
- `user_stats` - Reading statistics
- `comments` - Book comments and replies

### 5. Run Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3005`

### Alternative Development Commands

```bash
# Run without Turbopack
pnpm dev2

# Run with environment variable checking
pnpm devENV
```

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with Turbopack on port 3005 |
| `pnpm dev2` | Start development server without Turbopack |
| `pnpm build` | Build production bundle (can use `--turbo` flag for beta Turbopack builds) |
| `pnpm start` | Start production server on port 3006 |
| `pnpm lint` | Run ESLint using the root flat config (`eslint.config.cjs`) |
| `pnpm check-env` | Verify environment variables |

## 📁 Project Structure

```
my-app_claude/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── books/         # Book CRUD operations
│   │   │   ├── audiobooks/    # Audiobook endpoints
│   │   │   ├── covers/        # Cover image serving
│   │   │   ├── user/          # User preferences
│   │   │   └── users/         # User management
│   │   ├── activate/          # Email verification page
│   │   ├── add-book/          # Book creation (admin)
│   │   ├── read-book/         # EPUB reader
│   │   ├── settings/          # User settings
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── admin/            # Admin components
│   │   ├── audio/            # Audio player components
│   │   ├── auth/             # Authentication UI
│   │   ├── books/            # Book display components
│   │   ├── layout/           # Layout components
│   │   ├── settings/         # Settings UI
│   │   ├── shared/           # Shared utilities
│   │   └── ui/               # shadcn/ui components
│   ├── config/               # Configuration files
│   │   ├── auth-config.ts    # Auth settings
│   │   ├── fonts.ts          # Font configuration
│   │   └── site-config.ts    # Site-wide settings
│   ├── context/              # React Context providers
│   │   └── auth-context.tsx  # Authentication state
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   │   ├── db/              # Database utilities
│   │   │   ├── client.ts    # Neon client
│   │   │   ├── queries/     # SQL queries
│   │   │   └── types.ts     # DB types
│   │   ├── mailer.ts        # Email service
│   │   └── user-db.ts       # User operations
│   ├── providers/            # App providers
│   ├── styles/               # Global styles
│   ├── types/                # TypeScript definitions
│   └── proxy.ts              # Next.js proxy
├── public/                   # Static assets
├── scripts/                  # Utility scripts
├── .env.local               # Environment variables (not in git)
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## 🔌 API Routes

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session
- `POST /api/auth/activate` - Activate user account

### Books
- `GET /api/books` - List all books (with filtering, sorting, pagination)
- `GET /api/books/[id]` - Get single book details
- `POST /api/books/[id]/comments` - Add comment to book
- `GET /api/books/[id]/replies` - Get comment replies

### Audiobooks
- `GET /api/audiobooks/[book_id]` - Get audiobook metadata

### User
- `GET /api/user/preferences` - Get user preferences
- `PUT /api/user/preferences` - Update user preferences

### System
- `POST /api/system/log` - Client-side logging
- `GET /api/covers/[...params]` - Serve book cover images
- `GET /api/placeholder/[width]/[height]` - Generate placeholder images

### Book Requests
- `POST /api/request-book/[book_id]` - Request access to a book

## 🎨 Styling & Theming

The application uses a comprehensive theming system:

- **CSS Variables**: Theme colors defined in `src/styles/globals.css`
- **Dark Mode**: Automatic detection with manual toggle
- **Custom Fonts**: Configured in `src/config/fonts.ts`
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## 🔐 Authentication Flow

1. **Registration**: User signs up with email and full name
2. **Email Verification**: Verification email sent with token
3. **Activation**: User clicks link to activate account
4. **Login**: Session-based authentication
5. **Password Security**: Passwords hashed with salt

## 📚 Book Management

### Book Properties
- Title, summary, extract
- Cover image
- Publishing date
- Rating (0-5 stars)
- Page count
- Audio availability
- Preview status
- Display order
- Visibility flag

### Filtering & Sorting
- Filter by preview status
- Sort by date, rating, title, audio availability
- Pagination support
- Search functionality

## 🎧 Audio Features

- Mux-powered audio streaming
- Progress tracking
- Playback controls
- Audio length display
- Preview audio support

## 📖 Image-Based Page Reader

- PNG page images loaded from Wasabi S3 CDN
- Single and double page viewing modes
- Pinch-to-zoom and pan gestures
- Fullscreen mode support
- Keyboard navigation (arrows, +/- for zoom)
- Page preloading for smooth experience
- Reading progress persistence
- PDF download functionality

## 🔧 Configuration Files

### `next.config.ts`
- Image optimization settings
- Security headers for cover images
- Console log removal in production

### `tailwind.config.ts`
- Custom color schemes
- Typography settings
- Animation configurations
- Component variants

### `tsconfig.json`
- Path aliases (`@/`)
- Strict type checking
- Module resolution

## 🚀 Deployment

### Build for Production

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

The production server runs on port 3006 by default.

### Environment Variables for Production

Ensure all environment variables are set in your production environment, particularly:
- `NEXT_PUBLIC_APP_URL` - Your production domain
- `DATABASE_URL` - Production database connection
- `STATS_HASH_SECRET` - Stable server-only secret used to HMAC anonymous promo visitor IPs. Generate at least 32 random bytes, keep it out of version control, and do not rotate it unless fragmenting historical visitor identities is acceptable.
- Email configuration for production SMTP server

## 🔍 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow existing component patterns
- Use async/await for database operations
- Implement proper error handling
- Add comments for complex logic

### Database Queries
- Use parameterized queries to prevent SQL injection
- Leverage database indexes for performance
- Implement pagination for large datasets
- Use transactions for multi-step operations

### Component Structure
- Keep components focused and single-purpose
- Use React hooks for state management
- Implement proper loading and error states
- Follow accessibility best practices

### API Routes
- Validate input with Zod schemas
- Return consistent response formats
- Handle errors gracefully
- Use appropriate HTTP status codes

## 🚀 Performance

### Database Connection Pooling
- Uses Neon's connection pooling via the `-pooler` endpoint
- Supports up to 10,000 concurrent connections
- Automatically enabled when DATABASE_URL contains `-pooler`

### Debugging Mode
- Database query debugging is enabled only in development
- Production environments use the raw Neon client for optimal performance
- Check console logs for connection pooling status on startup

## 🐛 Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify `DATABASE_URL` is correct
- Check network connectivity to Neon
- Ensure database exists and is accessible

**Email Not Sending**
- Verify SMTP credentials
- Check firewall settings
- Test with a different SMTP provider

**Build Errors**
- Clear `.next` directory: `rm -rf .next`
- Delete `node_modules` and reinstall: `pnpm install`
- Check for TypeScript errors: `pnpm lint`

**Port Already in Use**
- Change port in package.json scripts
- Kill process using the port
- Use alternative dev command (`pnpm dev2`)

## 📄 License

This project is private and proprietary.

## 👤 Author

**Piero Carbonetti**

## 🤝 Contributing

This is a private project. Contact the author for contribution guidelines.

## 📞 Support

For issues or questions, contact: info@raccontiinvoceecaratteri.it

---

**Note**: This application is designed for charitable reading initiatives. All proceeds from book access should be donated to non-profit organizations, volunteer associations, foundations, or specific causes as chosen by the reader.

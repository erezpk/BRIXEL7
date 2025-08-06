# AgencyCRM - Hebrew SaaS CRM System

## Overview

AgencyCRM is a comprehensive SaaS CRM system designed specifically for digital marketing agencies, website builders, and video editors operating in the Hebrew/Israeli market. The system features full right-to-left (RTL) language support and provides a modern, responsive interface for managing clients, projects, tasks, and digital assets. Built as a multi-tenant platform, it supports different user roles including Super Admin, Agency Admin, Team Members, and Clients, each with appropriate access levels and functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes & Current Status

### Quote Email System Fix (January 6, 2025)
- **Database Schema Fixes**: Resolved missing columns in quotes and agencies tables
  - Added missing columns: rejected_at, rejection_reason, view_count, viewed_at, terms
  - Added missing logo column to agencies table to fix quote email sending
- **Quote Form UX Improvements**: Fixed duplicate email fields issue
  - Removed duplicate sender email and name fields from quote creation form
  - Unified email settings into single sidebar section with clear labels
  - Pre-populated sender information with agency defaults
- **Email Functionality**: Quote email system fully operational
  - Fixed quote creation and email sending integration
  - Gmail SMTP connection verified and working properly
  - Quotes now properly marked as 'sent' after successful email delivery
  - Hebrew email templates with proper RTL formatting

### Gmail SMTP Email Service Integration (January 5, 2025)
- **Email Service Migration**: Successfully replaced Sendgrid with Gmail SMTP using Nodemailer
  - Implemented secure Gmail SMTP authentication with app passwords
  - Added comprehensive email service initialization with connection verification
  - Created Hebrew email templates for welcome messages, lead notifications, and project updates
- **Email Management Interface**: 
  - Built dedicated email setup page (/dashboard/email-setup) with connection testing
  - Added email settings integration in main settings page
  - Implemented test email functionality with Hebrew RTL support
  - Added API endpoints for connection testing and email sending
- **Production Ready**: Email service fully operational with techpikado@gmail.com
  - Gmail SMTP verified and working (✅ logged on startup)
  - Environment variables properly configured (GMAIL_USER, GMAIL_APP_PASSWORD)
  - All email features available: welcome emails, lead notifications, password reset, client credentials

### Complete System Implementation (January 5, 2025)
- **Authentication System**: Fully functional dual authentication with email/password and Google OAuth
  - Fixed Firebase initialization and environment variable configuration
  - Resolved user agency association issues - users now properly linked to agencies
  - Frontend error handling improved with proper Hebrew error messages
- **Navigation & UI Updates**: 
  - Removed Assets page from main menu (now integrated into client cards)
  - Removed Templates page from main menu entirely
  - Updated sidebar navigation to focus on core business functions
- **Reports Dashboard**: Comprehensive business analytics page implemented
  - KPI cards with live business metrics (clients, projects, tasks, revenue)
  - Interactive charts for trends and performance analysis
  - Team performance analytics with efficiency tracking
  - Filtering capabilities by date range and category types
  - Export functionality for business intelligence
- **Bug Fixes**: 
  - Fixed task creation API calls (corrected apiRequest format)
  - Fixed client creation API calls (corrected apiRequest format)
  - Resolved agency association for existing users
  - All CRUD operations now working properly (200 status codes)

## System Architecture

### Frontend Architecture
The frontend is built using **React 18** with **TypeScript** and utilizes **Vite** as the build tool. The UI is constructed with **shadcn/ui** components built on top of **Radix UI** primitives, providing a consistent and accessible component library. **Tailwind CSS** handles styling with full RTL support configured through custom CSS variables and Hebrew fonts (Assistant, Rubik).

**State Management**: The application uses **TanStack Query (React Query)** for server state management, caching, and synchronization. Local component state is managed with React's built-in useState and useContext hooks.

**Routing**: Client-side routing is handled by **wouter**, a lightweight alternative to React Router, providing declarative route definitions and navigation.

**Authentication**: Session-based authentication is implemented with **Passport.js** using local strategy, with session data stored securely and user context managed through React Query.

### Backend Architecture
The backend is built on **Node.js** with **Express.js** as the web framework. The server follows RESTful API conventions with clear separation of concerns:

**Database Layer**: **Drizzle ORM** provides type-safe database operations with **PostgreSQL** as the primary database. **Neon Database** (serverless Postgres) is used as the database provider.

**Authentication & Authorization**: **Passport.js** handles authentication with **bcrypt** for password hashing. Session management uses **express-session** with **connect-pg-simple** for PostgreSQL session storage.

**API Structure**: Routes are organized by resource type (clients, projects, tasks, assets) with proper HTTP methods and status codes. Middleware handles authentication, authorization, and error processing.

### Database Design
The database schema supports multi-tenancy through agency-based data isolation:

**Core Entities**:
- **Agencies**: Top-level tenant entities with settings and configuration
- **Users**: Support multiple roles (super_admin, agency_admin, team_member, client) with agency association
- **Clients**: Customer records with custom fields support and status tracking
- **Projects**: Work containers linked to clients with status and progress tracking
- **Tasks**: Granular work items with assignments, priorities, and completion tracking
- **Digital Assets**: Domain and hosting management with renewal tracking
- **Task Comments**: Threaded communication on tasks
- **Activity Log**: System-wide audit trail for user actions

**Data Relationships**: Foreign key relationships ensure data integrity while supporting the multi-tenant architecture. JSON fields store flexible custom data and settings.

### Multi-Tenant Architecture
The system implements tenant isolation at the agency level:
- All data queries are scoped by agency ID
- User sessions include agency context
- API endpoints enforce agency-based access control
- Database constraints prevent cross-agency data access

### RTL and Internationalization
The system is built with Hebrew as the primary language:
- HTML document direction set to RTL
- Tailwind CSS configured with RTL-specific utilities
- Custom RTL class mapping utility for directional styling
- Hebrew fonts (Assistant, Rubik) loaded and configured
- All UI text in Hebrew with appropriate cultural considerations

### Real-time Features
The architecture supports real-time updates through:
- React Query's background synchronization
- Optimistic updates for immediate UI feedback
- Automatic cache invalidation on mutations
- WebSocket preparation for future real-time messaging

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and migrations
- **@neondatabase/serverless**: WebSocket-enabled database client

### UI and Styling
- **Radix UI**: Accessible, unstyled UI primitives for complex components
- **Tailwind CSS**: Utility-first CSS framework with RTL configuration
- **Lucide React**: Icon library with comprehensive icon set
- **shadcn/ui**: Pre-built component library built on Radix UI

### Authentication and Security
- **Passport.js**: Authentication middleware with local strategy
- **bcrypt**: Password hashing and verification
- **express-session**: Session management middleware
- **connect-pg-simple**: PostgreSQL session store

### Development and Build Tools
- **Vite**: Fast build tool and development server with HMR
- **TypeScript**: Static type checking and enhanced development experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

### Data Management
- **TanStack Query**: Server state management, caching, and synchronization
- **React Hook Form**: Form handling with validation
- **@hookform/resolvers**: Form validation resolvers
- **Zod**: Schema validation and type safety
- **date-fns**: Date manipulation and formatting with Hebrew locale

### Font Services
- **Google Fonts**: Hebrew fonts (Assistant, Rubik) for RTL text rendering

The system is designed to be scalable, maintainable, and provides a solid foundation for a multi-tenant SaaS CRM specifically tailored for Hebrew-speaking digital agencies.
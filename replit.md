# AgencyCRM - Hebrew SaaS CRM System

## Overview
AgencyCRM is a comprehensive SaaS CRM system for digital marketing agencies, website builders, and video editors in the Hebrew/Israeli market. It features full right-to-left (RTL) language support, a modern, responsive interface, and manages clients, projects, tasks, and digital assets. As a multi-tenant platform, it supports roles like Super Admin, Agency Admin, Team Members, and Clients with appropriate access levels. The system aims to streamline operations and enhance productivity for agencies.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (January 2025)
- Enhanced sidebar navigation with grouped sections for better organization
- Improved client cards with cleaner, more organized visual design
- Fixed lead card navigation - clicking on lead cards now opens lead details page
- Removed irrelevant pages (assets, client-templates) for streamlined navigation
- Enhanced meeting scheduler popup height for better usability
- Fixed technical issues with lead-details page useEffect implementation
- Ensured full CRUD functionality for leads with edit/delete options in Kanban view

## System Architecture

### Frontend Architecture
The frontend uses **React 18** with **TypeScript** and **Vite**. UI components are built with **shadcn/ui** (based on **Radix UI**) and styled with **Tailwind CSS**, including full RTL support and Hebrew fonts (Assistant, Rubik). State management utilizes **TanStack Query** for server state and React's built-in hooks for local state. **wouter** handles client-side routing, and **Passport.js** manages session-based authentication.

### Backend Architecture
The backend is built on **Node.js** with **Express.js**, following RESTful API conventions. **Drizzle ORM** provides type-safe database operations with **PostgreSQL** (hosted on **Neon Database**). Authentication and authorization are handled by **Passport.js** (with **bcrypt** for hashing) and **express-session** for session management. Routes are organized by resource type, enforcing authentication, authorization, and error handling via middleware.

### Database Design
The database schema supports multi-tenancy with agency-based data isolation. Core entities include Agencies, Users (with various roles), Clients, Projects, Tasks, Digital Assets, Task Comments, and Activity Log. Data relationships enforce integrity, and JSON fields are used for flexible custom data.

### Multi-Tenant Architecture
Tenant isolation is implemented at the agency level. All data queries are scoped by agency ID, user sessions include agency context, API endpoints enforce agency-based access control, and database constraints prevent cross-agency data access.

### RTL and Internationalization
The system is built with Hebrew as the primary language, supporting RTL through HTML direction, Tailwind CSS configurations, custom RTL class mapping, and dedicated Hebrew fonts (Assistant, Rubik).

### Real-time Features
The architecture supports real-time updates via React Query's background synchronization, optimistic updates, and automatic cache invalidation. WebSocket preparation is in place for future real-time functionalities.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations
- **@neondatabase/serverless**: WebSocket-enabled database client

### UI and Styling
- **Radix UI**: Accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework with RTL configuration
- **Lucide React**: Icon library
- **shadcn/ui**: Pre-built component library

### Authentication and Security
- **Passport.js**: Authentication middleware
- **bcrypt**: Password hashing
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### Development and Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler

### Data Management
- **TanStack Query**: Server state management
- **React Hook Form**: Form handling with validation
- **@hookform/resolvers**: Form validation resolvers
- **Zod**: Schema validation
- **date-fns**: Date manipulation and formatting

### Font Services
- **Google Fonts**: Hebrew fonts (Assistant, Rubik)
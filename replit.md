# BODYCRAFT Master Data Management (MDM) System

## Overview

The BODYCRAFT Master Data Management (MDM) System is a comprehensive web application designed to manage IT assets across 32 retail outlets throughout India. The system replaces manual Excel-based tracking with a centralized platform that maintains complete audit trails, manages asset assignments, and integrates with existing infrastructure systems like CCTV and biometric devices.

The application serves as a single source of truth for asset management, employee tracking, and location-based operations, ensuring data integrity through historical preservation and comprehensive logging of all transactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern component patterns
- **Vite** as the build tool for fast development and optimized production builds
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **Shadcn/ui** component library built on Radix UI primitives for accessible, customizable components
- **Tailwind CSS** with custom design system for consistent styling

### Backend Architecture
- **Node.js** with Express.js providing RESTful API endpoints
- **TypeScript** throughout the stack for consistent type safety
- **Zod** for runtime schema validation and type inference
- **Modular storage interface** allowing for flexible database implementations
- **Session-based architecture** with PostgreSQL session store

### Data Storage Solutions
- **PostgreSQL** as the primary database with Neon serverless hosting
- **Drizzle ORM** for type-safe database queries and schema management
- **Historical data preservation** - assignment history is never overwritten
- **Comprehensive audit trails** for all data modifications
- **Multi-tenant data isolation** supporting all 32 outlet locations

### Authentication and Authorization
- **Session-based authentication** using connect-pg-simple for PostgreSQL session storage
- **Comprehensive role-based access control (RBAC)** with location-based isolation
- **Three-tier permission model**: Super Admin, Admin, and Location User
- **Location-based data filtering** ensuring complete data isolation between outlets
- **Pre-update authorization** preventing unauthorized cross-location modifications
- **Defense-in-depth security** with multiple validation layers

### Design System
- **Modern design approach** inspired by Canva and Figma
- **Dual theme support** (light/dark) with purple primary branding
- **Responsive design** supporting desktop, tablet, and mobile devices
- **Accessibility-first** component library with keyboard navigation and screen reader support

### Database Schema Design
The system uses a relational model with core entities:
- **Locations** - 32 BODYCRAFT outlets with contact information
- **Employees** - Staff members with department and designation tracking
- **Assets** - IT equipment with detailed specifications and lifecycle management
- **Assignment History** - Immutable record of asset-to-employee assignments
- **Maintenance Records** - Service history and warranty tracking
- **Integration Tables** - CCTV systems, biometric devices, and backup records

### API Architecture
- **RESTful endpoints** following standard HTTP conventions
- **Consistent error handling** with proper status codes and error messages
- **Input validation** using Zod schemas at API boundaries
- **Structured logging** for debugging and audit purposes

## External Dependencies

### Database Services
- **Neon Database** - Serverless PostgreSQL hosting with automatic scaling
- **Drizzle Kit** - Database migration and schema management tools

### UI Framework
- **Radix UI** - Headless component primitives for accessibility and customization
- **Lucide React** - Modern icon library with consistent styling
- **Embla Carousel** - Touch-friendly carousel components
- **Class Variance Authority** - Type-safe component variant management

### Development Tools
- **Vite Plugins** - Development enhancements including error overlay and development banner
- **PostCSS with Autoprefixer** - CSS processing and vendor prefix management
- **TypeScript** - Static type checking across the entire application

### Google Fonts Integration
- **Inter** - Primary interface font for excellent readability
- **Plus Jakarta Sans** - Display font for headings and emphasis
- **Additional fonts** - Extended typography palette for various use cases

### Form Management
- **React Hook Form** - Performance-optimized form handling
- **Hookform Resolvers** - Zod integration for form validation

### Utilities
- **Date-fns** - Date manipulation and formatting
- **clsx and tailwind-merge** - Conditional CSS class management
- **nanoid** - Unique ID generation for sessions and records

The system is architected for scalability and maintainability, with clear separation of concerns and comprehensive type safety throughout the stack.

## Recent Changes

### October 4, 2025 - RBAC Implementation Completed (Production-Ready)
- Implemented comprehensive role-based access control (RBAC) with location-based isolation
- Added locationId field to users table for location-specific access control
- Updated session types to store user's locationId for runtime authorization
- Created filterByUserLocation helper to filter data arrays by user location
- Created canAccessLocation helper to validate location access permissions
- Applied RBAC protection to ALL API routes:
  - Assets: location filtering on GET, location validation on write, transfer prevention for location_user
  - Employees: location filtering on GET, location validation on write, transfer prevention for location_user  
  - Maintenance: location filtering via asset lookup, assetId reassignment prevention for location_user
  - Assignments: location filtering via asset lookup, location-restricted assignment creation
  - CCTV: location filtering on GET, admin-only write operations
  - Biometric: location filtering on GET, admin-only write operations
  - Backups: location filtering via asset lookup, location-restricted backup creation
  - Locations: admin-only write operations
- Fixed critical security vulnerabilities:
  - All PATCH routes now verify authorization BEFORE database updates
  - Prevented authorization-after-mutation bugs in maintenance and CCTV routes
  - Blocked cross-location reassignment via request payload (locationId/assetId changes)
  - Return 403 errors WITHOUT mutating data when access is denied
- Architect-verified production-ready with no remaining security vulnerabilities
- Complete data isolation between 32 BODYCRAFT retail outlets

### October 4, 2025 - Replit Environment Setup Completed
- Successfully imported GitHub project into Replit environment
- Created PostgreSQL database for permanent data storage
- Fixed Drizzle-Zod schema compatibility issues (updated to use refinement syntax)
- Pushed database schema using Drizzle ORM (`npm run db:push`)
- Configured application to use DatabaseStorage for persistent data
- Seeded database with initial sample data including locations, employees, assets, and demo users
- Set up workflow with webview output for frontend on port 5000
- Configured deployment for autoscale with proper build and run commands
- Added session type definitions for TypeScript
- Created .gitignore for Node.js projects
- Verified application is running successfully with authentication system
- Frontend properly configured with `allowedHosts: true` for Replit proxy compatibility
- Application accessible at port 5000 with Express serving both frontend and backend

### Running the Application

**Development Mode:**
```bash
npm run dev
```
This starts the Express server with Vite for the frontend on port 5000.

**Database Commands:**
```bash
npm run db:push         # Push schema changes to database
npm run db:push --force # Force push if there are warnings
npm run seed            # Seed database with sample data
```

### Role-Based Access Control (RBAC)

The system implements comprehensive location-based access control with three distinct roles:

**Super Admin (Global Access)**
- Full access to all 32 locations and all operations
- Can create/update/delete assets, employees, and locations
- Can transfer assets and employees between locations
- Can manage CCTV systems and biometric devices
- Can access all reports and audit trails

**Admin (Global Access)**
- Full access to all 32 locations and most operations
- Can create/update/delete assets, employees within all locations
- Can transfer assets and employees between locations
- Can manage CCTV systems and biometric devices
- Same permissions as Super Admin for day-to-day operations

**Location User (Location-Restricted Access)**
- Access ONLY to their assigned location
- Can view and manage assets/employees within their location
- Can create maintenance records and backups for location assets
- CANNOT transfer assets or employees to other locations
- CANNOT modify CCTV systems or biometric devices
- Can only reassign assets to employees within their location

**Security Implementation:**
- All GET routes filter data by user's location context
- All POST routes validate location access before creation
- All PATCH routes verify authorization BEFORE any database update
- Location users cannot change locationId or assetId to cross-location values
- Authorization failures return 403 errors WITHOUT mutating data

### Demo Login Credentials

The system comes pre-configured with demo accounts:

**Super Admin:**
- Username: `admin`
- Password: `admin123`
- Email: admin@bodycraft.com

Additional demo accounts are available through the login page interface (Admin, Manager, User roles).

### Project Structure
- `/client` - React frontend with Vite
- `/server` - Express backend API
- `/shared` - Shared TypeScript types and Drizzle schema
- `/attached_assets` - Static assets for the frontend

### Environment Variables
The application uses the following environment variables (automatically configured in Replit):
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `SESSION_SECRET` - Session encryption key (auto-generated)
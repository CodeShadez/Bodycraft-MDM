# BODYCRAFT Master Data Management (MDM) System

## Overview

The BODYCRAFT Master Data Management (MDM) System is a comprehensive web application designed to manage IT assets across 32 retail outlets throughout India. The system replaces manual Excel-based tracking with a centralized, web-based solution that provides complete asset lifecycle management, employee tracking, and location-based operations. The application serves as a single source of truth for asset management, ensuring data integrity through historical preservation and comprehensive audit trails. Currently, the system exists as a visual prototype that requires complete functionality implementation to become a production-ready business tool.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type-safe component development and modern React patterns
- **Vite** as the build tool providing fast development server and optimized production builds
- **Wouter** for lightweight client-side routing without the overhead of React Router
- **TanStack Query** for sophisticated server state management, caching, and data synchronization
- **Shadcn/ui** component library built on Radix UI primitives, providing accessible and customizable UI components
- **Tailwind CSS** with extensive custom design system including dual theme support (light/dark mode)
- **Class Variance Authority** for type-safe component variant management

### Backend Architecture
- **Node.js** with Express.js providing RESTful API architecture
- **TypeScript** throughout the entire stack ensuring type safety from database to frontend
- **Zod** for comprehensive runtime schema validation and automatic type inference
- **Modular storage interface** design allowing flexible database implementations and easy testing
- **Session-based authentication** with PostgreSQL session store for scalable user management
- **RESTful API design** with consistent error handling and response formatting

### Data Storage Solutions
- **PostgreSQL** as the primary relational database with Neon serverless hosting for scalability
- **Drizzle ORM** providing type-safe database queries, migrations, and schema management
- **Historical data preservation** architecture where assignment history is never overwritten, ensuring complete audit trails
- **Multi-tenant data isolation** supporting all 32 outlet locations with location-based data filtering
- **Comprehensive audit logging** for all data modifications with timestamps and user attribution

### Authentication and Authorization
- **Session-based authentication** using connect-pg-simple for reliable PostgreSQL session storage
- **Role-based access control** framework designed for different permission levels (administrators, managers, users)
- **Location-based data filtering** ensuring users only access relevant outlet information
- **Security-first design** with data encryption and compliance-ready audit trails

### Design System and UI Architecture
- **Modern design approach** inspired by productivity tools like Canva, Figma, Notion, and Linear
- **Purple-based color palette** (264 100% 50%) for creative energy with carefully crafted light and dark theme variants
- **Typography system** using Inter for interface text and Plus Jakarta Sans for headings
- **Responsive design** supporting desktop, tablet, and mobile devices with consistent spacing using Tailwind's systematic approach
- **Accessibility-first** component library with keyboard navigation, screen reader support, and WCAG compliance
- **Comprehensive component library** including navigation, data management, and content creation interfaces

### Database Schema Design
The system uses a relational model with core entities:
- **Locations** - 32 BODYCRAFT outlets with contact information and management details
- **Employees** - Staff members with unique employee codes, department assignments, and location associations
- **Assets** - IT equipment with custom asset IDs, specifications, warranty tracking, and condition monitoring
- **Assignment History** - Complete audit trail of asset assignments that preserves all historical data
- **Maintenance Records** - Service history, costs, and scheduling for all assets
- **CCTV Systems** - Security camera management with DVR integration
- **Biometric Systems** - Access control and attendance tracking integration
- **Backup Records** - Data protection and compliance tracking

## External Dependencies

### Database and Hosting
- **Neon PostgreSQL** - Serverless PostgreSQL hosting for production database
- **Drizzle Kit** - Database migration and schema management tooling

### UI and Component Libraries
- **Radix UI** - Accessible component primitives for building the design system
- **Lucide React** - Icon library providing consistent iconography
- **React Hook Form** - Form state management and validation
- **Embla Carousel** - Touch-friendly carousel components for mobile interfaces

### Data Processing and Export
- **XLSX** - Excel file processing for bulk import/export functionality
- **File-saver** - Client-side file download capabilities for reports and exports
- **Date-fns** - Date manipulation and formatting utilities

### Development and Build Tools
- **ESBuild** - Fast JavaScript bundler for production builds
- **TSX** - TypeScript execution environment for development
- **PostCSS** - CSS processing with Tailwind CSS integration
- **Autoprefixer** - Automatic CSS vendor prefixing

### Session Management
- **Connect-pg-simple** - PostgreSQL session store for secure user authentication
- **Express Session** - Server-side session management middleware

### Validation and Type Safety
- **Zod** - Runtime schema validation and TypeScript type inference
- **Drizzle-zod** - Integration between Drizzle ORM and Zod validation schemas
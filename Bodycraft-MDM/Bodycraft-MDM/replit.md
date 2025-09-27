# BODYCRAFT Master Data Management (MDM) System

## Overview

The BODYCRAFT Master Data Management (MDM) System is a comprehensive web application designed to manage IT assets across 32 retail outlets throughout India. The system replaces manual Excel-based tracking with a centralized, digital solution that maintains complete historical records of asset assignments, employee data, and location information. Built as a single source of truth for asset management, the application ensures data integrity through historical preservation and comprehensive audit trails, supporting various asset types including laptops, desktops, monitors, mobile devices, networking equipment, and specialized systems like CCTV and biometric devices.

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
The system employs a relational model with core entities designed for scalability and data integrity:
- **Locations table** managing 32 BODYCRAFT outlets with contact information and management details
- **Employees table** with unique employee codes, department tracking, and location assignment
- **Assets table** with unique asset IDs, comprehensive metadata, and current assignment tracking
- **Assignment history table** preserving complete historical records of all asset movements
- **Maintenance records** for tracking asset servicing and repairs
- **Integration tables** for CCTV systems, biometric systems, and backup management

## External Dependencies

### Database and Infrastructure
- **Neon Database** - Serverless PostgreSQL hosting with automatic scaling and branching capabilities
- **Drizzle Kit** - Database migrations and schema management tooling

### Frontend Libraries and Frameworks
- **Radix UI** - Comprehensive primitive component library providing accessibility and customization foundation
- **TanStack Query** - Advanced data fetching, caching, and synchronization for React applications
- **Wouter** - Minimalist routing library for React applications
- **React Hook Form** with Hookform Resolvers for form management and validation
- **Embla Carousel** for image and content carousels in the interface

### Development and Build Tools
- **Vite** - Fast build tool and development server with Hot Module Replacement
- **TypeScript** - Static type checking and enhanced developer experience
- **ESBuild** - Fast JavaScript bundler for production builds
- **PostCSS** with Autoprefixer for CSS processing and vendor prefixing

### Utility Libraries
- **date-fns** - Modern JavaScript date utility library for date manipulation and formatting
- **clsx** and **tailwind-merge** - Conditional CSS class composition utilities
- **class-variance-authority** - Type-safe component variant management
- **Zod** - TypeScript-first schema validation with static type inference
- **nanoid** - URL-safe unique string ID generator

### UI and Design Dependencies
- **Lucide React** - Feature-rich icon library with consistent design system
- **CMDK** - Command palette component for advanced user interactions
- **Vaul** - Drawer component library for mobile-friendly interfaces

### Session and Authentication
- **connect-pg-simple** - PostgreSQL session store for Express.js applications ensuring scalable session management across multiple server instances
# BODYCRAFT Master Data Management (MDM) System

## Overview

The BODYCRAFT Master Data Management (MDM) System is a web application for managing IT assets across 32 retail outlets in India. It centralizes asset management, employee tracking, and location-based operations, replacing manual tracking with a system that includes complete audit trails, asset assignment management, and integration with CCTV and biometric systems. The system aims to be a single source of truth, ensuring data integrity through historical preservation and comprehensive logging.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Phase 2: AI-Powered Compliance Automation (October 2025)

- **AI Orchestrator Service**: OpenAI GPT-4o-mini integration for automated compliance task generation, risk scoring, and intelligent assignment optimization
- **Backup Verification Engine**: Automated backup health monitoring with signal generation for failures
- **Automation Dashboard**: Three-tab analytics interface (Overview, AI Automation, Backup Verification) with real-time statistics
- **9 Automation APIs**: Full REST API suite for triggering automation, fetching risk insights, predictive alerts, backup verification, and AI recommendations
- **Type-Safe Implementation**: Strongly-typed interfaces for all automation data (AutomationSummary, RiskInsight, PredictiveAlert, AIRecommendation, BackupVerification)
- **Comprehensive Cache Invalidation**: All automation-related queries refresh after automation runs
- **Advanced UI Components**:
  - Risk Insights Cards: Visual cards showing compliance risks by location with severity indicators
  - Predictive Alerts Timeline: Chronological visualization of upcoming compliance events with countdown timers
  - AI Recommendations Drawer: Slide-out panel for detailed AI-generated recommendations with apply/dismiss actions
  - Backup Verification Table: Comprehensive backup health monitoring with status indicators and verification times

## System Architecture

### Frontend

- **React 18** with TypeScript
- **Vite** for building
- **Wouter** for routing
- **TanStack Query** for server state
- **Shadcn/ui** (built on Radix UI) for components
- **Tailwind CSS** for styling

### Backend

- **Node.js** with Express.js for RESTful APIs
- **TypeScript** for type safety
- **Zod** for runtime schema validation
- **Modular storage interface**
- **Session-based architecture** with PostgreSQL session store

### Data Storage

- **PostgreSQL** (Neon serverless hosting)
- **Drizzle ORM** for type-safe queries
- **Historical data preservation** and **comprehensive audit trails**
- **Multi-tenant data isolation** for 32 locations

### Authentication and Authorization

- **Session-based authentication** using `connect-pg-simple`
- **Role-based access control (RBAC)** with location-based isolation
- **Three-tier permission model**: Super Admin, Admin, Location User
- **Location-based data filtering** for complete isolation
- **Pre-update authorization** to prevent unauthorized cross-location changes

### Design System

- Modern design inspired by Canva and Figma
- **Dual theme support** (light/dark) with purple branding
- **Responsive design** for all devices
- **Accessibility-first** component library

### Database Schema

Relational model with core entities:

- **Locations**: 32 BODYCRAFT outlets
- **Employees**: Staff with department/designation
- **Assets**: IT equipment with lifecycle management
- **Assignment History**: Immutable records
- **Maintenance Records**: Service and warranty tracking
- **Integration Tables**: CCTV, biometric devices, backups

### API Architecture

- **RESTful endpoints**
- **Consistent error handling**
- **Input validation** using Zod
- **Structured logging**

### RBAC Roles

- **Super Admin (Global)**: Full access to all locations and operations.
- **Admin (Global)**: Full access to all locations and most operations, similar to Super Admin for daily tasks.
- **Location User (Location-Restricted)**: Access only to their assigned location; can manage local assets/employees, but cannot transfer assets/employees cross-location or modify CCTV/biometric systems.

## External Dependencies

### Database Services

- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle Kit**: Database migration and schema management.

### UI Framework

- **Radix UI**: Headless components.
- **Lucide React**: Icon library.
- **Embla Carousel**: Touch-friendly carousel.
- **Class Variance Authority**: Type-safe component variants.

### Development Tools

- **Vite Plugins**: Development enhancements.
- **PostCSS with Autoprefixer**: CSS processing.
- **TypeScript**: Static type checking.

### Google Fonts

- **Inter**: Primary interface font.
- **Plus Jakarta Sans**: Display font.

### Form Management

- **React Hook Form**: Performance-optimized form handling.
- **Hookform Resolvers**: Zod integration for validation.

### Utilities

- **Date-fns**: Date manipulation.
- **clsx and tailwind-merge**: Conditional CSS class management.
- **nanoid**: Unique ID generation.

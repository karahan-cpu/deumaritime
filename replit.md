# Maritime Emissions Calculator

## Overview

A comprehensive web application for calculating and managing maritime regulatory compliance across multiple environmental frameworks. The platform enables ship owners and operators to assess vessel compliance with EEDI (Energy Efficiency Design Index), EEXI (Energy Efficiency Existing Ship Index), CII (Carbon Intensity Indicator), FuelEU Maritime, EU ETS (Emissions Trading System), and GHG Fuel Intensity regulations.

The application provides detailed calculation engines for each regulatory framework, cost analysis tools for compliance penalties, and visualization components for tracking emissions trajectories against regulatory limits. It's designed as a precision-first tool that prioritizes data accuracy and calculation transparency for professional maritime operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript in a Single Page Application (SPA) pattern

**Routing**: Wouter for lightweight client-side routing (currently single-route with Calculator as the main page)

**State Management**: 
- React Hook Form for complex form state with Zod validation
- TanStack Query (React Query) for server state management (configured but minimal API integration currently)
- Local component state with useState for calculator results and UI interactions

**UI Component Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS styling. The design system follows a "New York" style variant with custom color schemes for light/dark modes. Components are highly customizable with class-variance-authority for variant management.

**Design System**:
- Material Design principles adapted for enterprise data applications
- Custom spacing scale using Tailwind units (3, 4, 6, 8, 12)
- Typography: Inter for general UI, JetBrains Mono for numerical displays
- Color system using HSL with CSS custom properties for theme switching
- Elevation system with hover/active states (`hover-elevate`, `active-elevate-2`)

**Form Validation**: Zod schemas defined in shared layer for runtime validation, integrated with React Hook Form via @hookform/resolvers

**Calculation Logic**: Client-side TypeScript functions in `lib/calculations.ts` implementing:
- EEDI/EEXI calculations using ship type-specific reference lines
- CII rating system with A-E grades based on attained vs required values
- FuelEU Maritime GHG intensity calculations with yearly reduction targets
- EU ETS allowance calculations with progressive coverage percentages
- CO2 emission factors for various fuel types (HFO, MDO, LNG, Methanol, etc.)

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js

**Development Setup**: Vite dev server in middleware mode for HMR and fast development experience

**API Structure**: RESTful endpoints (currently minimal scaffolding in `server/routes.ts`)

**Storage Interface**: Abstracted storage layer with in-memory implementation (`MemStorage`) designed for future database integration. Interface defined in `server/storage.ts` with CRUD methods for user management.

**Build Process**: 
- Client: Vite bundling to `dist/public`
- Server: esbuild bundling to `dist/index.js` with ESM output

### Data Storage Solutions

**Current Implementation**: In-memory storage using JavaScript Maps for user data (development/demo mode)

**Planned Database**: PostgreSQL via Neon serverless driver configured in `drizzle.config.ts`

**ORM**: Drizzle ORM with schema definitions in `shared/schema.ts`
- Zod schemas define data shapes and validation rules
- Ship types, fuel types, and input schemas for each regulatory calculator
- Type-safe database operations through Drizzle-Zod integration

**Schema Structure**:
- Ship information (name, type, deadweight, gross tonnage, build year)
- Calculator-specific inputs (EEDI, EEXI, CII, FuelEU, EU ETS)
- Fuel type configurations with CO2 conversion factors

**Migration Strategy**: Drizzle Kit for schema migrations to `./migrations` directory

### Authentication and Authorization

**Current State**: Basic session scaffolding present but not implemented

**Session Management**: connect-pg-simple configured for PostgreSQL-backed sessions (not yet active)

**User Model**: Simple user schema with id, username fields defined in shared schema

### External Dependencies

**UI Component System**:
- Radix UI primitives (@radix-ui/*) - 20+ component primitives for accessible UI
- shadcn/ui configuration for component generation
- Tailwind CSS for utility-first styling
- class-variance-authority for component variant management

**Charts and Visualization**:
- Recharts for data visualization (GHG intensity trajectory chart)
- Custom chart components wrapping Recharts primitives

**Form Management**:
- React Hook Form for complex form state
- @hookform/resolvers for Zod integration

**Development Tools**:
- Vite with React plugin for build and dev server
- TypeScript for type safety across client/server/shared code
- esbuild for server bundling in production

**Fonts**:
- Google Fonts (Inter, JetBrains Mono) loaded from CDN

**Database** (configured but not active):
- @neondatabase/serverless for PostgreSQL connection
- Drizzle ORM for type-safe database queries

**Key Libraries**:
- date-fns for date manipulation
- clsx + tailwind-merge for className composition
- nanoid for unique ID generation
- wouter for routing

**Replit-Specific**:
- @replit/vite-plugin-runtime-error-modal for error overlays
- @replit/vite-plugin-cartographer for development insights
- @replit/vite-plugin-dev-banner for development mode indicator
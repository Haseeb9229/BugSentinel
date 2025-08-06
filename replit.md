# Replit.md

## Overview

This is a full-stack Shopify app called "Bug Patrol" that provides QA and site monitoring services for Shopify stores. The application monitors store health, tracks bugs, performs site scans, measures performance metrics, and provides alerting capabilities. It's built with a modern tech stack using TypeScript throughout, featuring a React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database.

**Current Status**: Demo/prototype version with functional dashboard, multi-page navigation, and database integration. Ready for Shopify App Bridge integration and real store scanning implementation.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (July 28, 2025)

- ✅ Created complete multi-page application with working navigation
- ✅ Implemented PostgreSQL database with demo data initialization
- ✅ Built Dashboard, Bug Reports, Performance, and Admin Panel pages
- ✅ Fixed all TypeScript errors and routing issues
- ✅ Added comprehensive Shopify integration documentation
- ✅ Working sidebar navigation with active state highlighting
- ✅ Enhanced database schema with new tables: uptime_monitoring, theme_changes, app_installations, subscriptions
- ✅ Restructured admin portal for app owners (revenue, store management, system metrics)
- ✅ Created Store Monitoring page with uptime tracking, theme file changes, and app installation monitoring
- ✅ Added Alert Management and Settings pages with complete configuration options
- ✅ Separated customer portal (store owners) from admin portal (app owners) architecture
- ✅ Built comprehensive admin portal with 8 dedicated pages: Dashboard, Customers, Stores, Scans, Subscriptions, Analytics, Revenue, System Logs
- ✅ Implemented scalable admin navigation system with detailed management features
- ✅ Added backend API endpoints for uptime monitoring, theme changes, and app installation tracking
- ✅ Enhanced admin sidebar with proper portal detection and context-aware branding
- ✅ Fixed all broken navigation buttons across admin portal (View Details, Contact, Run Scan, Manage, View Invoice, Retry Payment)
- ✅ Completed comprehensive Analytics Dashboard with revenue metrics, customer insights, and performance tracking
- ✅ Enhanced Revenue page with functional invoice viewing and payment retry capabilities
- ✅ Added detailed analytics including plan distribution, issue tracking, and growth metrics
- ✅ Implemented Slack integration for real-time notifications and alerts
- ✅ Created playful onboarding animation to welcome new users with store-specific messaging
- ✅ Built one-click screenshot capture and annotation tool for bug reporting
- ✅ Added authentication screens for both admin and customer portals with demo credentials
- ✅ Integrated framer-motion for smooth animations and better user experience
- ✅ Fixed all broken functionality: settings save buttons, admin panel actions, navigation buttons
- ✅ Added functional email/Slack notification settings with proper form validation
- ✅ Implemented working admin functions: view store details, run scans, contact customers, cancel subscriptions
- ✅ Enhanced customer portal with upgrade plan functionality and billing management
- ✅ Created comprehensive Shopify deployment guide for production launch
- ✅ Ready for Shopify App Store submission with OAuth, App Bridge, and real scanning implementation
- ✅ Built complete Vercel deployment pipeline with Dev/Staging/Production environment management
- ✅ Created step-by-step deployment guides and environment configuration files
- ✅ Documented Shopify Billing API integration requirements and implementation strategy
- ✅ Created billing service architecture with subscription management and usage tracking

## App Architecture Types

### Current Demo Mode
- **Purpose**: Demonstration of UI/UX for store owners after app installation
- **Audience**: Store owners who have installed the app
- **Data**: Demo store with sample bugs, scans, and performance metrics
- **Access**: Customer portal with authentication (demo credentials: any store name + password)
- **Features**: Onboarding animation, screenshot tool, dashboard monitoring

### Admin Panel (Complete)
- **Purpose**: App developer's view to manage all store installations
- **Audience**: Bug Patrol app developers/administrators
- **Features**: Store management, system health, installation tracking, revenue analytics
- **Access**: /admin route with authentication (admin@bugpatrol.app / admin123)
- **Integration**: Slack notifications for system alerts and monitoring

### Production Shopify Integration (Ready)
- **Installation**: OAuth flow through Shopify App Store
- **Embedding**: Shopify App Bridge integration in admin dashboard
- **Multi-tenant**: Support for multiple store installations
- **Real scanning**: Lighthouse API + Puppeteer for actual website monitoring
- **Authentication**: Complete auth flows for both portals

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared code:

- **Frontend**: React with TypeScript, using Vite for build tooling
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing

## Key Components

### Frontend Architecture
- **Component Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom Shopify-themed color palette
- **State Management**: TanStack Query for API data fetching and caching
- **Build Tool**: Vite with React plugin and custom alias configuration
- **Development**: Hot module replacement and runtime error overlay

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database Layer**: Drizzle ORM with Neon serverless PostgreSQL
- **API Design**: RESTful endpoints following conventional patterns
- **Error Handling**: Centralized error middleware
- **Logging**: Custom request/response logging middleware

### Database Schema
The database includes these main entities:
- **stores**: Shopify store information and metadata
- **bugs**: Issue tracking with severity levels and status
- **scans**: Site scanning results and history
- **performanceMetrics**: Core Web Vitals and performance data
- **alertSettings**: User notification preferences

## Data Flow

1. **Dashboard Data**: The main dashboard aggregates data from multiple tables to show store health, active issues, recent scans, and performance metrics
2. **Bug Tracking**: Issues are categorized by severity (critical, warning, info) and type (broken_link, js_error, performance, missing_image)
3. **Scanning**: Different scan types (full_site, performance, link_validation) track progress and results
4. **Performance Monitoring**: Core Web Vitals (LCP, FCP, CLS) are tracked with scoring
5. **Alerting**: Configurable email and Slack notifications based on user preferences

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Drizzle ORM**: Type-safe database queries with migration support
- **Connection Pooling**: Using Neon's connection pooling for scalability

### UI Components
- **Radix UI**: Headless UI primitives for accessibility
- **shadcn/ui**: Pre-built component library
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety across the stack
- **ESBuild**: Fast bundling for production builds

## Deployment Strategy

The application is configured for deployment with:

- **Build Process**: Vite builds the frontend, ESBuild bundles the backend for Node.js
- **Environment Variables**: Database connection via DATABASE_URL
- **Static Assets**: Frontend builds to `dist/public`, served by Express in production
- **Development**: Vite dev server with Express API proxy
- **Database Migrations**: Drizzle Kit for schema management

The app supports both development and production modes with appropriate middleware and static file serving configuration.
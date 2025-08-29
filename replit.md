# Overview

CourseHub is a multilingual online course marketplace specifically designed for the Somali market. The application allows users to browse, purchase, and download digital courses using local payment methods including EVC Plus, ZAAD, and eDahab. The platform supports three languages (Somali, English, and Arabic) and features a modern, responsive design built with React and Express.

The system is designed as a complete e-commerce solution with course catalog management, payment processing, and digital file delivery. It includes a demo mode for testing and development, with production-ready payment integration capabilities through WaafiPay and the evc-plus library.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client-side is built using **React 18** with **TypeScript** and follows a modern component-based architecture:

- **Routing**: Uses Wouter for lightweight client-side routing with support for multi-language URL patterns
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS styling
- **Internationalization**: Custom i18n implementation supporting Somali (default), English, and Arabic with RTL support
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

The frontend follows a pages-and-components structure with shared UI components, custom hooks for business logic, and utility libraries for common functionality.

## Backend Architecture

The server-side uses **Express.js** with **TypeScript** and implements a RESTful API design:

- **Database Layer**: Drizzle ORM with PostgreSQL support, configured for connection to Neon Database
- **Storage Strategy**: Dual implementation with in-memory storage for development and database storage for production
- **Payment Processing**: Abstracted payment service with WaafiPay integration using the evc-plus library
- **File Serving**: Static file delivery for course materials stored in the public directory
- **Session Management**: Express sessions with PostgreSQL session store

The backend uses a modular approach with separate concerns for routing, storage, and business logic.

## Data Storage Solutions

**Database**: PostgreSQL as the primary database with two main entities:
- **Courses**: Multilingual content with JSON fields for title/description in all supported languages
- **Payments**: Transaction records with support for different payment methods and status tracking

**Schema Design**: Uses Drizzle ORM with type-safe schema definitions and automatic TypeScript type generation. The schema supports multilingual content through JSON fields and maintains referential integrity between courses and payments.

**Migration Strategy**: Drizzle Kit handles database migrations with schema versioning stored in the migrations directory.

## Authentication and Authorization

The current implementation uses a simplified access control model:
- **Course Access**: Based on successful payment verification using phone number and course ID
- **Payment Verification**: Server-side validation of payment status before allowing file downloads
- **Session Management**: Basic session handling for maintaining user state during purchase flow

## Payment Integration Architecture

**WaafiPay Integration**: Production-ready integration with Somalia's leading payment processor supporting:
- EVC Plus mobile wallet payments
- ZAAD mobile money transfers  
- eDahab digital wallet transactions
- International card payments via hosted checkout

**Demo Mode**: Configurable demo mode for development and testing that simulates payment processing without actual transactions.

**Payment Flow**: Multi-step process with payment initiation, status verification, and automatic course access granting upon successful completion.

# External Dependencies

## Payment Services
- **WaafiPay**: Primary payment processor for Somalia market with hosted checkout and API integration
- **evc-plus**: Node.js library for WaafiPay integration handling mobile wallet payments

## Database and Hosting
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Vercel/Render/Netlify**: Deployment targets for serverless hosting

## UI and Development Tools
- **Radix UI**: Headless component library for accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Shadcn/ui**: Pre-built component library combining Radix UI with Tailwind styling
- **Vite**: Modern build tool with hot module replacement for development

## Core Libraries
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling with performance optimization
- **Zod**: Runtime type validation and schema validation
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL support
- **Wouter**: Lightweight routing library for React applications
# Eras Studio - Backend Architecture & Security Report

This document provides a comprehensive technical breakdown of the Eras Studio backend architecture, data flow, and security model. It is designed to help you explain the technical decisions, structure, and security posture of the platform to technical stakeholders.

---

## 1. Architecture Overview: Next.js + Supabase (Serverless BaaS)

Unlike traditional Node.js/Express monolithic or microservice backends (as outlined in traditional `backend-dev-guidelines`), Eras Studio utilizes a modern **Serverless Backend-as-a-Service (BaaS)** architecture. 

**Stack:**
*   **Framework**: Next.js 15 (App Router)
*   **Backend/Database**: Supabase (PostgreSQL)
*   **Data Fetching**: Next.js Server Actions (`'use server'`)
*   **Authentication**: Supabase Auth (JWT-based)

**Why this architecture?**
It eliminates the need for a separate middleware API layer (like Express). Instead, backend logic is securely executed in serverless functions (Next.js Server Actions) that communicate directly with the Supabase PostgreSQL database. This reduces latency, eliminates API boilerplate, and radically accelerates development while remaining highly scalable.

---

## 2. Security Model (Addressing `backend-security-coder` & Architect Guidelines)

Because we don't have a traditional Express API gateway, our security is enforced at the **Database Edge** and **Serverless Edge**.

### A. Row Level Security (RLS)
This is the absolute core of our security model. Instead of writing authorization logic in JavaScript (e.g., `if (user.id !== resource.owner_id) throw Error`), security policies are written directly into the PostgreSQL database.
*   **How it works**: Every query made to Supabase includes the user's JWT. PostgreSQL automatically intercepts the query and applies RLS policies.
*   **Example**: `CREATE POLICY "Users can edit their own artworks" ON artworks FOR UPDATE USING (auth.uid() = creator_id);`
*   **Benefit**: Even if a developer accidentally writes a vulnerable Server Action or exposes an endpoint, the database itself will reject unauthorized queries. It acts as an impenetrable Zero-Trust data layer.

### B. Server Actions Security
*   **CSRF Protection**: Next.js Server Actions are inherently protected against Cross-Site Request Forgery (CSRF) via encrypted action IDs and host origin checking built into the Next.js framework.
*   **Data Mutation**: All database mutations (inserts, updates) happen strictly on the server side via files in the `src/actions/` directory, keeping database keys completely hidden from the client.

### C. Authentication & Authorization
*   Session management is handled via secure, HTTP-only cookies managed by `@supabase/ssr`.
*   Role-Based Access Control (RBAC) is implemented via the `role` column in the `profiles` table (`Creator` vs `Collector`), which dictates UI access and database write privileges.

---

## 3. Directory & File Structure

The backend logic is tightly integrated into the Next.js App Router structure:

*   **`supabase/schema.sql`**: The single source of truth for the database schema. This contains all table definitions, triggers, and Row Level Security (RLS) policies.
*   **`src/actions/`**: This directory acts as our "Controllers" and "Services". Files here (e.g., `chatActions.ts`, `authActions.ts`, `profileActions.ts`, `notificationActions.ts`) are marked with `'use server'` and contain the secure backend logic.
*   **`src/lib/supabase/`**: Contains the client and server initializers for the Supabase SDK (`client.ts`, `server.ts`).
*   **`src/types/database.ts`**: TypeScript definitions automatically generated from the Supabase schema, ensuring end-to-end type safety between the database and the frontend.

---

## 4. Addressing the Provided Skill Guidelines

You provided guidelines covering `backend-architect`, `backend-dev-guidelines`, and `backend-security-coder`. Here is how our architecture maps to those concepts:

### Deviations from `backend-dev-guidelines`
The guidelines describe a traditional layered architecture (`Routes -> Controllers -> Services -> Repositories -> Database`). 
*   **Our approach**: We collapse `Routes` and `Controllers` into **Next.js Server Actions**. We collapse `Repositories` into the **Supabase SDK client**. We push business logic into either the Server Action or the Database itself (via Postgres Functions and Triggers). This is the standard best practice for Next.js App Router apps and is much more efficient than standing up a separate Express server.

### Alignment with `backend-architect`
*   **Event-Driven / Async**: We implemented real-time event-driven architecture using Supabase Realtime (PostgreSQL Logical Replication) for features like the `NotificationBell`.
*   **Statelessness**: Next.js Server Actions are completely stateless, allowing for infinite horizontal scaling on platforms like Vercel.
*   **Resilience**: By using Supabase (a managed Postgres service), we rely on their built-in connection pooling (PgBouncer), automated backups, and global CDN caching.

---

## 5. Summary for Technical Stakeholders

If the tech lead asks for a summary of the backend, you can confidently state:

> *"Eras Studio utilizes a modern Serverless architecture powered by Next.js App Router and Supabase. We bypass traditional, high-maintenance REST APIs (like Express) in favor of Next.js Server Actions, which gives us end-to-end type safety and lower latency. Security is enforced using a Zero-Trust model at the database level via PostgreSQL Row Level Security (RLS), ensuring data isolation regardless of the application layer. Real-time features (like messaging and notifications) are powered by Supabase Realtime using WebSockets connected directly to PostgreSQL logical replication."*

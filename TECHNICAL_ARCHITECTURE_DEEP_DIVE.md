# Eras Studio: Technical Architecture & Security Deep Dive

This document serves as an exhaustive technical reference for the Eras Studio application. It is intended for senior engineers, technical leads, and security auditors to understand the complete architectural landscape, data flows, and security measures implemented in the platform.

---

## 1. High-Level Architectural Paradigm

The Eras Studio application departs from legacy decoupled architectures (e.g., separate React SPA + Express REST API) in favor of a **Serverless Full-Stack Framework (Next.js)** paired with a **Backend-as-a-Service (Supabase)**. 

### Why This Paradigm?
1.  **Reduced Network Churn**: By collocating data fetching on the server (via React Server Components and Server Actions), we eliminate client-to-server HTTP API overhead.
2.  **Type Safety**: End-to-end TypeScript safety is guaranteed from the database schema up to the DOM.
3.  **Horizontal Scalability**: Serverless infrastructure scales automatically based on request volume without the need to manage EC2 instances or Kubernetes clusters.

---

## 2. The Tech Stack Breakdown

### Frontend & Server Layer: Next.js 15 (App Router)
*   **React Server Components (RSC)**: Used for all non-interactive UI elements. RSCs fetch data directly from the database on the server, sending zero JavaScript bundle to the client, drastically improving Core Web Vitals (LCP, TTI).
*   **Client Components**: Used strictly for interactive elements (e.g., `<NotificationBell />`, forms, modals). Marked with `'use client'`.
*   **Server Actions**: Asynchronous functions executed on the server, marked with `'use server'`. They replace traditional `POST/PUT/DELETE` API routes.
*   **Styling**: Tailwind CSS v4 configured for a bespoke "Gallery Editorial" design system.

### Database & Auth Layer: Supabase
Supabase is an open-source Firebase alternative powered by Enterprise-grade open-source tools:
*   **PostgreSQL 15**: The core database.
*   **GoTrue**: Manages user authentication and issues JWTs.
*   **PostgREST**: Automatically turns the PostgreSQL database into a RESTful API.
*   **Realtime**: An Elixir server that listens to PostgreSQL logical replication streams and broadcasts changes via WebSockets.

---

## 3. Data Flow & Inter-Service Communication

### Data Fetching (Read Operations)
1.  A user navigates to a dashboard route (e.g., `/discovery`).
2.  The Next.js Server Component securely initializes a Supabase Server Client (`createClient()`).
3.  The client executes a query against the Supabase PostgREST API.
4.  The PostgreSQL database intercepts the query and evaluates **Row Level Security (RLS)** against the user's JWT.
5.  Data is returned, HTML is rendered on the server, and the static HTML is streamed to the client.

### Data Mutations (Write Operations)
1.  The user submits a form on the client.
2.  The form invokes a Next.js **Server Action** (e.g., `createChatSession` in `chatActions.ts`).
3.  Next.js transparently handles the HTTP POST request (protected by built-in CSRF tokens).
4.  The Server Action runs secure backend logic, validates inputs, and issues an `INSERT`/`UPDATE` to Supabase.
5.  Supabase executes the SQL transaction, applying RLS.
6.  The Server Action calls `revalidatePath()` to purge the Next.js cache and update the UI instantly.

### Realtime Events (WebSockets)
Components like the `NotificationBell` require instant updates without polling:
1.  The client initializes a Supabase JS client.
2.  It subscribes to PostgreSQL changes: `.channel('notifications').on('postgres_changes', ...)`.
3.  When a Server Action inserts a row into the `notifications` table, PostgreSQL logical replication broadcasts the row change to the Realtime Elixir server.
4.  The Elixir server pushes the event to the connected WebSocket, updating the React state immediately.

---

## 4. Deep Dive: Security Model & Threat Mitigation

Our architecture fundamentally addresses the security concerns outlined in standard `backend-security-coder` guidelines through infrastructure-level enforcement.

### A. Zero-Trust Database via Row Level Security (RLS)
In a traditional Node.js API, authorization is implemented via application logic (e.g., checking if `req.user.id === resource.ownerId`). This is prone to human error.
In Eras Studio, **RLS policies act as an unbypassable firewall directly at the PostgreSQL kernel level**.

*   **Example Policy (Profiles)**: 
    ```sql
    CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);
    ```
    Even if a developer accidentally exposes an insecure Server Action, the database will return an empty result or throw a permission error because the JWT inside the connection pool does not match the row's `id`.

### B. OWASP Top 10 Mitigation
1.  **SQL Injection (SQLi)**: Completely mitigated. Supabase PostgREST utilizes parameterized queries via the underlying PostgREST Haskell server. Developers never write raw SQL strings in the application layer.
2.  **Cross-Site Request Forgery (CSRF)**: Mitigated by Next.js. Server Actions automatically generate and validate encrypted action IDs and enforce strict Origin/Host header checking.
3.  **Cross-Site Scripting (XSS)**: Mitigated by React's built-in DOM escaping mechanisms.
4.  **Broken Access Control**: Mitigated by RLS (see above).
5.  **Sensitive Data Exposure**: All traffic is encrypted over TLS 1.3. JWTs are stored in secure, `HttpOnly`, `SameSite=Lax` cookies, preventing JavaScript access and XSS theft.

---

## 5. File Structure & Domain Boundaries

Our repository strictly follows domain-driven feature boundaries while adhering to Next.js App Router conventions:

```text
eras-app/
├── src/
│   ├── app/                    # Next.js App Router (Routes & Layouts)
│   │   ├── (auth)/             # Route Group: Login, Signup, Callback
│   │   ├── (dashboard)/        # Route Group: Protected authenticated layouts
│   │   └── (public)/           # Route Group: Landing pages
│   ├── actions/                # Domain-driven Server Actions (Mutations)
│   │   ├── authActions.ts      # Authentication logic
│   │   ├── chatActions.ts      # Chat and Inquiry state machines
│   │   └── profileActions.ts   # Freemium logic & profile mutations
│   ├── components/             
│   │   ├── features/           # Complex, domain-specific components (e.g., NotificationBell)
│   │   └── ui/                 # Reusable, stateless UI primitives (Buttons, Inputs)
│   ├── lib/                    
│   │   ├── supabase/           # Client/Server initializers
│   │   └── freemium/           # Business logic isolated from routing
│   └── types/                  
│       └── database.ts         # Autogenerated TS types matching PG Schema
└── supabase/
    └── schema.sql              # The single source of truth for the database
```

---

## 6. Business Logic: Freemium Implementation

To demonstrate how complex business logic is handled without a traditional API, consider the Freemium feature:
1.  **Logic Isolation**: The `checkFreemiumStatus` function lives in `src/lib/freemium/check.ts`. It calculates time elapsed since account creation and counts active artworks.
2.  **Server Execution**: It executes strictly on the server to prevent client-side tampering.
3.  **UI Enforcement**: The UI checks this status and selectively disables the `ArtworkUploadForm` upload button.
4.  **Persistent Notifications**: A persistent, un-dismissible upgrade notification is artificially injected into the WebSocket notification stream on the client side if the server declares the user account as "Locked."

---

## 7. Future Scalability Considerations

*   **Caching**: As traffic scales, Next.js Full Route Cache and Data Cache can be heavily leveraged to serve static HTML globally via CDN, offloading read pressure from the database.
*   **Database Migrations**: `schema.sql` can be migrated to Supabase's formal migration system (`supabase db diff`) for strict CI/CD integration.
*   **Storage**: Artwork images are currently handled via URL links; native Supabase Storage buckets can be provisioned with their own RLS policies to restrict high-res image access to verified purchasers.

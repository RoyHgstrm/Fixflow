# FixFlow Application

## 🏢 Company Overview

FixFlow is a professional SaaS platform designed to streamline operations for cleaning, maintenance, and small repair businesses in Finland. It offers robust features for job scheduling, customer tracking, billing, invoicing, and team collaboration, aiming to boost productivity and customer satisfaction.

## ✨ Features

*   **Comprehensive Scheduling:** Efficiently manage and track job schedules.
*   **Customer Relationship Management:** Track customer information and interactions.
*   **Billing & Invoicing:** Generate and manage invoices, track payments.
*   **Team Collaboration:** Tools for effective team management and communication.
*   **Role-Based Access Control (RBAC):** Secure access based on user roles (Owner, Manager, Employee, Client).
*   **Responsive Design:** Mobile-friendly and intuitive user interface.

## 🚀 Technology Stack

FixFlow is built with a modern, type-safe, and performant technology stack:

### Frontend
*   **Framework:** [Next.js 14 (App Router)](https://nextjs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) + CSS Modules
*   **UI Components:** [Radix UI](https://www.radix-ui.com/) primitives (likely via Shadcn/UI)
*   **Animation:** [Framer Motion](https://www.framer.com/motion/)
*   **State Management:** React Context + `useReducer` (for global state)
*   **Data Fetching:** [@tanstack/react-query](https://tanstack.com/query/latest)

### Backend
*   **API Layer:** [tRPC](https://trpc.io/) (Type-safe RPCs)
*   **Runtime:** [Node.js 18+](https://nodejs.org/)
*   **ORM:** [Prisma 5](https://www.prisma.io/)
*   **Database:** [PostgreSQL](https://www.postgresql.org/)

### Authentication
*   **Provider:** [Supabase Auth](https://supabase.com/docs/guides/auth) (custom session provider using HTTP-only cookies)
*   **Security:** Row-Level Security (RLS) in PostgreSQL

### Testing
*   **Unit Testing:** [Vitest](https://vitest.dev/)
*   **End-to-End Testing:** [Playwright](https://playwright.dev/)

### Code Quality & Tooling
*   **Linting:** [ESLint](https://eslint.org/) (with `@typescript-eslint` and Next.js plugins)
*   **Formatting:** [Prettier](https://prettier.io/)
*   **Schema Validation:** [Zod](https://zod.dev/)
*   **Type Safety:** Strict TypeScript configuration, aiming for zero `any` types.

## ⚙️ Setup and Installation

To get the FixFlow application up and running locally, follow these steps:

### Prerequisites

*   Node.js (v18 or higher)
*   npm or Yarn
*   Docker (for local PostgreSQL and Supabase setup)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fixflow-app
```

### 2. Environment Variables

Create a `.env` file in the project root based on `.env.example`. You will need to configure your Supabase URL and Anon Key, and a database connection string.

```
# .env.example
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL="postgresql://user:password@localhost:5432/fixflow_db"
```

### 3. Database Setup (with Docker)

Start your local PostgreSQL database and Supabase services using Docker Compose:

```bash
docker-compose up -d
```

Run Prisma migrations to set up your database schema:

```bash
npx prisma migrate dev --name init
```

### 4. Install Dependencies

```bash
npm install
# or
yarn install
```

### 5. Generate Secret (if needed)

If you need to generate a new secret for your application (e.g., for JWTs), you can use the provided script:

```bash
npm run generate:secret
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🧪 Running Tests

### Unit Tests (Vitest)

```bash
npm test
# or for coverage
npm run test:coverage
```

### End-to-End Tests (Playwright)

```bash
npx playwright test
```

## 🧹 Linting and Type Checking

To ensure code quality and type safety:

```bash
npm run lint
npm run typecheck
```

## 🏗️ Building for Production

```bash
npm run build
```

This will create an optimized production build in the `.next` directory.

## 🤝 Contributing

We welcome contributions! Please refer to `rules.md` for project guidelines and `todo.md` for current tasks and priorities.

## 📄 License

[Specify your license here, e.g., MIT, Apache 2.0, etc.]
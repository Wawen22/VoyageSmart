# Tech Stack: Voyage-Smart

## Core Technologies
*   **Framework:** Next.js 15 (with App Router)
*   **Language:** TypeScript
*   **Database & Auth:** Supabase (PostgreSQL, Auth, Storage)
*   **Styling:** Tailwind CSS with PostCSS.
*   **UI Components:** A hybrid approach using:
    *   **Radix UI:** For unstyled, accessible primitive components.
    *   **Material-UI (MUI):** For a comprehensive set of pre-styled components.
    *   **shadcn/ui convention:** `lucide-react` for icons, `tailwind-merge`, and `clsx` suggest a `shadcn/ui`-like pattern for component building.
*   **Animations:** Framer Motion

## Development & Tooling
*   **Package Manager:** npm
*   **State Management:** Redux Toolkit
*   **Testing:**
    *   **Unit/Integration:** Jest with React Testing Library.
    *   **End-to-End (E2E):** Playwright.
*   **Linting & Formatting:** ESLint and Prettier.
*   **Deployment:** Vercel (manual deployments from the `main` branch).
*   **Local Development:** Run the app with `npm run dev`. The application starts on port 3002.

## Key Dependencies & Integrations
*   **Payments:** `stripe` and `@stripe/stripe-js` for subscription management and payments.
*   **AI:**
    *   `@google/generative-ai` for integration with Google Gemini.
    *   `openai` for integration with OpenAI models.
*   **Mapping:** `mapbox-gl` for interactive maps.
*   **Rich Text Editor:** `tiptap` for advanced text editing capabilities (likely for the journal feature).
*   **Calendar/Scheduling:** `react-big-calendar` for displaying and managing events.
*   **Form Validation:** `zod` for schema-based validation.
*   **Email:** `resend` for transactional emails.
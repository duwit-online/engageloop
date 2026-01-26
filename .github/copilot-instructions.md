# GitHub Copilot Instructions for Engage Capsule Flow

## Project Overview
This project is built using **Vite**, **TypeScript**, **React**, and **Tailwind CSS**. It is structured to facilitate modular development with clear separation of concerns across components, contexts, and pages.

## Architecture
- **Components**: Located in the `src/components` directory, these are reusable UI elements. For example, `CapsuleBadge.tsx` and `CurrencySelector.tsx` are key components that handle specific UI functionalities.
- **Pages**: The `src/pages` directory contains the main application views, such as `PricingManager.tsx` and `PaymentsManager.tsx`, which manage the respective functionalities of pricing and payment processing.
- **Contexts**: Shared state management is handled through context providers in the `contexts` directory, such as `AppContext.tsx`.
- **Integrations**: External services are integrated through the `supabase` directory, which contains functions for user verification and payment processing.

## Developer Workflows
- **Development**: Use the command `npm run dev` to start the development server with hot reloading.
- **Building**: To create a production build, run `npm run build`. This compiles the application for deployment.
- **Linting**: Ensure code quality by running `npm run lint` to check for linting errors.

## Project-Specific Conventions
- **State Management**: Use React hooks for managing local state and context for global state. For example, `useAdminData.ts` is used to fetch and manage admin-related data.
- **Error Handling**: Use `toast` notifications for user feedback on actions, such as adding or updating packages in `PricingManager.tsx`.

## Integration Points
- **Supabase**: The project uses Supabase for backend services, including user authentication and database management. Functions like `verify-username` handle user verification through external APIs.
- **Payment Processing**: The `PaymentsManager.tsx` page manages payment configurations and instructions for users, integrating with external payment services.

## External Dependencies
- **Radix UI**: Utilized for accessible UI components, such as dialogs and switches.
- **Hook Form Resolvers**: Used for form validation and management, particularly in forms related to payments and package management.

## Key Files/Directories
- **[src/components](src/components)**: Contains reusable UI components.
- **[src/pages](src/pages)**: Contains main application views and logic.
- **[supabase/functions](supabase/functions)**: Contains serverless functions for backend operations.
- **[README.md](README.md)**: Provides an overview of the project, setup instructions, and deployment guidelines.

## Conclusion
This document serves as a guide for AI coding agents to understand the structure and workflows of the Engage Capsule Flow project. For further details, refer to the specific files and directories mentioned above.
# AI Studio Application Rules

This document outlines the technical stack and guidelines for using libraries within this application, ensuring consistency and maintainability.

## Tech Stack Description

*   **Frontend Framework**: React (version ^19.2.0) is used for building dynamic and interactive user interfaces.
*   **Language**: TypeScript (~5.8.2) is employed across the codebase for type safety, improved code quality, and better developer tooling.
*   **Styling**: Tailwind CSS (version ^4.1.14) is the exclusive utility-first CSS framework for all styling, ensuring responsive and consistent design.
*   **Build Tool**: Vite (version ^6.2.0) serves as the build tool, providing a fast development server and optimized production builds.
*   **AI Integration**: The Google Gemini API, accessed via the `@google/genai` (version ^1.22.0) package, powers AI-driven features like content suggestions and summaries.
*   **Icons**: The `lucide-react` package is available for incorporating scalable and customizable vector icons.
*   **UI Library**: `shadcn/ui` components are pre-installed and available for use, offering a collection of accessible and customizable UI primitives.
*   **View Management**: Navigation between different dashboards is currently handled by a custom state-based view switching mechanism within `App.tsx`.

## Library Usage Rules

To maintain a clean and efficient codebase, please adhere to the following rules when developing:

*   **UI Components**:
    *   For common UI elements like buttons, input fields, and text areas, reuse the existing custom components found in `src/components/`.
    *   For any new UI elements or complex interactions, **always prioritize using components from `shadcn/ui`**. If a suitable `shadcn/ui` component does not exist, create a new custom component in `src/components/`.
*   **Styling**:
    *   **All styling must be done using Tailwind CSS classes**. Avoid inline styles or separate CSS files unless absolutely necessary for specific third-party component overrides.
    *   Ensure all designs are responsive by utilizing Tailwind's responsive utility classes.
*   **State Management**:
    *   Use React's built-in `useState` and `useEffect` hooks for managing component-level state and handling side effects.
*   **API Interaction**:
    *   All interactions with the Google Gemini API should be encapsulated within the `src/services/geminiService.ts` file.
*   **Icons**:
    *   When icons are required, use components provided by the `lucide-react` library.
*   **Routing**:
    *   The application currently uses a state-based approach for view management. If more complex routing is needed in the future, `react-router-dom` should be introduced, with routes defined in `src/App.tsx`.
*   **File Structure**:
    *   New React components should be created as separate files within the `src/components/` directory.
    *   New pages should reside in the `src/pages/` directory.
    *   Utility functions and service integrations should be placed in `src/services/` or `src/utils/`.
    *   All directory names must be lowercase.
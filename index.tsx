import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './src/index.css'; // Import the new Tailwind CSS file
import { SessionContextProvider } from './src/components/SessionContextProvider'; // Import SessionContextProvider
// Removed: import '@supabase/auth-ui-react/dist/assets/index.css'; // This import is not needed as styling is handled by ThemeSupa

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SessionContextProvider> {/* Wrap App with SessionContextProvider */}
      <App />
    </SessionContextProvider>
  </React.StrictMode>
);
"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-900 p-4">
      <div className="w-full max-w-md bg-stone-800 p-8 rounded-xl shadow-lg border border-stone-700">
        <div className="flex flex-col items-center mb-6">
          <span className="text-4xl mb-2" role="img" aria-label="sprout">🌿</span>
          <h1 className="text-3xl font-bold text-emerald-500">Branch</h1>
          <p className="text-stone-300 mt-2 text-center">Your Accountability Companion</p>
        </div>
        <Auth
          supabaseClient={supabase}
          providers={[]} // You can add 'google', 'github', etc. here if you configure them in Supabase
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#059669', // emerald-600
                  brandAccent: '#047857', // emerald-700
                  brandButtonText: 'white',
                  defaultButtonBackground: '#292524', // stone-800
                  defaultButtonBackgroundHover: '#44403c', // stone-700
                  defaultButtonBorder: '#57534e', // stone-600
                  defaultButtonText: '#d6d3d1', // stone-300
                  inputBackground: '#1c1917', // stone-900
                  inputBorder: '#57534e', // stone-600
                  inputBorderHover: '#78716c', // stone-500
                  inputBorderFocus: '#059669', // emerald-600
                  inputText: '#f5f5f4', // stone-100
                  inputLabelText: '#a8a29e', // stone-400
                  dividerBackground: '#44403c', // stone-700
                  anchorTextColor: '#34d399', // emerald-500
                  anchorTextHoverColor: '#10b981', // emerald-600
                },
              },
            },
          }}
          theme="dark"
          redirectTo={window.location.origin} // Redirects to the app's root after auth
        />
      </div>
    </div>
  );
};

export default Login;
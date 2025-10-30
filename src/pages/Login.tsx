"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-stone-200">
        <div className="flex flex-col items-center mb-6">
          <span className="text-4xl mb-2" role="img" aria-label="sprout">🌿</span>
          <h1 className="text-3xl font-bold text-emerald-700">Branch</h1>
          <p className="text-stone-600 mt-2 text-center">Your Accountability Companion</p>
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
                  defaultButtonBackground: '#f5f5f4', // stone-100
                  defaultButtonBackgroundHover: '#e7e5e4', // stone-200
                  defaultButtonBorder: '#d6d3d1', // stone-300
                  defaultButtonText: '#292524', // stone-800
                  inputBackground: '#ffffff', // white
                  inputBorder: '#d6d3d1', // stone-300
                  inputBorderHover: '#a8a29e', // stone-400
                  inputBorderFocus: '#059669', // emerald-600
                  inputText: '#292524', // stone-800
                  inputLabelText: '#57534e', // stone-600
                  dividerBackground: '#d6d3d1', // stone-300
                  anchorTextColor: '#059669', // emerald-600
                  anchorTextHoverColor: '#047857', // emerald-700
                },
              },
            },
          }}
          theme="light"
          redirectTo={window.location.origin} // Redirects to the app's root after auth
        />
      </div>
    </div>
  );
};

export default Login;
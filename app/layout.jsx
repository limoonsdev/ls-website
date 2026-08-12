import AuthProvider from '@/components/AuthProvider';
import { I18nProvider } from '@/lib/i18n';
import MaintenanceWrapper from '@/components/MaintenanceWrapper';
import './globals.css';

import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'PrimeGen.eu | Premium Account Generator',
  description: 'Generate premium accounts instantly with PrimeGen. Connect with Discord to get started.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <I18nProvider>
            {/* Global background effects */}
            <div className="bg-grid"></div>
            <div className="bg-glow"></div>
            <div className="bg-glow-bottom"></div>
            <MaintenanceWrapper>
              <Toaster 
                position="top-center" 
                toastOptions={{ 
                  style: { background: '#0a0d14', color: '#fff', border: '1px solid rgba(0, 240, 255, 0.2)' }
                }} 
              />
              {children}
            </MaintenanceWrapper>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

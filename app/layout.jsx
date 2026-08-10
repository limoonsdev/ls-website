import AuthProvider from '@/components/AuthProvider';
import { I18nProvider } from '@/lib/i18n';
import MaintenanceWrapper from '@/components/MaintenanceWrapper';
import './globals.css';

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
              {children}
            </MaintenanceWrapper>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

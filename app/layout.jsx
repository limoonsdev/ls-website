import AuthProvider from '@/components/AuthProvider';
import './globals.css';

export const metadata = {
  title: 'PrimeGen.eu | Connect',
  description: 'Connect to PrimeGen services securely',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

import { AuthProvider } from './AuthContext';
import './globals.css';

export const metadata = {
  title: 'Smart Web Monitor',
  description: 'Monitor website availability and performance',
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
import '@/styles/globals.css';

export const metadata = {
  title: 'NutriFlow - AI Menu Scanner',
  description: 'Find meals that match your health goals with AI-powered menu analysis',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#14b16a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
} 
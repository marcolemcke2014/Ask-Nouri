import { redirect } from 'next/navigation';

export default function Home() {
  // For now, redirect to the index page in the pages directory
  // This facilitates gradual migration from Pages Router to App Router
  redirect('/');
} 
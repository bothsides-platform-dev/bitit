import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LandingHero } from '@/components/landing/LandingHero';

export default async function RootPage() {
  const session = await auth();
  if (session?.user) redirect('/home');
  return <LandingHero />;
}

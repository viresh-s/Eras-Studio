import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SubscriptionPlansClient } from '@/components/features/subscription/SubscriptionPlansClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Subscription Plans | Eras Studio',
  description: 'Choose a plan for your artistic practice. Start with your art, add more possibilities when ready.',
};

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, plan, is_premium')
    .eq('id', user.id)
    .maybeSingle();

  const currentPlan = profile?.plan || (profile?.is_premium ? 'pro' : 'free');

  return (
    <SubscriptionPlansClient
      initialPlan={currentPlan}
      userName={profile?.full_name}
      userEmail={user.email}
    />
  );
}

import PublicNavbar from '@/components/features/public/Navbar';
import DashboardNavbar from '@/components/features/dashboard/Navbar';
import Footer from '@/components/features/public/Footer';
import { createClient } from '@/lib/supabase/server';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, profile_pic_url, role')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {profile ? <DashboardNavbar profile={profile} /> : <PublicNavbar />}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

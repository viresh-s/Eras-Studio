import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { ReportArtworkSchema } from '@/types/report';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = ReportArtworkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation Error',
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { artworkId, artworkOwnerId, reason, details } = validation.data;

    // Rate limiting: 5 reports per 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentReports } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_user_id', user.id)
      .gte('created_at', fifteenMinutesAgo);

    if (recentReports && recentReports.length >= 5) {
      return NextResponse.json(
        {
          success: false,
          message: 'Rate limit exceeded: You can submit at most 5 reports per 15 minutes.',
        },
        { status: 429 }
      );
    }

    const adminClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL)
      ? createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
      : null;
    const dbClient = adminClient || supabase;

    const { error } = await dbClient
      .from('reports')
      .insert({
        artwork_id: artworkId,
        reporter_user_id: user.id,
        artwork_owner_id: artworkOwnerId || null,
        reason,
        details: details?.trim() || null,
        status: 'pending',
      });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Report Submitted: Thank you for helping keep our community safe.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

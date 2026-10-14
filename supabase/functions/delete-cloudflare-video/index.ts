// @ts-ignore: Deno URL import resolved at runtime by Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

Deno.serve(async (_req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!;
    const cloudflareApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const nowIso = new Date().toISOString();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Auto-expire any athletes whose premium_expires_at has passed
    await supabase
      .from('athletes')
      .update({ is_premium: false })
      .eq('is_premium', true)
      .lt('premium_expires_at', nowIso);

    // 2. Fetch all posts with potential Cloudflare videos ordered newest-first
    const { data: posts, error: fetchErr } = await supabase
      .from('posts')
      .select(`
        id,
        athlete_id,
        content,
        channel,
        created_at,
        boosted_until,
        athletes ( id, is_premium )
      `)
      .order('created_at', { ascending: false });

    if (fetchErr) throw fetchErr;

    const keptProAthleteVideo = new Set<string>();
    let deletedVideosCount = 0;
    let preservedProVideosCount = 0;

    for (const post of posts || []) {
      let cloudflareUid: string | null = null;
      try {
        const parsed = JSON.parse(post.content);
        if (parsed && parsed.cloudflareUid) {
          cloudflareUid = String(parsed.cloudflareUid);
        }
      } catch (_e) {
        // Ignore plain-text posts
      }

      if (!cloudflareUid) continue;

      const athleteRecord = Array.isArray(post.athletes) ? post.athletes[0] : post.athletes;
      const isPro = Boolean(athleteRecord?.is_premium);
      const isOlderThan24h = post.created_at < twentyFourHoursAgo;

      // ✅ IF ATHLETE IS PRO: Keep their newest highlight video indefinitely while PRO
      if (isPro) {
        if (!keptProAthleteVideo.has(post.athlete_id)) {
          keptProAthleteVideo.add(post.athlete_id);
          preservedProVideosCount++;
          continue;
        }
        // Older replaced videos from the same PRO athlete fall through and get cleaned up
      } else {
        // ❌ IF ATHLETE IS NOT PRO: Keep until 24 hours have passed, then delete
        if (!isOlderThan24h) {
          continue;
        }
      }

      // 3. Delete the video from Cloudflare Stream
      const cfRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/stream/${cloudflareUid}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${cloudflareApiToken}`,
          },
        }
      );

      if (cfRes.ok || cfRes.status === 404) {
        deletedVideosCount++;

        // 4. Delete the expired post row (or clear cloudflareUid if the post is still boosted)
        const isStillBoosted = post.boosted_until && post.boosted_until > nowIso;
        if (isStillBoosted) {
          try {
            const parsed = JSON.parse(post.content);
            parsed.cloudflareUid = null;
            await supabase
              .from('posts')
              .update({ content: JSON.stringify(parsed) })
              .eq('id', post.id);
          } catch (_e) {}
        } else {
          await supabase.from('posts').delete().eq('id', post.id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedVideosCount,
        preservedProVideosCount,
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
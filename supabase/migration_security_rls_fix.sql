-- ═══════════════════════════════════════════════════════════════════════════
-- SECURITY FIX — remove policies that expose tables to every role
--
-- Three policies were written to "let the service role manage everything":
--
--   CREATE POLICY "service role can manage health tokens"
--     ON health_tokens FOR ALL USING (true) WITH CHECK (true);
--
-- USING (true) is not scoped to a role — it grants the access to `anon` and
-- `authenticated` as well. And the service role bypasses RLS entirely, so the
-- policy never did anything for its intended audience. The net effect was to
-- publish the table to anyone holding the public anon key, which ships in the
-- browser bundle.
--
-- Verified against production before writing this: an unauthenticated client
-- using only the anon key could read every row of health_tokens and
-- push_subscriptions.
--
-- What was exposed
--   health_tokens        sync_token — the sole credential for /api/health/sync,
--                        so anyone could post fabricated step data for any client
--   push_subscriptions   endpoint + auth/p256dh keys — enough to push arbitrary
--                        notifications straight to a client's phone
--   health_integrations  Strava access_token and refresh_token (table is empty
--                        today, so nothing has leaked yet — but it would the
--                        moment a client connects Strava)
--
-- Each table already carries a correct owner-scoped policy, so dropping these
-- removes the hole without removing any legitimate access. The service role is
-- unaffected: it does not consult RLS.
--
-- Run in the Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service role can manage health tokens"     ON public.health_tokens;
DROP POLICY IF EXISTS "service role can manage all integrations"  ON public.health_integrations;
DROP POLICY IF EXISTS "Service role reads all subscriptions"      ON public.push_subscriptions;

-- push_subscriptions had no WITH CHECK, so a user could write a row belonging to
-- someone else. Recreate it explicitly on both sides.
DROP POLICY IF EXISTS "Users manage own push subscription" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subscription"
  ON public.push_subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Clients read their own token; only the service role issues or rotates one.
DROP POLICY IF EXISTS "clients can view own health token" ON public.health_tokens;
CREATE POLICY "clients can view own health token"
  ON public.health_tokens FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

DROP POLICY IF EXISTS "clients can view own integrations"   ON public.health_integrations;
DROP POLICY IF EXISTS "clients can delete own integrations" ON public.health_integrations;
CREATE POLICY "clients can view own integrations"
  ON public.health_integrations FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());
CREATE POLICY "clients can delete own integrations"
  ON public.health_integrations FOR DELETE
  TO authenticated
  USING (client_id = auth.uid());

-- ── Verification ───────────────────────────────────────────────────────────
-- Should return no rows. Anything listed here is readable by every role.
--
--   SELECT schemaname, tablename, policyname, roles, qual
--   FROM pg_policies
--   WHERE schemaname = 'public'
--     AND qual = 'true'
--     AND cmd IN ('SELECT', 'ALL');

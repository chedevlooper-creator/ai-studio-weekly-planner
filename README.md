<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/159de442-333a-482a-8a26-b13e0d7bafe5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Add InsForge variables to `.env.local` (aynı bağlantı uzaktan plan senkronu ve **InsForge AI Gateway** ile metin→görev için kullanılır):
   - `VITE_INSFORGE_BASE_URL`
   - `VITE_INSFORGE_ANON_KEY`
3. (Optional) Set `VITE_INSFORGE_AI_MODEL` to a chat model from your project (`npx @insforge/cli metadata --json` → `aiIntegration.models`). Defaults to `openai/gpt-4o-mini` if unset.
4. Ensure backend table exists (user-based plan storage):
   ```sql
   create table if not exists public.weekly_plans (
     user_id text primary key,
     payload jsonb not null,
     updated_at timestamptz not null default now()
   );
   ```
5. Ensure storage bucket exists for task attachments:
   - Bucket name: `task-files`
   - Visibility: public
6. Use the built-in auth panel in the app to sign up/sign in, or continue with guest mode.
7. Run the app:
   `npm run dev`

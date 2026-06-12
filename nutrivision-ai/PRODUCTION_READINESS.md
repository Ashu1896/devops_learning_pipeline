# NutriVision AI - Production Readiness Checklist

Ensure all items in this checklist are verified before deploying NutriVision AI to public production.

---

## 1. Security & Authentication Controls

- `[x]` **Row Level Security (RLS)**: Enforced on all Supabase tables (`profiles`, `meals`, `food_items`). Checked that no user can read, update, or delete records belonging to other users.
- `[x]` **API Secret Scoping**: Confirmed that `OPENAI_API_KEY` is saved solely in Netlify site settings (environment variables). It is never exposed in Vite client builds (no `VITE_` prefix).
- `[x]` **CORS Policies**: Implemented CORS preflight handler in `netlify/functions/analyze-food.ts` to restrict execution to authorized origins and methods.
- `[ ]` **HTTPS Enforce**: Verified that Netlify routes are redirected to `HTTPS` automatically.
- `[x]` **Payload Sanitization**: Implemented payload type checks inside Netlify functions to validate Base64 string formats and reject corrupt or excessively large inputs.

---

## 2. Database & Storage Optimization

- `[x]` **Performance Indexing**: Created database indexes on primary query targets:
  - `idx_meals_user_id_recorded_at` on `meals(user_id, recorded_at desc)` to optimize timeline feeds.
  - `idx_food_items_meal_id` on `food_items(meal_id)` to speed up inner joins for food list queries.
- `[ ]` **Supabase Storage Access**: Set the `food-images` bucket to public read, with upload permission policies restricted to `authenticated` users in user-specific folders (`auth.uid()`).

---

## 3. PWA & Offline Support

- `[x]` **Manifest Compliance**: Verified that `manifest.json` contains valid image pathways (`192x192`, `512x512` maskable icons) and display properties set to `standalone`.
- `[x]` **Caches Cleans**: Checked that the service worker activation step clears out stale caches from older installations.
- `[x]` **IndexedDB/Offline Sync**: Verified that local storages handle saving meal payloads while offline and queue them for automated upload when connectivity returns.

---

## 4. Monitoring & Diagnostics

- `[ ]` **Netlify Serverless Logs**: Set up alerts for Netlify Function runtime exceptions to monitor OpenAI connection timeouts or rate limiting blocks.
- `[ ]` **Supabase API Limits**: Configured warning thresholds on database transactions and storage usage caps.

# NutriVision AI - Deployment Guide

Follow these instructions to deploy the NutriVision AI food analysis application to production using Supabase and Netlify.

---

## 1. Database & Auth Setup (Supabase)

1. **Create a Supabase Project**: Go to [supabase.com](https://supabase.com) and create a new project.
2. **Execute Database Schema**:
   - In the Supabase sidebar, navigate to the **SQL Editor**.
   - Click **New Query**.
   - Open and copy the contents of the [schema.sql](file:///d:/Agentic_AI/nutrivision-ai/supabase/schema.sql) file.
   - Paste the SQL into the editor and click **Run**.
3. **Configure Storage Bucket**:
   - Go to **Storage** in the sidebar.
   - Click **New Bucket**.
   - Name the bucket: `food-images`.
   - Set the bucket to **Public** (so public URLs are generated).
   - Click **Save**.
4. **Retrieve API Keys**:
   - Go to **Project Settings** -> **API**.
   - Copy the **Project URL** (used as `VITE_SUPABASE_URL`).
   - Copy the **anon public API Key** (used as `VITE_SUPABASE_ANON_KEY`).

---

## 2. Serverless & Hosting Setup (Netlify)

1. **Create Netlify Account**: Sign up at [netlify.com](https://www.netlify.com).
2. **Deploy from Git**:
   - Link your GitHub repository.
   - Set the **Base directory** to `nutrivision-ai`.
   - Netlify will automatically detect settings from [netlify.toml](file:///d:/Agentic_AI/nutrivision-ai/netlify.toml):
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
     - **Functions directory**: `netlify/functions`
3. **Configure Environment Variables**:
   - In Netlify, go to **Site configuration** -> **Environment variables**.
   - Add:
     - `OPENAI_API_KEY`: Your OpenAI API key (ensure it has vision capability like GPT-4o-mini).
   - Add (Optional, to secure client builds):
     - `VITE_SUPABASE_URL`: Your Supabase Project URL.
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
4. **Deploy**: Click **Deploy site**.

---

## 3. Local Development Setup

To run and debug the application locally:

1. **Navigate to Project Directory**:
   ```bash
   cd nutrivision-ai
   ```
2. **Setup Local Environment Variables**:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with your Supabase credentials.
3. **Install Node Modules**:
   ```bash
   npm install
   ```
4. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.
5. **Testing Functions Locally (Optional)**:
   - Install Netlify CLI:
     ```bash
     npm install -g netlify-cli
     ```
   - Start Netlify local environment (runs frontend and functions together with redirects):
     ```bash
     netlify dev
     ```
     This starts the dev server at `http://localhost:8888` with `/api/*` routed to functions.
   - If Netlify CLI is not used, the application handles fallback mock analysis seamlessly, allowing you to test the entire UI offline.

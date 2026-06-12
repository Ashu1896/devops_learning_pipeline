# NutriVision AI - Testing Strategy

This document outlines the testing strategy for verifying the NutriVision AI application across unit, integration, and user-interface levels.

---

## 1. Unit Testing

Focuses on validating core business logic, formulas, and state state mutations without network overhead.

### 1.1 Store Calorie Calculator (`useProfileStore.ts`)
- **Objective**: Verify that target calories and macro distributions calculated via the Mifflin-St Jeor equation are mathematically correct.
- **Test Cases**:
  - Check that a 30-year-old, 70kg, 175cm male aiming for 'Weight Loss' receives a calorie budget roughly equal to `TDEE - 500` (approx. 1500-1600 kcal) and a protein target of `126g` (70 * 1.8).
  - Check that diabetic goals limit carbs to exactly 40% of the calorie budget.
  - Validate biological sex adjustments (Male vs Female calculation offsets).

### 1.2 Offline Queue Management (`useMealStore.ts`)
- **Objective**: Ensure meals logged while offline are queued and synchronized when network returns.
- **Test Cases**:
  - Intercept network request and trigger `logMeal` while offline. Verify the meal is appended to the store with `isOfflinePending = true` and cached in `localStorage`.
  - Simulate network connection restoration. Verify that calling `syncOfflineQueue` uploads queued elements, clears the queue, and fetches database sync keys.

---

## 2. Integration Testing

Validates component communications and serverless API interactions.

### 2.1 Netlify Serverless Analyzer (`netlify/functions/analyze-food.ts`)
- **Objective**: Ensure the backend accepts requests, validates image payloads, and formats API queries correctly.
- **Test Cases**:
  - Call the endpoint with a missing `image` payload. Verify that it returns `400 Bad Request` with an appropriate error message.
  - Simulate OpenAI API token errors. Verify that the serverless function handles the error and falls back to mock evaluations gracefully instead of throwing a 500 server crash.
  - Mock the GPT-4o-mini completion payload. Verify that the parser extracts all micronutrients and health indicators correctly.

---

## 3. UI/UX & PWA Verification

Ensures correct rendering across responsive breakpoints and verified offline operation.

### 3.1 Responsive Breakpoint Checks
- Verify layout alignment across the specified breakpoints:
  - **Mobile (320px - 767px)**: Viewport displays the bottom tab bar. Left sidebars are hidden. Forms stack vertically.
  - **Tablet (768px - 1024px)**: Grids rearrange into 2-column templates. Tab bar remains at the bottom.
  - **Desktop (1025px+)**: Bottom tab bar is hidden. Left sidebar navigation becomes visible with persistent user metadata.

### 3.2 PWA Operation Checks
- **Lighthouse Audits**: Run Chrome DevTools Lighthouse audit for Progressive Web Apps. Verify:
  - Manifest is successfully loaded.
  - Service worker is registered and active.
  - App redirects HTTP traffic to HTTPS.
  - App is installable as a standalone icon.
- **Offline Shell Loading**:
  - Open Chrome DevTools, navigate to the **Application** panel -> **Service Workers**, and check **Offline**.
  - Reload the page. Verify the core shell (Dashboard, Profile templates) loads from caches without throws.

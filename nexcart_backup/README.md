# NexCart - Curated Luxury E-Commerce Platform

NexCart is a premium, full-stack e-commerce web application built on **Next.js 16 (App Router)** and **React 19**. It features a modern dark aesthetic, micro-animations, and supports dual-mode operation (PostgreSQL or persistent local JSON data storage).

---

## Key Features

### 💳 Real-Life Payment Gateways
- **Stripe Checkout**: Generates checkout sessions via the server-side Stripe SDK, redirecting customers to a secure Stripe hosted portal.
- **PayPal Express**: Integrates the PayPal Smart Buttons client-side via `@paypal/react-paypal-js` and executes order creation & capture securely via PayPal REST API endpoints.
- **Mock Fallbacks**: Gracefully falls back to simulation mode for both card and PayPal checkouts if credentials are not configured in `.env`.

### 🔐 Google OAuth 2.0 Sign-In
- Exposes standard authorization code grant flows to sign in with Google accounts.
- Automatically handles dynamic callback redirects matching the active server port (e.g. `localhost:3000` or `localhost:3001`).
- Fallback mock user account login exists for development environments.

### 🛡️ Administrative Dashboard (/admin)
- **Analytics Monitoring**: Live area and pie charts (via Recharts) displaying revenue timelines, category distributions, and average order values.
- **Reports Export**: Generates and compiles weekly PDFs (via jsPDF) and downloads metrics as CSV sheets.
- **Product Catalog Management**: Create, edit, and delete products, select categories, and assign real curated brands.
- **Orders Tracking**: Track logistics speeds, carrier tracking numbers, and update shipment states.
- **User Permission & Audit Logs**: Inspect audit events and toggle user roles between `CUSTOMER` and `ADMIN`.
- **Developer Settings Role Switcher**: A dev-mode dashboard role switcher in the profile details tab allows upgrading local accounts to Admin immediately.

### 💾 Hybrid Database System
- Auto-detects PostgreSQL databases. If a DB is offline, it seamlessly falls back to a persistent JSON-based file storage inside the project (`public/database/`).

---

## Environment Variable Checklist

Create a `.env` file in the root directory and add the following keys:

```env
# Database Configuration (PostgreSQL / Neon)
DATABASE_URL="postgresql://user:password@hostname:5432/db?sslmode=require"

# JWT Token Secret
JWT_SECRET="nexcart-super-secret-jwt-key"

# Stripe Gateway Credentials
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# PayPal REST API Credentials
NEXT_PUBLIC_PAYPAL_CLIENT_ID="paypal_sandbox_client_id"
PAYPAL_CLIENT_ID="paypal_sandbox_client_id"
PAYPAL_CLIENT_SECRET="paypal_sandbox_secret"

# Google Authentication API
GOOGLE_CLIENT_ID="google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="google_client_secret"

# App public URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Quickstart Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Database Migrations (Optional)
If using a real PostgreSQL database, push your Prisma schemas:
```bash
npx prisma db push
```

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the storefront!

---

## Testing Cheatsheet

### Pre-Seeded Accounts
- **Admin Login**: `admin@nexcart.luxury` / Password: `admin123`
- **Customer Login**: `sterling@customer.com` / Password: `customer123`

### Stripe Test Card
- **Card Number**: `4242 4242 4242 4242`
- **Expiry Date**: Any date in the future (e.g. `12 / 29`)
- **CVC**: Any 3 numbers (e.g. `123`)

### PayPal Sandbox Testing
- Log in to your [PayPal Developer Console](https://developer.paypal.com) and navigate to **Testing Tools > Sandbox Accounts** to retrieve or generate mock buyer login credentials.

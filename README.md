</> Markdown
## Summarist Book Summary Screenshot

![Summarist Book Summary Screenshot](./summaristproject.png)

## 🛠️ Tech Stack
* Next.js 16: App Router, server components
* React 19: UI components and hooks
* TypeScript: type-safe frontend and backend code
* Redux Toolkit: shopping cart state management
* Stripe: secure card payments and billing
* Firebase Authentication: customer and admin sign-in
* Cloud Firestore: orders and inventory database
* Firebase Admin SDK: server-side token verification
* Nodemailer: automated purchase email notifications
* CSS: custom responsive styling
* Vitest: fast unit and component testing
* React Testing Library: user-focused component behavior tests
* jsdom: simulated browser for running tests
* ESLint: code quality and consistency checks
* Vercel: hosting with automatic GitHub deploys
### 🚀 Key Features

* 📚 Book discovery: browse selected, recommended and suggested books
* 🔍 Live search: find books by title or author
* 🎧 Read or listen: text summaries and an audio player
* ⭐ Ratings and prices: star ratings and a price on every book
* 🛒 Shopping cart: saved cart, quantity controls, continue-shopping option
* 💳 Stripe checkout: secure card payment with billing address
* 📧 Purchase emails: branded receipts to buyers, alerts to the business
* 🔐 Firebase sign-in: customer accounts with login and sign-up
* 🛡️ Admin portal: login for approved, email-verified admins only
* 📊 Sales dashboard: revenue totals, daily sales chart, transaction history
* 📦 Inventory management: stock editing and low-stock alerts
* 🗑️ Transaction control: delete orders and optionally restock items
* ⚡ Performance: server rendering, caching, optimized images, loading skeletons
* 📱 Responsive design: works on phones, tablets and desktops
* 🚀 Continuous deployment: Vercel redeploys automatically on every GitHub push
* 🧪 Automated testing: 33 Vitest and React Testing Library tests

## Summarist Book Summary Platform

🔗 **Live Demo:** [View Live Website](https://summarist-app-purple-gold.vercel.app/)

A React platform that helps readers discover popular books

## Summarist Book Summary Run Instructions

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 20.9 or later, with npm
- [Git](https://git-scm.com/downloads)
- A [Stripe](https://dashboard.stripe.com/test/apikeys) account (test keys are fine)
- A Gmail account with an App Password, or another SMTP provider, for purchase emails
- *(Optional)* A Firebase project with Firestore enabled, for storing orders and inventory

### 1. Clone the repository
```bash
git clone https://github.com/jkarnwie2000/SummaristApp.git
cd SummaristApp
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env.local
```
Open `.env.local` and fill in your values:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `ADMIN_EMAILS` | Comma-separated emails allowed into the admin dashboard |
| `ADMIN_SESSION_SECRET` | Any long random string, used to sign admin sessions |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP settings for purchase emails |
| `EMAIL_FROM` | Sender name and address for emails |
| `BUSINESS_EMAILS` | Addresses that receive a notification for every order |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | *(Optional locally, required on Vercel)* Firestore service account JSON on one line |

> Never commit `.env.local`. It is already listed in `.gitignore`.

### 4. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. *(Optional)* Forward Stripe webhooks locally
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Copy the `whsec_...` secret it prints into `STRIPE_WEBHOOK_SECRET`.

## 🧪 Running Tests

Tests use **Vitest** and **React Testing Library**. They don't need environment variables or network access, because Firebase and the Next.js router are faked.

```bash
# Run all tests once
npm test

# Re-run tests automatically as you edit
npm run test:watch

# Run a single test file
npx vitest run __tests__/AuthModal.test.tsx
```

**What's covered (8 files, 33 tests):**
- 💲 **Pricing and checkout math**: prices, shipping, tax, totals
- 🛒 **Cart logic**: add, merge, quantity limits, remove, clear, restore
- 💳 **Stripe order data**: order lines saved on payments and read back
- 🔐 **Auth flows**: guest login, email login, sign-up checks, error messages
- ⭐ **UI components**: star ratings, book cards, footer admin link

Test files are in the `__tests__/` folder, and the setup is in `vitest.config.mts`.

## 💳 Test a Purchase
Use Stripe's test card **4242 4242 4242 4242** with any future expiry date, any CVC and any ZIP code.

## 🛡️ Access the Admin Dashboard
1. Go to `/admin/signup` and create an account with an email listed in `ADMIN_EMAILS`.
2. Verify the email address.
3. Sign in at `/admin/login`.

## 📦 Production Build
```bash
npm run lint    # check code quality
npm test        # run the test suite
npm run build   # build for production
npm start       # serve the production build
```
Open [http://localhost:3000](http://localhost:3000) to view the production build.

## ☁️ Deploy
Import the repository into [Vercel](https://vercel.com/), add the same environment variables in the project settings, and deploy. Every push to the production branch redeploys the site automatically.

## 🛠️ Troubleshooting
- **Port 3000 is in use:** run `npm run dev -- --port 3001` and open `http://localhost:3001`.
- **Payments fail:** check that both Stripe keys are test keys from the same Stripe account.
- **Purchase emails don't arrive:** for Gmail, use an App Password, not your normal password, and check the spam folder.
- **Admin login is refused:** make sure the email is listed in `ADMIN_EMAILS` and has been verified.
- **Changes to `.env.local` don't apply:** stop the dev server and run `npm run dev` again.


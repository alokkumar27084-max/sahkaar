# Thekedaar Frontend — Complete Setup Guide
## For Beginners — Step by Step

---

## What You Just Got
This is the complete React PWA frontend for Thekedaar. Here is what is built:

| File | What It Does |
|------|-------------|
| `src/App.jsx` | Root file — sets up all routes and global providers |
| `src/context/LanguageContext.js` | Hindi/English switcher for the entire app |
| `src/context/AuthContext.js` | Tracks who is logged in across all pages |
| `src/services/api.js` | All API calls to your backend — one place |
| `src/utils/translations.js` | All Hindi + English text strings |
| `src/utils/validators.js` | Input validation + XSS protection |
| `src/utils/constants.js` | Categories, WhatsApp links, app constants |
| `src/hooks/useGeolocation.js` | GPS location permission hook |
| `src/components/common/Navbar.jsx` | Top navigation bar |
| `src/components/common/ContractorCard.jsx` | Search result card |
| `src/components/common/Badge.jsx` | Verified / Labour Group / Featured badges |
| `src/components/common/ProtectedRoute.jsx` | Blocks pages from unauthenticated users |
| `src/components/common/StarRating.jsx` | Display or click star ratings |
| `src/pages/auth/LoginPage.jsx` | Login with phone OTP OR email + password |
| `src/pages/auth/RegisterPage.jsx` | Customer account creation |
| `src/pages/customer/HomePage.jsx` | Landing page with categories & search |
| `src/pages/customer/SearchPage.jsx` | Search results with filters |
| `src/pages/customer/ContractorProfilePage.jsx` | Full contractor profile with reviews |
| `src/pages/contractor/ContractorRegisterPage.jsx` | 4-step contractor onboarding |
| `src/pages/contractor/ContractorDashboard.jsx` | Contractor control panel |
| `src/pages/contractor/ContractorEditPage.jsx` | Contractor profile edit + portfolio management |
| `src/pages/admin/AdminDashboardPage.jsx` | Admin panel (pending verification, stats, reports) |

---

## Step 1 — Install Node.js

1. Go to https://nodejs.org
2. Download and install the **LTS version** (e.g. 20.x)
3. Verify installation: open Terminal and run:
   ```
   node --version
   npm --version
   ```
   You should see version numbers.

---

## Step 2 — Open This Project

```bash
# Navigate into the frontend folder
cd thekedaar-frontend

# Install all dependencies (this downloads node_modules)
npm install
```

This takes 2-5 minutes the first time.

---

## Step 3 — Set Up Environment Variables

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` in any text editor
3. Fill in your values:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_GOOGLE_MAPS_KEY=your_key_here
   ```
   - `REACT_APP_API_URL` = your backend URL (default backend in this repo runs on `http://localhost:5000/api`)
   - Leave Google Maps key blank for now

---

## Step 4 — Run the App Locally

```bash
npm start
```

This opens http://localhost:3000 in your browser automatically.

**You will see errors about the backend not being available** — that is normal. The frontend is working. We just need to build the backend next.

---

## Step 5 — Build for Production (Vercel)

1. Create a free account at https://vercel.com
2. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Run from inside the project folder:
   ```bash
   npm run build
   vercel deploy
   ```
4. Vercel will ask you a few questions — accept defaults
5. Set your environment variables in Vercel Dashboard → Settings → Environment Variables

---

## How the App Works (Beginner Explanation)

### React
React builds the UI from "components" — small reusable pieces like cards, buttons, forms. Each component is a `.jsx` file.

### Context
`LanguageContext` and `AuthContext` are like global variables that any component can read. They hold the current language and the logged-in user.

### Routing
`react-router-dom` shows different pages based on the URL:
- `/` → HomePage
- `/search` → SearchPage  
- `/login` → LoginPage

### API calls
All calls to your backend go through `src/services/api.js`. This file uses `axios` (like a smart `fetch`). It automatically adds your backend URL and handles errors.

### Security built in
- **Input sanitization**: `DOMPurify` removes malicious HTML from all inputs (prevents XSS)
- **Validation**: every input is checked before sending to backend
- **Protected routes**: `ProtectedRoute` redirects unauthenticated users to login
- **No sensitive data in localStorage**: auth token is in `httpOnly` cookie (set by backend)

---

## What To Build Next

Core backend/database/admin flows are already included in this workspace.  
Use `DEPLOYMENT_GUIDE.md` + `npm run check:release` before shipping.

---

## Adding a New Page (For Reference)

1. Create the file in `src/pages/`
2. Import it in `src/App.jsx` at the top
3. Add a `<Route>` in the `<Routes>` block
4. Add a link in `Navbar.jsx`
5. Add translations in `src/utils/translations.js`

That's the pattern for every page in the app.

---

## Common Issues

| Problem | Solution |
|---------|---------|
| `npm install` fails | Run `npm install --legacy-peer-deps` |
| White screen | Check browser console (F12) for error |
| "Cannot find module" | Run `npm install` again |
| API calls failing | Make sure backend is running on port 5000 |
| Styles not showing | Run `npm install tailwindcss autoprefixer postcss` |

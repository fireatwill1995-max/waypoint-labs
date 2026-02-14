# Deploy setup – Push to GitHub, Fly.io, Cloudflare (Waypoint Labs)

Follow these steps to get the app **live** on GitHub, Fly.io, and Cloudflare Pages.

---

## Step 1: Push repo to GitHub (Waypoint Labs)

### Option A: Using the script (recommended)

1. Open **PowerShell** in the project folder.
2. Log in to GitHub (if not already):
   ```powershell
   gh auth login
   ```
   Choose: GitHub.com → HTTPS → Login with browser.

3. Run the setup script (use **waypointlabs** if that’s your GitHub org/username):
   ```powershell
   .\scripts\push-and-deploy-setup.ps1 waypointlabs
   ```
   If you don’t pass a name, it uses your GitHub username.

4. The script will:
   - Create the repo (e.g. `waypointlabs/civilian-drone-app`) if it doesn’t exist
   - Add `origin` and push to `main`

### Option B: Manual

1. Create a new repo on GitHub:
   - Go to **https://github.com/new**
   - Repository name: `civilian-drone-app`
   - Owner: **waypointlabs** (or your username)
   - Private (or Public). Do **not** add a README (you already have one).

2. In the project folder:
   ```powershell
   git remote add origin https://github.com/waypointlabs/civilian-drone-app.git
   git branch -M main
   git push -u origin main
   ```

Your repo URL will be: **https://github.com/waypointlabs/civilian-drone-app** (or your path).

---

## Step 2: Fly.io – get app URL

1. **Create a Fly API token**
   - Go to **https://fly.io/user/settings/tokens**
   - Click **Create token**, copy it.

2. **Add secret in GitHub**
   - Open: **https://github.com/waypointlabs/civilian-drone-app/settings/secrets/actions**
   - **New repository secret**
   - Name: `FLY_API_TOKEN`
   - Value: paste the token → **Add secret**

3. **Trigger deploy**
   - Open: **https://github.com/waypointlabs/civilian-drone-app/actions**
   - Run **“Deploy to Fly.io”** (Run workflow → Run workflow), or push any commit to `main`.

4. **App URL**
   - After the workflow succeeds: **https://civilian-drone-app.fly.dev**
   - (If the app name was taken, check the workflow log for the real URL or run `fly open` locally.)

5. **Optional – backend URL (if you run the Python backend elsewhere)**  
   In Fly.io dashboard or CLI:
   ```bash
   fly secrets set NEXT_PUBLIC_API_URL=https://your-backend.fly.dev
   fly secrets set NEXT_PUBLIC_WS_URL=wss://your-backend.fly.dev
   ```

---

## Step 3: Cloudflare Pages

1. **Cloudflare API token**
   - **https://dash.cloudflare.com/profile/api-tokens**
   - **Create Token** → **Edit Cloudflare Workers** template (or custom with **Account** and **Cloudflare Pages** permissions).
   - Copy the token.

2. **Account ID**
   - In **https://dash.cloudflare.com**, open any site or **Workers & Pages**.
   - In the right sidebar: **Account ID**.

3. **Add secrets in GitHub**
   - **https://github.com/waypointlabs/civilian-drone-app/settings/secrets/actions**
   - Add:
     - `CLOUDFLARE_API_TOKEN` = your token
     - `CLOUDFLARE_ACCOUNT_ID` = your Account ID

4. **Trigger deploy**
   - **https://github.com/waypointlabs/civilian-drone-app/actions**
   - Run **“Deploy to Cloudflare Pages”** (Run workflow).

5. **First run: create Pages project**
   - If the workflow says the project doesn’t exist, in Cloudflare: **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
   - Connect **waypointlabs/civilian-drone-app** (or your repo).
   - Project name: `civilian-drone-app`.
   - After that, the GitHub Action can deploy to it (using the same project name in the workflow).

   **Or** use only the Action: ensure the workflow has `projectName: waypoint-labs`. Create the project in Cloudflare first: Pages → Direct Upload → name **waypoint-labs**.

6. **Cloudflare app URL**
   - **https://waypoint-labs.pages.dev**  
   - Or the URL shown in **Workers & Pages** for that project.

---

## Step 4: Optional – repo variables (backend URL for Cloudflare build)

So the **static** Cloudflare build knows your backend (e.g. Fly.io):

- **https://github.com/waypointlabs/civilian-drone-app/settings/variables/actions**
- Add variables (not secrets):
  - `NEXT_PUBLIC_API_URL` = `https://civilian-drone-app.fly.dev`
  - `NEXT_PUBLIC_WS_URL` = `wss://civilian-drone-app.fly.dev`

Then re-run **“Deploy to Cloudflare Pages”**. The Cloudflare site will call your Fly app for API/WebSocket.

---

## Your live URLs (after setup)

| Where        | URL |
|-------------|-----|
| **GitHub repo** | https://github.com/waypointlabs/civilian-drone-app |
| **Fly.io app**  | https://civilian-drone-app.fly.dev |
| **Cloudflare Pages** | https://waypoint-labs.pages.dev |

Use **Fly.io** for the full Next.js app (recommended). Use **Cloudflare** as a static front that talks to the Fly backend if you set the variables above.

---

## APIs (when you have keys)

- **Fly.io:** `fly secrets set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...` (and any other env).
- **Cloudflare:** In the Pages project → **Settings** → **Environment variables** (e.g. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`).
- See **APIS_AND_INTEGRATIONS.md** for the full list.

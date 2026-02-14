# Quick deploy – live in a few steps

Do these in order. When done, you’ll have:

- **GitHub repo:** `https://github.com/waypointlabs/civilian-drone-app`
- **Fly.io app:** `https://civilian-drone-app.fly.dev`
- **Cloudflare Pages:** `https://waypoint-labs.pages.dev`

---

## 1. Log in to GitHub (once)

In **PowerShell** in this folder:

```powershell
gh auth login
```

- Choose **GitHub.com** → **HTTPS** → **Login with a web browser**.
- Use the account that owns or can create the **waypointlabs** repo (your user or Waypoint Labs org).

---

## 2. Push repo to GitHub (Waypoint Labs)

```powershell
.\scripts\push-and-deploy-setup.ps1 waypointlabs
```

If you don’t use the name `waypointlabs`, run without an argument to use your GitHub username:

```powershell
.\scripts\push-and-deploy-setup.ps1
```

Repo URL will be: **https://github.com/waypointlabs/civilian-drone-app** (or your path).

---

## 3. Fly.io – add secret and deploy

1. **Create Fly token:** https://fly.io/user/settings/tokens → **Create token** → copy it.
2. **Add secret in GitHub:**  
   **https://github.com/waypointlabs/civilian-drone-app/settings/secrets/actions**  
   - **New repository secret**  
   - Name: `FLY_API_TOKEN`  
   - Value: (paste token) → **Add secret**
3. **Run deploy:**  
   **https://github.com/waypointlabs/civilian-drone-app/actions**  
   - Open **“Deploy to Fly.io”** → **Run workflow** → **Run workflow**.

When it’s green, the app is live at: **https://civilian-drone-app.fly.dev**

---

## 4. Cloudflare Pages – add secrets and deploy

1. **Cloudflare API token:** https://dash.cloudflare.com/profile/api-tokens  
   - **Create Token** → use **Edit Cloudflare Workers** (or custom with Account + Pages).
2. **Account ID:** In Cloudflare Dashboard, right sidebar.
3. **Add GitHub secrets:**  
   **https://github.com/waypointlabs/civilian-drone-app/settings/secrets/actions**  
   - `CLOUDFLARE_API_TOKEN` = (token)  
   - `CLOUDFLARE_ACCOUNT_ID` = (Account ID)
4. **Run deploy:**  
   **https://github.com/waypointlabs/civilian-drone-app/actions**  
   - **“Deploy to Cloudflare Pages”** → **Run workflow**.

Cloudflare URL: **https://waypoint-labs.pages.dev**

---

## Your live URLs

| Service        | URL |
|----------------|-----|
| **Fly.io**     | https://civilian-drone-app.fly.dev |
| **Cloudflare** | https://waypoint-labs.pages.dev |
| **GitHub repo**| https://github.com/waypointlabs/civilian-drone-app |

Use **Fly.io** as the main app URL. Add API keys later via Fly secrets or Cloudflare env vars (see APIS_AND_INTEGRATIONS.md).

# Upgrade Path: Next.js and Glob Advisories

This document describes how to safely address the remaining npm audit advisories (Next.js and glob) and keep the project on supported versions.

## Current State (as of audit)

- **Next.js**: `^14.2.0` — advisory: self-hosted apps DoS (Image Optimizer `remotePatterns`, RSC request deserialization). Fix: upgrade to Next.js 16.x (breaking).
- **glob**: Transitive (via `eslint-config-next` / `@next/eslint-plugin-next`). Advisory: CLI command injection. Fix: upgrade `eslint-config-next` (pulls in newer glob); Next 16 uses newer ESLint plugin.

## Option A: Minimal-risk upgrade (recommended first)

1. **Upgrade within Next 14** (no major jump):
   ```bash
   npm install next@14.2.18 eslint-config-next@14.2.18
   ```
   Then run:
   ```bash
   npm audit
   npm run build
   npm run lint
   npm test
   ```
   If 14.2.18 (or latest 14.x) still has advisories, proceed to Option B.

2. **Pin glob in resolutions** (if your package manager supports it) to force a non-vulnerable glob for dev only:
   - npm: add to `package.json`:
     ```json
     "overrides": {
       "glob": ">=10.4.6"
     }
     ```
   - Then `npm install` and re-run audit. This can pull in versions that require Node 18+ and may change behavior of tools that depend on glob.

## Option B: Upgrade to Next.js 15 or 16 (breaking)

1. **Read the official guides**:
   - [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
   - [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading) (when published)

2. **Typical breaking areas**:
   - `next build` / `next dev` flags and config (e.g. `output: 'standalone'`, `output: 'export'`).
   - React 19 if upgrading to Next 16 (React 18 is still supported in Next 15).
   - ESLint: `eslint-config-next` major version must match Next major.
   - Deprecated APIs: replace any deprecated usage reported by the build.

3. **Steps**:
   ```bash
   npm install next@16 react@latest react-dom@latest
   npm install -D eslint-config-next@16 @types/react@latest @types/react-dom@latest
   ```
   Then:
   - Fix any TypeScript or ESLint errors.
   - Run `npm run build` and fix config or code as needed.
   - Run `npm test` and `npm run lint`.
   - Manually test: home, `/civilian`, `/admin`, sign-in, and one API call (e.g. status).

4. **Deploy** to staging first; only then promote to production.

## Option C: Accept risk and mitigate (no upgrade)

- Keep current versions.
- Ensure **production** uses:
  - `productionBrowserSourceMaps: false` (already set in `next.config.js`).
  - No user-controllable `remotePatterns` for the Image Optimizer (or disable it if unused).
- Run `npm audit` periodically and re-evaluate when Next 15/16 is stable for your stack.

## Checklist after any upgrade

- [ ] `npm audit` (no new high/critical, or accepted risk documented).
- [ ] `npm run build` succeeds.
- [ ] `npm run lint` passes.
- [ ] `npm test` passes.
- [ ] Smoke test: app loads, civilian dashboard, admin, sign-in.
- [ ] CI/CD (e.g. GitHub Actions) passes.
- [ ] Staging deploy verified before production.

## References

- [Next.js Releases](https://github.com/vercel/next.js/releases)
- [npm audit GHSA-9g9p-9gw9-jx7f (Next.js Image Optimizer)](https://github.com/advisories/GHSA-9g9p-9gw9-jx7f)
- [npm audit GHSA-h25m-26qc-wcjf (Next.js RSC)](https://github.com/advisories/GHSA-h25m-26qc-wcjf)
- [npm audit GHSA-5j98-mcp5-4vw2 (glob)](https://github.com/advisories/GHSA-5j98-mcp5-4vw2)

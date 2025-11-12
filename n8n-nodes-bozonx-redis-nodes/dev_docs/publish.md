# Publishing without n8n CLI (pnpm)

This project can be published to the npm registry directly with pnpm, without using the n8n CLI release flow. Use this when you just need to distribute the package as a regular npm module.

Requirements:
- You have an npm account and are logged in: `pnpm npm login`
- You have publish rights for the `n8n-nodes-bozonx-redis-nodes` package name
- Two‑factor auth (2FA) on npm if required by your org

Notes:
- The package only publishes the `dist/` folder (see `files` in package.json). Always build first.
- No special prepublish hooks will run for this path (the n8n CLI prerelease is mapped to a custom script name and will not trigger).

## Steps

1) Bump version (semver)

- Prefer using your release tool or do it manually in package.json (`version`).
- Example (with release-it configured) — optional:

```bash
pnpm dlx release-it --no-git.requireCleanWorkingDir --no-npm
```

2) Install deps and build

```bash
pnpm install
pnpm build
```

3) Inspect package contents (optional)

```bash
pnpm pack --dry-run
```

You should see only files under `dist/`.

4) Publish to npm

Unscoped public package:

```bash
pnpm publish --access public
```

Useful flags:
- `--tag next` to publish under a dist-tag
- `--no-git-checks` if your repo is not clean and you understand the implications

5) Verify

```bash
pnpm view n8n-nodes-bozonx-redis-nodes version
```

## Troubleshooting

- 403 Forbidden: ensure you are logged in (`pnpm npm whoami`) and have publish permissions.
- 2FA required: configure OTP via `npm` prompts or environment variable `NPM_CONFIG_OTP`.
- Missing dist files: re-run `pnpm build` before publishing.

## Alternative: Community Node release (n8n CLI)

If you do want to use the official flow for n8n Community Nodes:

```bash
pnpm release:n8n
```

This runs `n8n-node release` which validates and prepares the package for inclusion in n8n.

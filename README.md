# Analyze bundling

npx nuxi analyze

# Env vars

CI=0 or CI=1

# Tests

Run unit tests and component tests:
```bash
npm run test:unit
# Or with coverage:
npm run test:unit:coverage
```

Run server-side rendering tests:
```bash
npm run test:ssr
```

Run full-stack tests:
```bash
npm run test:e2e
```

The tests under e2e, which are run by playwright, are for testing the full-stack (client app and server app) in a browser environment. Since the server-rendered page may be different from the client-rendered page, for example, when some elements are configured to only render on the client side, relevant tests should wait for the elements to be present.

## Setup

Make sure to install the dependencies:

```bash
npm install
```

## Local development

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

You can also expose it to your local network, so that you can try it out on a mobile device, using:

```bash
npm run dev -- --host
```

The QR code shown will allow you to quickly access the app.

## Linting and formatting

Linting and formatting are handled jointly by [@nuxt/eslint](https://eslint.nuxt.com/packages/module) (an "all-in-one" ESLint "integration" for Nuxt) and by the more frequently-updated, conventionally- and widely-used [@antfu/eslint-config](https://github.com/antfu/eslint-config) (antfu works at NuxtLabs, and the package is given as an example in the `@nuxt/eslint` docs). The former handles linting only, while the latter also handles formatting, based on ESLint Stylistic.

### Commit hook

You should install the lint-fixing commit hook (which will apply to this repo only) using:

```bash
npx simple-git-hooks
```

This will help us keep git history tidy, avoiding clogging up `git blame`s with linting-only commits.

### Inspecting the linting rules

This is a helpful tool for inspecting your config setup, so you can check which rules are applied, in which order:
```bash
npx @eslint/config-inspector
```

### For your IDE

In VSCode, [make sure](https://eslint.nuxt.com/packages/module#vs-code) your ESlint VS Code extension (vscode-eslint) is at least v3.0.10 (released June 2024). Turn on the 'Format on Save' setting.

## CI

Playwright tests produce HTML reports when they run, whether on CI or not, showing visual snapshots at each timestep in each test. If you need to open these, follow the instructions [here](https://playwright.dev/docs/ci-intro#html-report), particularly '[Viewing the HTML report](https://playwright.dev/docs/ci-intro#viewing-the-html-report)'.

## Production

Build the application for production:

```bash
npm run build
```

Locally preview production build:

```bash
npm run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

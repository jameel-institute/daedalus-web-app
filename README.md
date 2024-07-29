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

## Local development

### Setup

Use Node 20.
Have Docker installed.
Copy `.env.example` to `.env`.

Build and run the database container and R API container using this script:

```bash
run-dev-dependencies
```

Install the JS dependencies:

```bash
npm install
```

If you're using a fresh database, then you'll need to run the migrations:

```bash
npx prisma migrate dev
```

Prisma ORM can only query the database once you 'generate' the Prisma Client, which generates into `node_modules/.prisma/client`. This should happen when you install the JS dependencies and whenever you run a migration, but if the Prisma client gets out of sync or doesn't generate, you can manually generate it:

```bash
npx prisma generate
```

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

You can also expose it to your local network, so that you can try it out on a mobile device, using:

```bash
npm run dev -- --host
```

The QR code shown will allow you to quickly access the app.

### DB

To create migrations to the database, first update the Prisma schema at ./prisma/schema.prisma as required, then run the below to generate the corresponding SQL migration and to apply it to the database:

```bash
npx prisma migrate dev
```

The same command is also used to apply migrations that already exist in ./prisma/migrations but which have not been applied to the database.

#### For your IDE

In VSCode, you can use the extension with ID 'Prisma.prisma' to get syntax highlighting etc.

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

# Analyze bundling

npx nuxi analyze

# Tests

To run unit tests:
```bash
npm run test:unit
# Or with coverage:
npm run test:unit:coverage
```

To run integration tests, first start the Mockoon server:
```bash
npx mockoon-cli start --data ./mocks/mockoon.json
```
Then run:
```bash
npm run test:integration
```

Run server-side rendering tests:
```bash
npm run test:ssr
```

Run full-stack tests:

1. Ensure Mockoon server is not running
1. Run:
```bash
npm run test:e2e
```

The tests under e2e, which are run by playwright, are for testing the full-stack (client app and server app) in a browser environment. Since the server-rendered page may be different from the client-rendered page, for example, when some elements are configured to only render on the client side, relevant tests should wait for the elements to be present.

# Local development

## <a id="first-time"></a> Your first time setting up

Use Node 20.

Make sure Docker is installed.

Build and run the database container and R API container using this script:

```bash
scripts/run-dev-dependencies
```

If you have trouble with the R API image, there might be helpful information in [its own README](https://github.com/jameel-institute/daedalus.api).

Run the below to copy `.env.example` to `.env` and then run the `dev:init` command, which installs the JS dependencies, runs any pending database migrations, and starts up the server in development mode on `http://localhost:3000`:

```bash
cp .env.example .env
npm run dev:init
```

## Everyday development workflow

If you've already done ['Your first time setting up'](#first-time), you can quickly get back to work by:

```bash
# In one terminal window
scripts/run-dev-dependencies --db-build-skip # Skips the build step for the db container, and tries to run an existing image
```

```bash
# In another terminal window
npm run dev
```

## Other ways of serving the app and dependencies

You can also expose the app to your local network, so that you can try it out on a mobile device, using:

```bash
npm run dev -- --host
```

The QR code shown will allow you to quickly access the app.

See the 'production' section of this README for how to run the app in production mode.

# DB

Our ORM is [Prisma](https://www.prisma.io/).

To create migrations to the database, first update the Prisma schema at ./prisma/schema.prisma as required, then run the below command to generate the corresponding SQL migration and to apply it to the database. [You should commit both](https://www.prisma.io/docs/orm/prisma-migrate/workflows/team-development#source-control) the Prisma schema and the migration file to Git.

```bash
npm run db:dev:migrate
```

The same command is also used to apply migrations that already exist in ./prisma/migrations but which have not been applied to the database.

Prisma ORM can only query the database once you 'generate' the Prisma Client, which generates into `node_modules/.prisma/client` based on the file `prisma/schema.prisma`. This should happen when you install the JS dependencies and whenever you run a migration, but if the Prisma client gets out of sync or doesn't generate, you can manually generate it:

```bash
npx prisma generate
```

More helpful information about Prisma [development workflows](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production#customizing-migrations) and resolving issues in [production environments](https://www.prisma.io/docs/orm/prisma-migrate/workflows/patching-and-hotfixing#fixing-failed-migrations-with-migrate-diff-and-db-execute).

## For your IDE

In VSCode, you can use the extension with ID 'Prisma.prisma' to get syntax highlighting etc.

# Linting and formatting

Linting and formatting are handled jointly by [@nuxt/eslint](https://eslint.nuxt.com/packages/module) (an "all-in-one" ESLint "integration" for Nuxt) and by the more frequently-updated, conventionally- and widely-used [@antfu/eslint-config](https://github.com/antfu/eslint-config) (antfu works at NuxtLabs, and the package is given as an example in the `@nuxt/eslint` docs). The former handles linting only, while the latter also handles formatting, based on ESLint Stylistic.

## Commit hook

You should install the lint-fixing commit hook (which will apply to this repo only) using:

```bash
npx simple-git-hooks
```

This will help us keep git history tidy, avoiding clogging up `git blame`s with linting-only commits.

## Inspecting the linting rules

This is a helpful tool for inspecting your config setup, so you can check which rules are applied, in which order:
```bash
npx @eslint/config-inspector
```

## For your IDE

In VSCode, [make sure](https://eslint.nuxt.com/packages/module#vs-code) your ESlint VS Code extension (vscode-eslint) is at least v3.0.10 (released June 2024). Turn on the 'Format on Save' setting.

# CI

Playwright tests produce HTML reports when they run, whether on CI or not, showing visual snapshots at each timestep in each test. If you need to open these, follow the instructions [here](https://playwright.dev/docs/ci-intro#html-report), particularly '[Viewing the HTML report](https://playwright.dev/docs/ci-intro#viewing-the-html-report)'.

# Production

Build the Nuxt application for production:

```bash
npm run build
```

Locally preview production build:

```bash
npm run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

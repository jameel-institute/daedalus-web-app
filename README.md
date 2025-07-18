# Analyze bundling

npx nuxi analyze

# Tests

## To run unit tests:

```bash
npm run test:unit
# Or with coverage:
npm run test:unit:coverage
```

## To run integration tests

First start the test dependencies (Mockoon server and database image):
```bash
scripts/run-integration-test-dependencies
```
Then run:
```bash
npm run test:integration
```

More information about integration test set-up in `tests/integration/INTEGRATION_TESTING.md`.

## To run end-to-end tests

'End-to-end' includes running the [R API](https://github.com/jameel-institute/daedalus.api) and its worker(s) in addition to the present application.

1. Ensure you have the service dependencies up and running (`./scripts/run-dev-dependencies`), and that the Mockoon server is not running.
1. Run:
```bash
npm run test:e2e
```

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
Omit the `--db-build-skip` flag if you are branching off, so that you build a new image for your new branch.

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

### Docker

There are Dockerfiles for both the web app (in `/docker`) and the database (in `/db`).

To run the app in docker:
- `./scripts/run-dev-dependencies`
- `./docker/build`
- `./docker/run-dev`

This will build and run the app container, exposing port 3000, so you should be able to access the web app at
http://localhost:3000 as you can when running locally outside docker.

To tear down, you'll need to Ctrl+C from the `/docker/run-dev` script before the `/scripts/run-dev-dependencies` script.

# DB

Our ORM is [Prisma](https://www.prisma.io/).

To create migrations to the database, first update the Prisma schema at ./prisma/schema.prisma as required. Then, to generate the corresponding SQL migration and to apply it to the database, start up `scripts/run-dev-dependencies` and you will be prompted to enter a name for the new migration. [You should commit both](https://www.prisma.io/docs/orm/prisma-migrate/workflows/team-development#source-control) the Prisma schema and the migration file to Git.

The below command is used to apply migrations that already exist in ./prisma/migrations but which have not been applied to the database.

```bash
npm run db:dev:migrate
```

Prisma ORM can only query the database once you 'generate' the Prisma Client, which generates into `node_modules/@prisma/client` based on the file `prisma/schema.prisma`. This should happen when you install the JS dependencies and whenever you run a migration, but if the Prisma client gets out of sync or doesn't generate, you can manually generate it:

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

# NPM dependency notes

To document why some of package.json is the way it is (since JSON doesn't support comments):

1. `@rollup/rollup-linux-x64-gnu` is an optional dependency as a fix for the issue that Rollup describes [here](https://github.com/rollup/rollup/blob/f83b3151e93253a45f5b8ccb9ccb2e04214bc490/native.js#L59) and which occurred for us when doing an installation with npm on Docker on CI. Their suggested fix does not work for our use case, because removing package-lock.json prevents the use of `npm ci`, so instead we use the solution suggested [here](https://github.com/vitejs/vite/discussions/15532#discussioncomment-10192839).

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

# Troubleshooting

If you are struggling to work out what api routes Nuxt is generating based on your filenames and file structure, inspect this file: `.nuxt/types/nitro-routes.d.ts`.

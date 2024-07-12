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

## Development Server

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

You can also expose it to your local network, so that you can try it out on a mobile device, using:

```bash
npm run dev -- --host
```

The QR code shown will allow you to quickly access the app.

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

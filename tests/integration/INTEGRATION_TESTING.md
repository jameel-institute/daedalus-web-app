# Integration tests using Mockoon

## Why?

One type of integration test needed for this app is tests of the outer interface of the web server API, namely, the responses including their metadata (e.g. status codes), and how these depend on the responses from the R API.

To run these tests, we run a test server using Vitest, and we mock the R API server with a separate service.

To run that separate service, [MSW](https://mswjs.io/) would be a common choice, but it doesn't seem to be compatible with Nuxt (at least server-side): [here](https://github.com/nuxt/test-utils/issues/775) is an example of a GitHub issue for this. So instead we are using [Mockoon](https://mockoon.com/), whose canned responses are stored in /tests/unit/mocks/mockoon.json.

## When?

This mocking service has to be up and running for integration tests to pass, and it does not interfere with uses of `registerEndpoint` (which, anyway, works by registering mock endpoints from within the web app, so can't interfere with things served on external ports).

By contrast, when we run our end-to-end suite (with Playwright), we want to test that the whole collection of services works properly in a realistic simulation, and for that we must use the real R API service. Thus, we include a check in the end-to-end tests to verify that the mock R API server is not running. We do this by sending a request to a smoke endpoint `/mock-smoke` that should never be implemented by the genuine R API. The same smoke endpoint should be used by tests that _do_ rely on the mocking service, to verify that they are being run against the mocked API.

## How?

To configure the responses, you can either directly edit the mockoon.json file (before re-starting the mock server), or use the convenient UI of the Mockoon desktop app.

To save time writing mock responses, Mockoon is able to record responses from another service, if you follow the steps in [this GitHub comment](https://github.com/mockoon/mockoon/issues/21#issuecomment-1900049410). These recorded responses can then be played back in tests, and edited.

### To run the mock server

#### From CLI:

npx mockoon-cli start --data ./mocks/mockoon.json

#### From desktop app:

Make sure the correct API config is selected in the left sidebar (not the demo config). Then click the green "play" button.

## What if we want to use a different solution?

We should be able to switch away from Mockoon to another solution if desired, by [exporting](https://mockoon.com/docs/latest/openapi/import-export-openapi-format/) the canned responses to OpenAPI format.

# Testing the web server API endpoints

In this directory, we have (at time of writing) two kinds of tests: those which test that an endpoint on our server, such as /api/versions, performs the correct actions, and those which test utilities (such as the rApi utility) which are consumed by our endpoints.

In the latter case, unit testing is quite simple. We are able to invoke the functions that are exported from our utility, and mock the R API responses using the `registerEndpoint` function provided by @nuxt/test-utils/runtime. (This requires us to use [the Nuxt runtime environment](https://nuxt.com/docs/getting-started/testing#using-a-nuxt-runtime-environment) for the test.)

However, for testing our own endpoints, there is no way to directly invoke the functions exported from our API endpoints, other than by sending requests to the endpoints they define. As a result, we are required to run our server from the test, which we achieve by using the @nuxt/test-utils/e2e module (and we use the module's in-built [`fetch`](https://nuxt.com/docs/getting-started/testing#fetchurl-1) function to send the requests). The fact that Vitest is running a whole test server means these tests are not zoomed-in unit tests that are able to test a small piece of code, but are more like integration tests, since they run the server entirely, and they also (as we'll come onto later) use a mock server to mock responses from external APIs (namely, the R API).

Although the set-up just described is not very unit-like and is more like an integration test, it is the closest to unit-testing that the Nuxt eco-system seems to currently offer if you need to test calling any API endpoints which belong to your server.

The @nuxt/test-utils/e2e module just mentioned, which has Vitest run the test server, is [documented as being incompatible](https://nuxt.com/docs/getting-started/testing#conflict-with-end-to-end-testing) with using the @nuxt/test-utils/runtime module that provides `registerEndpoint` which mocks API responses. That `registerEndpoint` function seems to be the only way Nuxt's `$fetch` function can be mocked, so the tests necessarily make real requests, and we have to use a much more heavy-weight solution to mock the R API responses. We achieve this by running a separate service to mock R API responses, which enables us to control the response content, status, headers, etc. independently of the current version of the real R API package, just as we would have done if we were able to write unit tests.

## Mockoon

To run that separate service, [MSW](https://mswjs.io/) would be a common choice, but it doesn't seem to be compatible with Nuxt (at least server-side): [here](https://github.com/nuxt/test-utils/issues/775) is an example of a GitHub issue for this. So instead we are using [Mockoon](https://mockoon.com/), whose canned responses are stored in /tests/unit/mocks/mockoon.json. To configure the responses, you can either directly edit that file (before re-starting the mock server), or use the convenient UI of the Mockoon desktop app.

To save time writing mock responses, Mockoon is able to record responses from another service, if you follow the steps in [this GitHub comment](https://github.com/mockoon/mockoon/issues/21#issuecomment-1900049410). These recorded responses can then be played back in tests, and edited.

This mocking service has to be up and running for unit tests to pass, and it does not interfere with uses of `registerEndpoint` (which, anyway, works by registering mock endpoints from within the web app, so can't interfere with things served on external ports). By contrast, when we run our end-to-end suite (with Playwright), we want to test that the whole collection of services works properly in a realistic simulation, and for that we must use the real R API service. Thus, we include a check in the end-to-end tests to verify that the mock R API server is not running. We do this by sending a request to a smoke endpoint `/mock-smoke` that should never be implemented by the genuine R API. The same smoke endpoint should be used by tests that do rely on the mocking service, to verify that they are being run against the mocked API.

We should be able to switch away from Mockoon to another solution if desired, by [exporting](https://mockoon.com/docs/latest/openapi/import-export-openapi-format/) the canned responses to OpenAPI format.

### To run the mock server

#### From CLI:

npx mockoon-cli start --data ./tests/unit/mocks/mockoon.json

#### From desktop app:

Make sure the correct API config is selected in the left sidebar (not the demo config). Then click the green "play" button.

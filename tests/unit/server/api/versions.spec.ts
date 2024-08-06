// Import the 'fetch' documented at the below URL as 'nuxtFetch' to avoid conflicts with Node's own 'fetch' function
// https://nuxt.com/docs/getting-started/testing#fetchurl-1
import { fetch as nuxtTestUtilsFetch, setup } from "@nuxt/test-utils/e2e";
import { beforeAll, describe, expect, it } from "vitest";

const nodeFetch = fetch; // Normal 'fetch' from Node

beforeAll(async () => {
  // Verify that the user of the test suite has started the mock server
  // by checking that the server is listening on localhost:8001

  let response;
  try {
    response = await nodeFetch("http://localhost:8001/mock-smoke"); // Use Node's fetch so that we can set a different base URL with port 8001.
  } catch (error) {
    if (response?.status !== 200) {
      process.stdout.write("The mock server couldn't be found. Please run `npx mockoon-cli start --data ./mocks/mockoon.json` or use the Mockoon desktop app.");
    }
  }

  // A failure for CI to break on.
  expect(response?.status).toBe(200);
});

describe("api/versions", async () => {
  // Run the setup function to start the Nuxt server
  await setup({
    runner: "vitest", // this is the default value but I'm just making it explicit
  });

  it("returns the expected version data", async () => {
    const response = await nuxtTestUtilsFetch("/api/versions");
    const json = await response.json();

    expect(json.daedalusModel).toBe("externally mocked daedalus model version");
    expect(json.daedalusApi).toBe("externally mocked R API version");
    expect(json.daedalusWebApp).toMatch(/(\d+\.)?(\d+\.)?(\*|\d+)/);
  });
});

// // MSW REQUIRES NODE ENVIRONMENT NOT NUXT

// // @vitest-environment node

// import { describe, expect, it } from "vitest";

// import { beforeAll, afterEach, afterAll } from 'vitest'
// import { server } from '@/mocks/node'
// import { fetch, setup } from "@nuxt/test-utils/e2e";

// beforeAll(() => server.listen())
// afterEach(() => server.resetHandlers())
// afterAll(() => server.close())

// server.events.on('request:start', ({ request }) => {
//   console.log('MSW intercepted:', request.method, request.url)
// })

// describe("test", async () => {
//   await setup({
//     runner: "vitest", // this is the default value but I'm just making it explicit
//   });

//   it('can test', async () => {
//     // await fetch('/')

//     expect(true).toBe(true)

//     const res = await fetch("/api/versions");

//     console.warn(res)
//     console.warn(res.body)
//     console.warn('that was body')

//     const json = await res.json()
//     console.warn(json)

//     console.warn('that was json')
//     const bjson = await res.body
//     console.warn(bjson)
//     console.warn('that was bjson')
//     // const { body, headers } = res;

//     // get content from readable stream 'body'
//     // console.log(body.json());

//     expect(json).toEqual({
//       data: "expectedData",
//     });
//   })
// })

// // NUXT ENVIRONMENT VERSION FOLLOWS

// // import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
// // import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
// // import { waitFor } from "@testing-library/vue";

// // import ApiTester from "@/components/tests/ApiTester.vue";

// // describe("api tester", () => {
// //   it("can open the sidebar from the app header", async () => {
// //     // registerEndpoint("/api/versions", () => {
// //     //   return {
// //     //     daedalusModel: "1.2.3",
// //     //     daedalusApi: "4.5.6",
// //     //     daedalusWebApp: "7.8.9",
// //     //   };
// //     // });

// //     registerEndpoint("/", () => {
// //       return {
// //         daedalus: "1.2.3",
// //         "daedalus.api": "4.5.6",
// //       };
// //     });

// //     const component = await mountSuspended(ApiTester, { props: { apiEndpoint: "/api/versions" } });

// //     await waitFor(() => {
// //       console.log(20)
// //       expect(component.vm.apiData.value).toBe({
// //         daedalusModel: '1.2.3',
// //         daedalusApi: '4.5.6',
// //         daedalusWebApp: '7.8.9'
// //       });
// //       console.log(22)
// //       const attributes = component.find(`[data-testid="div"]`).attributes()
// //       const dataResponseData = attributes["data-response-data"];
// //       const dataReponseStatus = attributes["data-response-status"];
// //       console.log(attributes);
// //       console.log(component.html());
// //       expect(dataResponseData).toContain("daedalusModel: 1.2.3");
// //       // expect(logoTitleAttribute).toContain("R API version: 4.5.6");
// //       // expect(logoTitleAttribute).toContain("Web app version: 7.8.9");
// //     });
// //   });
// // });

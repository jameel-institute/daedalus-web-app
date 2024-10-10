// Note, as there are no real tests in the tests/ssr/ folder, these are not yet
// run on CI.

import { $fetch, setup } from "@nuxt/test-utils/e2e";
import { describe, expect } from "vitest";

describe("my test", async () => {
  await setup({
    runner: "vitest", // this is the default value but I'm just making it explicit
  });

  it("server-rendered content", async () => {
    const html = await $fetch("/");

    // screen.debug()
    expect(html).toContain("DAEDALUS Explore");
  });
});

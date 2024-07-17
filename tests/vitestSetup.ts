import { config } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import en from "@/config/i18n/en";

// https://github.com/nuxt-modules/i18n/issues/2637
// https://github.com/nuxt/test-utils/issues/566
// https://github.com/nuxt/test-utils/issues/585
const i18n = createI18n({
  legacy: false,
  locale: "en",
  messages: { en },
});
config.global.plugins.push(i18n);

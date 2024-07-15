export default defineI18nConfig(() => ({
  legacy: false,
  locale: "en",
  messages: {
    en: {
      app: "DAEDALUS Explore",
      buttons: {
        share: "Share",
        download: "Download",
        notes: {
          add: "Add note",
        },
        help: "Help",
      },
      parameters: {
        policy: "policy response",
        country: "country",
        investment: "advance investment level",
        pathogen: "pathogen",
      },
      scenarios: {
        new: {
          heading: "New scenario",
        },
      },
      comparisons: {
        index: {
          heading: "Outcomes by {parameter}",
        },
      },
      bookmarks: {
        index: {
          heading: "Bookmarks",
        },
      },
      history: {
        index: {
          heading: "My history",
        },
      },
      img: {
        logo: "Imperial College and Community Jameel logo",
      },
    },
  },
}));

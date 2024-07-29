const rApiAddress = "http://localhost:8001";

export default defineEventHandler(async (event) => {
  // const body = await readBody(event);
  // console.log(body);
  // console.log(event);

  // const rApiQueryParams = { test: 'test' }

  // TODO forward the method too

  const response = await $fetch(rApiAddress, {
    // query: rApiQueryParams,
    async onRequestError({ request, _options, error }) {
      console.log("[fetch request error]", request, error);
    },
  })
    .catch((error) => {
      console.log('got here innit')


      console.error(error.data);
    });

  return response;
})

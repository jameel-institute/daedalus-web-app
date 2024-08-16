export default defineEventHandler(async (event) => {
  console.warn("This would be the other way of hooking into a request.");

  console.warn(event.node.req.headers);

  event.context.sessionId = 123;
});

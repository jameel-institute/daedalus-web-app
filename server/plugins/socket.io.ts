// This is the server side of socket.io
// Copied from https://socket.io/how-to/use-with-nuxt

import type { NitroApp } from "nitropack";
import { Server as Engine } from "engine.io";
import { defineEventHandler } from "h3";
import { Server } from "socket.io";

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine();
  const io = new Server({
    serveClient: false, // Since we're using the client library from node modules, we don't need to serve it. https://socket.io/docs/v4/client-installation/#installation
    cors: {
      origin: "http://localhost:3000", // According to https://socket.io/how-to/use-with-vue
    },
    // https://socket.io/docs/v4/connection-state-recovery
    connectionStateRecovery: {
      // the backup duration of the sessions and the packets
      maxDisconnectionDuration: 2 * 60 * 1000,
      // whether to skip middlewares upon successful recovery
      skipMiddlewares: true,
    },
  });

  io.bind(engine);

  io.on("connection", (socket) => {
    // For debugging websockets connection only:
    // Every 1000ms, emit a message to the client containing the current time on the server
    setInterval(() => {
      socket.emit("time", new Date().toTimeString());
    }, 1000);
  });

  io.engine.on("connection_error", (err) => {
    /* eslint-disable no-console */
    console.log(err.req); // the request object
    console.log(err.code); // the error code, for example 1
    console.log(err.message); // the error message, for example "Session ID unknown"
    console.log(err.context); // some additional error context
  });

  nitroApp.router.use("/socket.io/", defineEventHandler({
    handler(event) {
      engine.handleRequest(event.node.req, event.node.res);
      event._handled = true;
    },
    websocket: {
      open(peer) {
        const nodeContext = peer.ctx.node;
        const req = nodeContext.req;

        // @ts-expect-error private method
        engine.prepare(req);

        const rawSocket = nodeContext.req.socket;
        const websocket = nodeContext.ws;

        // @ts-expect-error private method
        engine.onWebSocket(req, rawSocket, websocket);
      },
    },
  }));
});

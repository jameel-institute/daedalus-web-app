// This is the server side of socket.io
// Copied from https://socket.io/how-to/use-with-nuxt

import type { NitroApp } from "nitropack";
import { Server as Engine } from "engine.io";
import { Server } from "socket.io";
import { defineEventHandler } from "h3";

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine();
  const io = new Server({
    serveClient: false, // Since we're using the client library from node modules, we don't need to serve it. https://socket.io/docs/v4/client-installation/#installation
    transports: ["polling"], // Disable actual websocket transport, only use long-polling. https://socket.io/docs/v3/server-initialization/#transports
  });

  io.bind(engine);

  io.on("connection", (socket) => {
    // ...
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
      }
    }
  }));
});
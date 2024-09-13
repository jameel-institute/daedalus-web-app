// This is the client side of socket.io
// https://socket.io/how-to/use-with-nuxt

// Make sure you never try to use this code during server-side rendering

import { io } from "socket.io-client";

// https://dev.to/mellewynia/quick-guide-to-add-websocket-to-nuxt-3-4bi4
const url = `${location.protocol === "https:" ? "wss://" : "ws://"}${location.host}`;

export const socket = io(url);

interface SocketIOError extends Error {
  description?: string
  context?: unknown
}

socket.on("connect_error", (err: SocketIOError) => {
  /* eslint-disable no-console */
  // the reason of the error, for example "xhr poll error"
  console.log(err.message);

  // some additional description, for example the status code of the initial HTTP response
  console.log(err.description);

  // some additional context, for example the XMLHttpRequest object
  console.log(err.context);
});

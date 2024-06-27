// This is the client side of socket.io
// https://socket.io/how-to/use-with-nuxt

// Make sure you never try to use this code during server-side rendering

import { io } from "socket.io-client";

export const socket = io(
    {  // Disable actual websocket transport, only use long-polling. https://socket.io/docs/v3/client-initialization/#transports
        transports: ["polling"],
    }
);
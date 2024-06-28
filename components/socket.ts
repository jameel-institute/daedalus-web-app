// This is the client side of socket.io
// https://socket.io/how-to/use-with-nuxt

// Make sure you never try to use this code during server-side rendering

import { io } from "socket.io-client";

export const socket = io();

socket.on("connect_error", (err) => {
    // the reason of the error, for example "xhr poll error"
    console.log(err.message);

    // some additional description, for example the status code of the initial HTTP response
    console.log((err as any).description);

    // some additional context, for example the XMLHttpRequest object
    console.log((err as any).context);
});
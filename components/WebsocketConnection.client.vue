<!-- This component is for debugging websockets connections. Include it in a layout to see whether the
 client is currently connected to the server, and whether websockets transport is available. -->

<template>
  <div>
    <p>Status: {{ isConnected ? "connected" : "disconnected" }}</p>
    <p>Transport: {{ transport }}</p>
    <p>Time on the server: {{ time }}</p>
  </div>
</template>

<script lang="ts" setup>
import { socket } from "./socket";

const isConnected = ref(false);
const transport = ref("N/A");
const time = ref("N/A");

if (socket.connected) {
  onConnect();
}

function checkConnectionStatus() {
  if (socket.connected) {
    onConnect();
  } else {
    onDisconnect();
  }
}

function onConnect() {
  isConnected.value = true;
  transport.value = socket.io.engine.transport.name;

  socket.io.engine.on("upgrade", (rawTransport) => {
    transport.value = rawTransport.name;
  });
}

function onDisconnect() {
  isConnected.value = false;
  transport.value = "N/A";
}

socket.on("connect", onConnect);
socket.on("disconnect", onDisconnect);
socket.on("time", (timeMessage) => {
  time.value = timeMessage;
});

// Set interval to check connection status every 65 seconds (65 because nginx's default proxy_read_timeout is 60)
// This test gave me some confidence that socket.IO (or somebody) is keeping the connection alive regardless of proxy_read_timeout - unless it's just from the hot-module-reloading.
const statusCheckInterval = setInterval(checkConnectionStatus, 65000);

onBeforeUnmount(() => {
  socket.off("connect", onConnect);
  socket.off("disconnect", onDisconnect);
  if (statusCheckInterval !== undefined) {
    clearInterval(statusCheckInterval);
  }
});
</script>

<style>

</style>

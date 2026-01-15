const statusEl = document.getElementById("status");
const pingButton = document.getElementById("ping");
const logEl = document.getElementById("log");

if (typeof Colyseus === "undefined") {
  statusEl.textContent = "Client library failed to load.";
} else {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const client = new Colyseus.Client(`${protocol}://${location.host}`);

  async function connect() {
    try {
      const room = await client.joinOrCreate("lobby");
      statusEl.textContent = `Connected: ${room.sessionId}`;
      pingButton.disabled = false;

      room.onMessage("server:event", (message) => {
        logEl.textContent = `Server: ${JSON.stringify(message)}`;
      });

      pingButton.addEventListener("click", () => {
        room.send("client:event", {
          type: "ping",
          payload: { at: Date.now() }
        });
      });
    } catch (err) {
      statusEl.textContent = "Connection failed. Is the host running?";
      console.error(err);
    }
  }

  connect();
}

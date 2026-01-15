const statusEl = document.getElementById("status");
const joinButton = document.getElementById("join");
const pingButton = document.getElementById("ping");
const logEl = document.getElementById("log");
const nicknameInput = document.getElementById("nickname");
const playerCountEl = document.getElementById("player-count");
const playersEl = document.getElementById("players");

let room = null;

const updatePlayers = (state) => {
  playerCountEl.textContent = state.count ?? 0;
  playersEl.innerHTML = (state.players || [])
    .map((player) => `<li>${player.nickname}</li>`)
    .join("");
};

const connect = async () => {
  if (typeof Colyseus === "undefined") {
    statusEl.textContent = "Client library failed to load.";
    return;
  }

  joinButton.disabled = true;
  statusEl.textContent = "Connecting...";

  try {
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const client = new Colyseus.Client(`${protocol}://${location.host}`);
    const nickname = nicknameInput.value.trim();

    room = await client.joinOrCreate("lobby", { nickname });
    statusEl.textContent = `Connected: ${room.sessionId}`;
    pingButton.disabled = false;

    room.onMessage("server:event", (message) => {
      logEl.textContent = `Server: ${JSON.stringify(message)}`;
    });

    room.onMessage("lobby:state", updatePlayers);

    pingButton.addEventListener("click", () => {
      room.send("client:event", {
        type: "ping",
        payload: { at: Date.now() }
      });
    });
  } catch (err) {
    statusEl.textContent = "Connection failed. Is the host running?";
    joinButton.disabled = false;
    console.error(err);
  }
};

joinButton.addEventListener("click", connect);

nicknameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    connect();
  }
});

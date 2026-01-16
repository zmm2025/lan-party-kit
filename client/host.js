const statusEl = document.getElementById("status");
const playerCountEl = document.getElementById("player-count");
const playersEl = document.getElementById("players");
const joinListEl = document.getElementById("join-urls");
const qrImg = document.getElementById("qr");
const startButton = document.getElementById("start-game");
const phaseEl = document.getElementById("phase");
const lockButton = document.getElementById("lock-lobby");
const spectatorCountEl = document.getElementById("spectator-count");
const spectatorsEl = document.getElementById("spectators");
const hostCard = document.getElementById("host-card");
const hostBlockedCard = document.getElementById("host-blocked");
const goPlayerButton = document.getElementById("go-player");

const { roomName, hostDataEndpoint } = window.AppConfig;
const { ensureColyseus, getWsEndpoint, renderJoinUrls, pingLevelFromMs } = window.AppShared;

const DEFAULT_AVATAR = "\u{1F47E}";

let lobbyLocked = false;
let primaryJoinUrl = "/";

const showHostBlocked = () => {
  if (hostCard) {
    hostCard.classList.add("hidden");
  }
  if (hostBlockedCard) {
    hostBlockedCard.classList.remove("hidden");
  }
  if (goPlayerButton) {
    goPlayerButton.onclick = () => {
      window.location.href = primaryJoinUrl;
    };
  }
};

const connectHost = () => {
  if (!ensureColyseus(statusEl)) {
    return;
  }

  const client = new Colyseus.Client(getWsEndpoint());
  client
    .joinOrCreate(roomName, { role: "host" })
    .then((room) => {
      statusEl.textContent = "Lobby online.";
      lockButton.addEventListener("click", () => {
        lobbyLocked = !lobbyLocked;
        room.send("host:lock", { locked: lobbyLocked });
        updateLockButton();
      });
      startButton.addEventListener("click", () => {
        room.send("host:start");
      });

      room.onMessage("host:error", (payload) => {
        statusEl.textContent = payload?.message || "Unable to start yet.";
      });

      room.onMessage("game:start", () => {
        statusEl.textContent = "Game started.";
      });

      room.onMessage("lobby:config", (config) => {
        updatePhase(config?.phase);
        updateStartButton(config?.settings, { count: 0, allReady: false, phase: config?.phase });
        lobbyLocked = Boolean(config?.settings?.lobbyLocked);
        updateLockButton();
      });

      room.onMessage("lobby:state", (state) => {
        renderHostList(playersEl, playerCountEl, state.players || [], room, {
          defaultAvatar: DEFAULT_AVATAR
        });
        renderHostList(spectatorsEl, spectatorCountEl, state.spectators || [], room, {
          hideReady: true
        });
        updatePhase(state.phase);
        updateStartButton(state.settings, state);
        lobbyLocked = Boolean(state?.settings?.lobbyLocked);
        updateLockButton();
      });
    })
    .catch((error) => {
      console.error(error);
      showHostBlocked();
    });
};

const updatePhase = (phase) => {
  if (phaseEl) {
    phaseEl.textContent = `Phase: ${phase === "in-game" ? "In Game" : "Lobby"}`;
  }
};

const updateStartButton = (settings, state) => {
  if (!startButton) {
    return;
  }
  const requireReady = settings?.requireReady;
  const hasPlayers = (state?.count ?? 0) > 0;
  const canStart =
    state?.phase === "lobby" && hasPlayers && (!requireReady || Boolean(state?.allReady));

  startButton.disabled = !canStart;
  startButton.textContent = state?.phase === "in-game" ? "Game in progress" : "Start Game";
};

const updateLockButton = () => {
  if (!lockButton) {
    return;
  }
  lockButton.disabled = false;
  lockButton.textContent = lobbyLocked ? "Unlock Lobby" : "Lock Lobby";
};

const renderHostList = (listEl, countEl, items, room, options = {}) => {
  if (countEl) {
    const connectedCount = items.filter((item) => item.connected).length;
    countEl.textContent = connectedCount;
  }
  if (!listEl) {
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach((participant) => {
    const listItem = document.createElement("li");
    listItem.classList.add("list-item");

    const playerName = document.createElement("span");
    playerName.classList.add("player-name");

    const avatarValue = participant.avatar ?? options.defaultAvatar;
    if (avatarValue) {
      const avatar = document.createElement("span");
      avatar.classList.add("avatar");
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = avatarValue;
      playerName.appendChild(avatar);
    }

    const tags = [];
    if (!options.hideReady && participant.ready) {
      tags.push("ready");
    }
    if (participant.connected === false) {
      tags.push("away");
    }
    const suffix = tags.length ? ` (${tags.join(", ")})` : "";
    const ping =
      typeof participant.pingMs === "number" ? ` - ${Math.round(participant.pingMs)}ms` : "";

    const nickname = document.createElement("span");
    nickname.classList.add("nickname");
    nickname.textContent = `${participant.nickname}${suffix}${ping}`;
    playerName.appendChild(nickname);

    const level = pingLevelFromMs(participant.pingMs);
    const wifi = document.createElement("span");
    wifi.classList.add("wifi");
    wifi.setAttribute("data-level", level);
    wifi.setAttribute("aria-label", "Connection strength");

    ["b1", "b2", "b3", "b4"].forEach((barClass) => {
      const bar = document.createElement("span");
      bar.classList.add("bar", barClass);
      wifi.appendChild(bar);
    });

    const kickButton = document.createElement("button");
    kickButton.classList.add("kick");
    kickButton.setAttribute("data-kick-id", participant.id);
    kickButton.textContent = "Kick";

    listItem.appendChild(playerName);
    listItem.appendChild(wifi);
    listItem.appendChild(kickButton);
    fragment.appendChild(listItem);
  });

  listEl.replaceChildren(fragment);

  listEl.onclick = (event) => {
    const button = event.target.closest("button[data-kick-id]");
    if (!button) {
      return;
    }
    const targetId = button.getAttribute("data-kick-id");
    if (targetId) {
      room.send("host:kick", { targetId });
    }
  };
};

fetch(hostDataEndpoint)
  .then((res) => res.json())
  .then((data) => {
    qrImg.src = data.qrDataUrl;
    const joinUrls = data.joinUrls || [];
    primaryJoinUrl = joinUrls[0] || "/";
    renderJoinUrls(joinListEl, joinUrls);
    connectHost();
  })
  .catch((error) => {
    console.error(error);
    statusEl.textContent = "Failed to load host data.";
  });

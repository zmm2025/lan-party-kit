window.AppShared = {
  pingLevelFromMs(pingMs) {
    if (typeof pingMs !== "number") {
      return 0;
    }
    if (pingMs < 60) {
      return 4;
    }
    if (pingMs < 120) {
      return 3;
    }
    if (pingMs < 200) {
      return 2;
    }
    return 1;
  },
  ensureColyseus(statusEl) {
    if (typeof Colyseus === "undefined") {
      if (statusEl) {
        statusEl.textContent = "Client library failed to load.";
      }
      return false;
    }
    return true;
  },
  getWsEndpoint() {
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    return protocol + "://" + location.host;
  },
  renderPlayers(playersEl, countEl, state) {
    if (countEl) {
      countEl.textContent = state.count ?? 0;
    }
    if (!playersEl) {
      return;
    }

    const fragment = document.createDocumentFragment();
    (state.players || []).forEach((player) => {
      const listItem = document.createElement("li");
      listItem.classList.add("list-item");

      const playerName = document.createElement("span");
      playerName.classList.add("player-name");

      if (player.avatar) {
        const avatar = document.createElement("span");
        avatar.classList.add("avatar");
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = player.avatar;
        playerName.appendChild(avatar);
      }

      const tags = [];
      if (player.ready) {
        tags.push("ready");
      }
      if (player.connected === false) {
        tags.push("away");
      }
      const suffix = tags.length ? ` (${tags.join(", ")})` : "";
      const ping =
        typeof player.pingMs === "number" ? ` - ${Math.round(player.pingMs)}ms` : "";

      const nickname = document.createElement("span");
      nickname.classList.add("nickname");
      nickname.textContent = `${player.nickname}${suffix}${ping}`;
      playerName.appendChild(nickname);

      const level = window.AppShared.pingLevelFromMs(player.pingMs);
      const wifi = document.createElement("span");
      wifi.classList.add("wifi");
      wifi.setAttribute("data-level", level);
      wifi.setAttribute("aria-label", "Connection strength");

      ["b1", "b2", "b3", "b4"].forEach((barClass) => {
        const bar = document.createElement("span");
        bar.classList.add("bar", barClass);
        wifi.appendChild(bar);
      });

      listItem.appendChild(playerName);
      listItem.appendChild(wifi);
      fragment.appendChild(listItem);
    });

    playersEl.replaceChildren(fragment);
  },
  renderJoinUrls(joinListEl, urls) {
    if (joinListEl) {
      joinListEl.innerHTML = urls.map((url) => `<li><code>${url}</code></li>`).join("");
    }
  }
};

import colyseus from "colyseus";

const { Room } = colyseus;
type Client = colyseus.Client;

type ClientMessage = {
  type: string;
  payload?: unknown;
};

type PlayerInfo = {
  nickname: string;
};

const MAX_NICKNAME_LENGTH = 20;

export class LobbyRoom extends Room {
  private players = new Map<string, PlayerInfo>();
  private hostSessions = new Set<string>();

  onCreate() {
    this.onMessage("client:event", (client, message: ClientMessage) => {
      this.broadcast("server:event", {
        from: client.sessionId,
        receivedAt: Date.now(),
        message
      });
    });

    // Client can rename once connected; hosts are excluded.
    this.onMessage("client:nickname", (client, message: { nickname?: string }) => {
      if (this.hostSessions.has(client.sessionId)) {
        return;
      }

      const nickname = this.makeNickname(message.nickname ?? "", client.sessionId);
      this.players.set(client.sessionId, { nickname });
      this.broadcastState();
    });
  }

  onJoin(client: Client, options?: { nickname?: string; role?: string }) {
    if (options?.role === "host") {
      this.hostSessions.add(client.sessionId);
      client.send("server:event", {
        from: "server",
        receivedAt: Date.now(),
        message: {
          type: "host:welcome",
          payload: { sessionId: client.sessionId }
        }
      });
      this.broadcastState();
      return;
    }

    const nickname = this.makeNickname(options?.nickname ?? "", client.sessionId);
    this.players.set(client.sessionId, { nickname });

    client.send("server:event", {
      from: "server",
      receivedAt: Date.now(),
      message: {
        type: "welcome",
        payload: { sessionId: client.sessionId, nickname }
      }
    });

    this.broadcastState();
  }

  onLeave(client: Client) {
    this.players.delete(client.sessionId);
    this.hostSessions.delete(client.sessionId);
    this.broadcastState();
  }

  private broadcastState() {
    const players = [...this.players.entries()].map(([id, info]) => ({
      id,
      nickname: info.nickname
    }));

    this.broadcast("lobby:state", {
      players,
      count: players.length
    });
  }

  private makeNickname(raw: string, sessionId: string) {
    const base = raw.trim().replace(/\s+/g, " ").slice(0, MAX_NICKNAME_LENGTH);
    const defaultName = `Player ${sessionId.slice(0, 4).toUpperCase()}`;
    let nickname = base || defaultName;

    const existingNames = new Set(
      [...this.players.entries()]
        .filter(([id]) => id !== sessionId)
        .map(([, info]) => info.nickname.toLowerCase())
    );

    if (!existingNames.has(nickname.toLowerCase())) {
      return nickname;
    }

    let suffix = 2;
    let candidate = `${nickname} ${suffix}`;
    while (existingNames.has(candidate.toLowerCase())) {
      suffix += 1;
      candidate = `${nickname} ${suffix}`;
    }

    return candidate;
  }
}

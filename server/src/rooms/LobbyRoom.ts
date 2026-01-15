import colyseus from "colyseus";

const { Room } = colyseus;
type Client = colyseus.Client;

type ClientMessage = {
  type: string;
  payload?: unknown;
};

export class LobbyRoom extends Room {
  onCreate() {
    this.onMessage("client:event", (client, message: ClientMessage) => {
      this.broadcast("server:event", {
        from: client.sessionId,
        receivedAt: Date.now(),
        message
      });
    });
  }

  onJoin(client: Client) {
    client.send("server:event", {
      from: "server",
      receivedAt: Date.now(),
      message: {
        type: "welcome",
        payload: { sessionId: client.sessionId }
      }
    });
  }
}

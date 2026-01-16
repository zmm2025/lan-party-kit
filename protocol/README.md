# Protocol

This folder documents client/host/server message formats.

## Lobby messages

### Client -> Server
- `client:event` payload:
  - `{ type: string, payload?: unknown }`
- `client:ping` payload:
  - `{ sentAt: number }`
- `client:nickname` payload:
  - `{ nickname?: string }`
- `client:ready` payload:
  - `{ ready?: boolean }`
- `host:lock` payload:
  - `{ locked: boolean }`
- `host:kick` payload:
  - `{ targetId: string }`
- `host:start` payload:
  - `{}`

### Server -> Client
- `server:event` payload:
  - `{ from: string, receivedAt: number, message: { type: string, payload?: unknown } }`
  - `message.type = "welcome"` payload:
    - `{ sessionId: string, nickname: string, token: string, role: "player" | "spectator", rejoined?: boolean, ready?: boolean }`
- `server:pong` payload:
  - `{ sentAt: number, receivedAt: number, pingMs: number | null }`
- `lobby:state` payload:
  - `{ count: number, totalCount: number, readyCount: number, allReady: boolean, phase: "lobby" | "in-game", settings: { requireReady: boolean, allowRejoin: boolean, allowMidgameJoin: boolean, lobbyLocked: boolean }, players: Array<{ id: string, nickname: string, ready: boolean, connected: boolean, pingMs: number | null }>, spectatorCount: number, totalSpectatorCount: number, spectators: Array<{ id: string, nickname: string, connected: boolean, pingMs: number | null }> }`
- `lobby:config` payload:
  - `{ settings: { requireReady: boolean, allowRejoin: boolean, allowMidgameJoin: boolean, lobbyLocked: boolean }, phase: "lobby" | "in-game" }`
- `game:start` payload:
  - `{ startedAt: number, startedBy: string }`
- `host:error` payload:
  - `{ message: string }`
- `server:kick` payload:
  - `{ reason: string }`

### Error surface
Authentication rejections are raised as Colyseus room errors; clients should subscribe to
`room.onError((code, message) => ...)` and display the server-provided `message` when present.
Typical messages include:
- `"Lobby locked"` when the host has locked the lobby.
- `"Game already started"` when mid-game joins are disallowed.

## Host data endpoint

- `GET /host-data` returns:
  - `{ joinUrls: string[], qrDataUrl: string }`

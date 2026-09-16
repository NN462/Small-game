import { WebSocketServer } from 'ws';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT || 8787);
const MAX_PLAYERS = 4;
const COLORS = ['#ff9aba', '#7ec8ff', '#b8f07a', '#ffd56a'];

/** @typedef {{ id: string, name: string, color: string, x: number, y: number, z: number, ry: number, score: number, ws: import('ws').WebSocket }} Player */
/** @typedef {{ code: string, players: Map<string, Player>, stars: Set<number>, hostId: string, createdAt: number }} Room */

/** @type {Map<string, Room>} */
const rooms = new Map();
/** @type {Map<import('ws').WebSocket, { playerId: string, roomCode: string | null }>} */
const sockets = new Map();

function makeRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return rooms.has(code) ? makeRoomCode() : code;
}

function send(ws, payload) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
}

function broadcast(room, payload, exceptId) {
  for (const p of room.players.values()) {
    if (exceptId && p.id === exceptId) continue;
    send(p.ws, payload);
  }
}

function publicPlayer(p) {
  return {
    id: p.id,
    name: p.name,
    color: p.color,
    x: p.x,
    y: p.y,
    z: p.z,
    ry: p.ry,
    score: p.score,
  };
}

function leaveRoom(ws) {
  const meta = sockets.get(ws);
  if (!meta?.roomCode) return;
  const room = rooms.get(meta.roomCode);
  sockets.set(ws, { playerId: meta.playerId, roomCode: null });
  if (!room) return;

  room.players.delete(meta.playerId);
  broadcast(room, { type: 'player_left', id: meta.playerId });

  if (room.players.size === 0) {
    rooms.delete(room.code);
    return;
  }
  if (room.hostId === meta.playerId) {
    room.hostId = room.players.keys().next().value;
    broadcast(room, { type: 'host', id: room.hostId });
  }
}

function joinRoom(ws, roomCode, name) {
  const code = String(roomCode || '').toUpperCase().trim();
  const room = rooms.get(code);
  const meta = sockets.get(ws);
  if (!meta) return;
  if (!room) {
    send(ws, { type: 'error', message: '房间不存在' });
    return;
  }
  if (room.players.size >= MAX_PLAYERS) {
    send(ws, { type: 'error', message: '房间已满（最多4人）' });
    return;
  }

  leaveRoom(ws);

  const color = COLORS[room.players.size % COLORS.length];
  /** @type {Player} */
  const player = {
    id: meta.playerId,
    name: (name || '猫咪').slice(0, 12),
    color,
    x: room.players.size * 0.6,
    y: 0,
    z: 0,
    ry: 0,
    score: 0,
    ws,
  };
  room.players.set(player.id, player);
  sockets.set(ws, { playerId: player.id, roomCode: room.code });

  send(ws, {
    type: 'welcome',
    id: player.id,
    room: room.code,
    hostId: room.hostId,
    maxPlayers: MAX_PLAYERS,
    players: [...room.players.values()].map(publicPlayer),
    stars: [...room.stars],
  });
  broadcast(room, { type: 'player_joined', player: publicPlayer(player) }, player.id);
}

function createRoom(ws, name) {
  const meta = sockets.get(ws);
  if (!meta) return;
  leaveRoom(ws);

  const code = makeRoomCode();
  const color = COLORS[0];
  /** @type {Player} */
  const player = {
    id: meta.playerId,
    name: (name || '猫咪').slice(0, 12),
    color,
    x: 0,
    y: 0,
    z: 0,
    ry: 0,
    score: 0,
    ws,
  };
  /** @type {Room} */
  const room = {
    code,
    players: new Map([[player.id, player]]),
    stars: new Set(),
    hostId: player.id,
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  sockets.set(ws, { playerId: player.id, roomCode: code });

  send(ws, {
    type: 'welcome',
    id: player.id,
    room: code,
    hostId: room.hostId,
    maxPlayers: MAX_PLAYERS,
    players: [publicPlayer(player)],
    stars: [],
  });
}

const wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' });

wss.on('connection', (ws) => {
  const playerId = randomUUID();
  sockets.set(ws, { playerId, roomCode: null });

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }
    const meta = sockets.get(ws);
    if (!meta) return;

    switch (msg.type) {
      case 'create':
        createRoom(ws, msg.name);
        break;
      case 'join':
        joinRoom(ws, msg.room, msg.name);
        break;
      case 'leave':
        leaveRoom(ws);
        break;
      case 'state': {
        const room = meta.roomCode ? rooms.get(meta.roomCode) : null;
        const player = room?.players.get(meta.playerId);
        if (!room || !player) return;
        player.x = Number(msg.x) || 0;
        player.y = Number(msg.y) || 0;
        player.z = Number(msg.z) || 0;
        player.ry = Number(msg.ry) || 0;
        player.score = Number(msg.score) || 0;
        broadcast(
          room,
          {
            type: 'state',
            id: player.id,
            x: player.x,
            y: player.y,
            z: player.z,
            ry: player.ry,
            score: player.score,
          },
          player.id,
        );
        break;
      }
      case 'star': {
        const room = meta.roomCode ? rooms.get(meta.roomCode) : null;
        const player = room?.players.get(meta.playerId);
        if (!room || !player) return;
        const id = Number(msg.id);
        if (!Number.isInteger(id) || id < 0) return;
        if (room.stars.has(id)) return;
        room.stars.add(id);
        player.score += 1;
        broadcast(room, { type: 'star', id, by: player.id, score: player.score });
        break;
      }
      case 'reset': {
        const room = meta.roomCode ? rooms.get(meta.roomCode) : null;
        if (!room || room.hostId !== meta.playerId) return;
        room.stars.clear();
        for (const p of room.players.values()) {
          p.score = 0;
          p.x = 0;
          p.y = 0;
          p.z = 0;
        }
        broadcast(room, { type: 'reset' });
        break;
      }
      default:
        break;
    }
  });

  ws.on('close', () => {
    leaveRoom(ws);
    sockets.delete(ws);
  });
});

// Idle room cleanup
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    if (room.players.size === 0 || now - room.createdAt > 1000 * 60 * 60 * 6) {
      rooms.delete(room.code);
    }
  }
}, 60_000);

console.log(`[cloud-cat-server] listening on ws://0.0.0.0:${PORT}`);

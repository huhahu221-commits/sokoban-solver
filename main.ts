// sokoban-solver-01 entry: push-optimal Sokoban by room decomposition.
//
// The generator builds each level as a one-square-wide hallway with up to four
// rooms off it, and a box pushed through a door into the hallway can never be
// pushed back -- so every box stays in the room it starts in and the level's
// push-optimal count is the sum of its rooms' optima. This program therefore:
//
//   1. takes the player's row for the hallway and removes it, which leaves each
//      room as its own connected component of floor;
//   2. solves each room on its own with a breadth-first search in push space
//      (states are the player's reachable region plus the box squares), which
//      returns a fewest-pushes solution for that room;
//   3. joins the rooms with ordinary walking moves, which cost no pushes.
//
// Walking moves are free under the scoring, so the joined solution takes exactly
// the sum of the rooms' optima. The search is deterministic: no clock, no
// randomness, no environment reads beyond the input directory.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const DIRS: { dx: number; dy: number; ch: string }[] = [
  { dx: 0, dy: -1, ch: 'u' },
  { dx: 0, dy: 1, ch: 'd' },
  { dx: -1, dy: 0, ch: 'l' },
  { dx: 1, dy: 0, ch: 'r' },
];

interface Level {
  w: number;
  h: number;
  floor: Set<number>;
  goals: Set<number>;
  boxes: number[];
  player: number;
}

function parse(text: string): Level {
  const rows = text.split('\n').filter((r) => r.length > 0);
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const floor = new Set<number>();
  const goals = new Set<number>();
  const boxes: number[] = [];
  let player = -1;
  for (let y = 0; y < h; y++) {
    const row = rows[y]!;
    for (let x = 0; x < w; x++) {
      const ch = x < row.length ? row[x] : '#';
      if (ch === '#') continue;
      const i = y * w + x;
      floor.add(i);
      if (ch === '.' || ch === '*' || ch === '+') goals.add(i);
      if (ch === '$' || ch === '*') boxes.push(i);
      if (ch === '@' || ch === '+') player = i;
    }
  }
  boxes.sort((a, b) => a - b);
  return { w, h, floor, goals, boxes, player };
}

/** Floods the floor reachable from `start`, avoiding `boxes`, inside `allow`. */
function flood(lv: Level, start: number, boxes: Set<number>, allow: Set<number>): number[] {
  const seen = new Set<number>([start]);
  const out: number[] = [];
  const queue: number[] = [start];
  for (let head = 0; head < queue.length; head++) {
    const c = queue[head]!;
    out.push(c);
    const cx = c % lv.w;
    const cy = (c - cx) / lv.w;
    for (const d of DIRS) {
      const nx = cx + d.dx;
      const ny = cy + d.dy;
      if (nx < 0 || ny < 0 || nx >= lv.w || ny >= lv.h) continue;
      const n = ny * lv.w + nx;
      if (seen.has(n) || boxes.has(n) || !allow.has(n)) continue;
      seen.add(n);
      queue.push(n);
    }
  }
  return out;
}

/** Walking moves from `from` to `to`, avoiding `boxes`; empty when unreachable. */
function walk(lv: Level, from: number, to: number, boxes: Set<number>, allow: Set<number>): string {
  if (from === to) return '';
  const prev = new Map<number, { p: number; ch: string }>();
  const seen = new Set<number>([from]);
  const queue: number[] = [from];
  let found = false;
  for (let head = 0; head < queue.length && !found; head++) {
    const c = queue[head]!;
    const cx = c % lv.w;
    const cy = (c - cx) / lv.w;
    for (const d of DIRS) {
      const nx = cx + d.dx;
      const ny = cy + d.dy;
      if (nx < 0 || ny < 0 || nx >= lv.w || ny >= lv.h) continue;
      const n = ny * lv.w + nx;
      if (seen.has(n) || boxes.has(n) || !allow.has(n)) continue;
      seen.add(n);
      prev.set(n, { p: c, ch: d.ch });
      if (n === to) { found = true; break; }
      queue.push(n);
    }
  }
  if (!found) return '';
  let s = '';
  let c = to;
  while (c !== from) {
    const e = prev.get(c)!;
    s = e.ch + s;
    c = e.p;
  }
  return s;
}

interface Room {
  cells: number[];
  door: number;
  porch: number;
}

/** The rooms: connected components of floor once the player's row is removed. */
function roomsOf(lv: Level): Room[] {
  const hy = Math.floor(lv.player / lv.w);
  const seen = new Set<number>();
  const rooms: Room[] = [];
  for (const s of lv.floor) {
    if (seen.has(s) || Math.floor(s / lv.w) === hy) continue;
    const cells: number[] = [];
    const queue: number[] = [s];
    seen.add(s);
    for (let head = 0; head < queue.length; head++) {
      const c = queue[head]!;
      cells.push(c);
      const cx = c % lv.w;
      const cy = (c - cx) / lv.w;
      for (const d of DIRS) {
        const nx = cx + d.dx;
        const ny = cy + d.dy;
        if (nx < 0 || ny < 0 || nx >= lv.w || ny >= lv.h) continue;
        const n = ny * lv.w + nx;
        if (seen.has(n) || !lv.floor.has(n) || ny === hy) continue;
        seen.add(n);
        queue.push(n);
      }
    }
    // The door: the room cell one step from the hallway with floor in the hallway.
    // The porch is that hallway cell: the player stands there to enter the room,
    // which matters because a box may be sitting on the door itself.
    let door = -1;
    let porch = -1;
    for (const c of cells) {
      const cx = c % lv.w;
      const cy = (c - cx) / lv.w;
      const ty = cy < hy ? cy + 1 : cy - 1;
      if (ty === hy && lv.floor.has(hy * lv.w + cx)) {
        door = c;
        porch = hy * lv.w + cx;
        break;
      }
    }
    if (door < 0) { door = cells[0]!; porch = door; }
    rooms.push({ cells, door, porch });
  }
  return rooms;
}

/** A box off its goal in a corner can never be saved; prunes those states. */
function dead(lv: Level, box: number): boolean {
  if (lv.goals.has(box)) return false;
  const x = box % lv.w;
  const y = (box - x) / lv.w;
  const open = (nx: number, ny: number): boolean =>
    nx >= 0 && ny >= 0 && nx < lv.w && ny < lv.h && lv.floor.has(ny * lv.w + nx);
  const up = open(x, y - 1);
  const down = open(x, y + 1);
  const left = open(x - 1, y);
  const right = open(x + 1, y);
  // A corner: a wall on one vertical side and a wall on one horizontal side.
  return (!up && (!left || !right)) || (!down && (!left || !right));
}

interface Solution {
  moves: string;
  end: number;
}

/** Fewest-pushes solution of one room, or null when the room cannot be solved. */
function solveRoom(lv: Level, room: Room, boxes: number[]): Solution | null {
  const cells = new Set(room.cells);
  // The player may stand on the porch to enter; a box may never leave its room,
  // so a push's far square must be inside the room.
  const allow = new Set(room.cells);
  allow.add(room.porch);
  const roomGoals = new Set([...lv.goals].filter((g) => cells.has(g)));
  const start = boxes.filter((b) => cells.has(b)).sort((a, b) => a - b);
  if (start.length === 0) return { moves: '', end: room.porch };
  if (start.some((b) => dead(lv, b))) return null;

  interface Node {
    p: number;
    b: number[];
    parent: number;
    walk: string;
    push: string;
  }
  const nodes: Node[] = [{ p: room.porch, b: start, parent: -1, walk: '', push: '' }];
  const seen = new Set<string>();
  for (let head = 0; head < nodes.length; head++) {
    const n = nodes[head]!;
    if (n.b.every((b) => roomGoals.has(b))) {
      const parts: string[] = [];
      let k = head;
      while (k > 0) {
        parts.push(nodes[k]!.walk + nodes[k]!.push);
        k = nodes[k]!.parent;
      }
      parts.reverse();
      return { moves: parts.join(''), end: n.p };
    }
    const boxSet = new Set(n.b);
    const region = flood(lv, n.p, boxSet, allow);
    const key = Math.min(...region) + '|' + n.b.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    const regionSet = new Set(region);
    for (let i = 0; i < n.b.length; i++) {
      const box = n.b[i]!;
      const bx = box % lv.w;
      const by = (box - bx) / lv.w;
      for (const d of DIRS) {
        const px = bx - d.dx;
        const py = by - d.dy;
        const tx = bx + d.dx;
        const ty = by + d.dy;
        if (px < 0 || py < 0 || px >= lv.w || py >= lv.h) continue;
        if (tx < 0 || ty < 0 || tx >= lv.w || ty >= lv.h) continue;
        const behind = py * lv.w + px;
        const beyond = ty * lv.w + tx;
        if (!allow.has(beyond) || boxSet.has(beyond)) continue;
        if (!cells.has(beyond)) continue;
        if (!regionSet.has(behind)) continue;
        const nb = n.b.slice();
        nb[i] = beyond;
        nb.sort((a, b) => a - b);
        if (nb.some((b) => dead(lv, b))) continue;
        const w = walk(lv, n.p, behind, boxSet, allow);
        if (w === '' && n.p !== behind) continue;
        nodes.push({ p: box, b: nb, parent: head, walk: w, push: d.ch });
      }
    }
  }
  return null;
}

/** Replays a move string on a fresh parse, returning the final player and boxes. */
function replayMoves(lv: Level, moves: string): { player: number; boxes: number[] } {
  const boxSet = new Set(lv.boxes);
  let player = lv.player;
  for (const ch of moves.toLowerCase()) {
    const d = DIRS.find((x) => x.ch === ch);
    if (!d) continue;
    const cx = player % lv.w;
    const cy = (player - cx) / lv.w;
    const nx = cx + d.dx;
    const ny = cy + d.dy;
    if (nx < 0 || ny < 0 || nx >= lv.w || ny >= lv.h) continue;
    const n = ny * lv.w + nx;
    if (!lv.floor.has(n)) continue;
    if (boxSet.has(n)) {
      const tx = nx + d.dx;
      const ty = ny + d.dy;
      if (tx < 0 || ty < 0 || tx >= lv.w || ty >= lv.h) continue;
      const t = ty * lv.w + tx;
      if (!lv.floor.has(t) || boxSet.has(t)) continue;
      boxSet.delete(n);
      boxSet.add(t);
    }
    player = n;
  }
  return { player, boxes: [...boxSet].sort((a, b) => a - b) };
}

/** The moves for a level in XSB: a string of u, d, l and r. Empty when unsolved. */
export function solve(text: string): string {
  const lv = parse(text);
  if (lv.player < 0) return '';
  const rooms = roomsOf(lv).filter((r) => r.cells.some((c) => lv.boxes.includes(c)));
  if (rooms.length === 0) return '';
  rooms.sort((a, b) => (a.door % lv.w) - (b.door % lv.w));

  let moves = '';
  let pos = lv.player;
  let boxes = lv.boxes.slice();
  for (const room of rooms) {
    const roomBoxes = boxes.filter((b) => room.cells.includes(b));
    const solved = solveRoom(lv, room, roomBoxes);
    if (solved === null) return '';
    const w = walk(lv, pos, room.porch, new Set(boxes), lv.floor);
    if (w === '' && pos !== room.porch) return '';
    moves += w + solved.moves;
    // Replay the moves so far to learn where the boxes and player ended up.
    const after = replayMoves(lv, moves);
    boxes = after.boxes;
    pos = after.player;
  }
  return moves;
}

for (const id of readdirSync(I).sort()) {
  const moves = solve(readFileSync(join(I, id, 'level.txt'), 'utf8'));
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'solution.txt'), `${moves}\n`);
}

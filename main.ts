// Push-optimal Sokoban by room decomposition. A level is a hallway with rooms
// off it, and a box pushed into the hallway cannot come back, so the level's
// optimum is the sum of its rooms'. Each room is solved on its own by a
// breadth-first search over pushes, and the rooms are joined by walking along
// the hallway, which the scoring does not count.
import { mkdirSync as M, readdirSync as D, readFileSync as R, writeFileSync as W } from 'node:fs';
import { join as J } from 'node:path';

const I = process.env.MAKEFUN_INPUT_DIR || '/input', O = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const V = [[0, -1, 'u'], [0, 1, 'd'], [-1, 0, 'l'], [1, 0, 'r']];

const P = (t: string) => {
  const r = t.split('\n').filter((s) => s.length), h = r.length, w = Math.max(...r.map((s) => s.length));
  const f = new Set<number>(), g = new Set<number>(), b: number[] = [];
  let p = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = r[y]![x] || '#', i = y * w + x;
    if (c === '#') continue;
    f.add(i);
    if ('.*+'.includes(c)) g.add(i);
    if ('$*'.includes(c)) b.push(i);
    if ('@+'.includes(c)) p = i;
  }
  return { w, h, f, g, b: b.sort((a, b) => a - b), p };
};

// Rooms: the components of floor once the player's row (the hallway) is removed.
const rooms = (L: any) => {
  const hy = Math.floor(L.p / L.w), se = new Set<number>(), out: any[] = [];
  for (const s of L.f) {
    if (se.has(s) || Math.floor(s / L.w) === hy) continue;
    const cells: number[] = [], q = [s];
    se.add(s);
    for (let i = 0; i < q.length; i++) {
      const c = q[i]!, x = c % L.w, y = (c - x) / L.w;
      cells.push(c);
      for (const d of V) {
        const nx = x + d[0], ny = y + d[1];
        if (nx < 0 || ny < 0 || nx >= L.w || ny >= L.h) continue;
        const n = ny * L.w + nx;
        if (se.has(n) || !L.f.has(n) || ny === hy) continue;
        se.add(n); q.push(n);
      }
    }
    let porch = cells[0]!;
    for (const c of cells) {
      const x = c % L.w, y = (c - x) / L.w, ty = y < hy ? y + 1 : y - 1;
      if (ty === hy && L.f.has(hy * L.w + x)) { porch = hy * L.w + x; break; }
    }
    out.push({ cells, porch });
  }
  return out;
};

// Fewest-pushes solution of one room, beginning and ending on its porch.
const roomSolve = (L: any, cells: number[], porch: number, start: number[]): string | null => {
  const allow = new Set(cells); allow.add(porch);
  const goals = new Set([...L.g].filter((x) => allow.has(x)));
  const at = (p: number, b: number[]) => p + '|' + b.join(',');
  const done = (p: number, b: number[]) => p === porch && b.every((x) => goals.has(x));
  const B: any[][] = [[{ p: porch, b: start, par: null, mv: '' }]];
  const seen = new Set([at(porch, start)]);
  for (let d = 0; d < B.length; d++) {
    const q = B[d]!;
    for (let h = 0; h < q.length; h++) {
      const s = q[h]!;
      if (done(s.p, s.b)) {
        let out = '', k = s;
        while (k.par) { out = k.mv + out; k = k.par; }
        return out;
      }
      const bs = new Set(s.b);
      for (const dd of V) {
        const x = s.p % L.w, y = (s.p - x) / L.w, nx = x + dd[0], ny = y + dd[1];
        if (nx < 0 || ny < 0 || nx >= L.w || ny >= L.h) continue;
        const n = ny * L.w + nx;
        if (!allow.has(n)) continue;
        if (bs.has(n)) {
          const tx = nx + dd[0], ty = ny + dd[1];
          if (tx < 0 || ty < 0 || tx >= L.w || ty >= L.h) continue;
          const t = ty * L.w + tx;
          if (!allow.has(t) || bs.has(t)) continue;
          const nb = s.b.slice(), k = nb.indexOf(n);
          nb[k] = t; nb.sort((a, b) => a - b);
          const key = at(n, nb);
          if (seen.has(key)) continue;
          seen.add(key);
          if (!B[d + 1]) B[d + 1] = [];
          B[d + 1]!.push({ p: n, b: nb, par: s, mv: dd[2] });
        } else {
          const key = at(n, s.b);
          if (seen.has(key)) continue;
          seen.add(key);
          q.push({ p: n, b: s.b, par: s, mv: dd[2] });
        }
      }
    }
  }
  return null;
};

export const solve = (t: string): string => {
  const L = P(t);
  if (!L.p) return '';
  const rs = rooms(L).filter((r) => r.cells.some((c) => L.b.includes(c)));
  if (!rs.length) return '';
  rs.sort((a, b) => (a.porch % L.w) - (b.porch % L.w));
  let moves = '', x = L.p % L.w;
  for (const r of rs) {
    const got = roomSolve(L, r.cells, r.porch, L.b.filter((b) => r.cells.includes(b)));
    if (got === null) return '';
    const tx = r.porch % L.w;
    moves += tx > x ? 'r'.repeat(tx - x) : 'l'.repeat(x - tx);
    moves += got;
    x = tx;
  }
  return moves;
};

for (const id of D(I).sort()) {
  const m = solve(R(J(I, id, 'level.txt'), 'utf8'));
  M(J(O, id), { recursive: true });
  W(J(O, id, 'solution.txt'), `${m}\n`);
}

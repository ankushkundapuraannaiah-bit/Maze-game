/* DFS maze + loop braiding. grid[y][x]: 1 = wall, 0 = floor. */
(function (root) {
  function generate(w, h, braid = 0.1) {
    if (w % 2 === 0) w++; if (h % 2 === 0) h++;
    const grid = Array.from({ length: h }, () => Array(w).fill(1)), st = [[1, 1]]; grid[1][1] = 0;
    while (st.length) {
      const [x, y] = st[st.length - 1];
      const n = [[2, 0], [-2, 0], [0, 2], [0, -2]].filter(([dx, dy]) => { const a = x + dx, b = y + dy; return a > 0 && b > 0 && a < w - 1 && b < h - 1 && grid[b][a] === 1; });
      if (!n.length) { st.pop(); continue; }
      const [dx, dy] = n[Math.random() * n.length | 0];
      grid[y + dy / 2][x + dx / 2] = 0; grid[y + dy][x + dx] = 0; st.push([x + dx, y + dy]);
    }
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (grid[y][x] === 1 && Math.random() < braid) {
      const hz = grid[y][x - 1] === 0 && grid[y][x + 1] === 0, vt = grid[y - 1][x] === 0 && grid[y + 1][x] === 0;
      if (hz !== vt) grid[y][x] = 0;
    }
    const playerStart = { x: 1, y: h - 2 }, exitPos = { x: w - 2, y: 1 };
    // enemy spawns on the floor tile farthest (by walking distance) from the player
    const dist = Array.from({ length: h }, () => Array(w).fill(-1)), q = [playerStart]; dist[playerStart.y][playerStart.x] = 0;
    let far = playerStart;
    for (let i = 0; i < q.length; i++) {
      const c = q[i]; if (dist[c.y][c.x] > dist[far.y][far.x]) far = c;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = c.x + dx, b = c.y + dy;
        if (grid[b] && grid[b][a] === 0 && dist[b][a] < 0) { dist[b][a] = dist[c.y][c.x] + 1; q.push({ x: a, y: b }); } }
    }
    const enemyStart = { x: far.x, y: far.y };
    const cand = q.filter(c => dist[c.y][c.x] > 3 && !(c.x === exitPos.x && c.y === exitPos.y) && !(c.x === enemyStart.x && c.y === enemyStart.y));
    for (let i = cand.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [cand[i], cand[j]] = [cand[j], cand[i]]; }
    const items = cand.slice(0, Math.max(3, Math.floor(w * h / 45))).map(c => ({ x: c.x, y: c.y }));
    return { grid, width: w, height: h, playerStart, exitPos, enemyStart, items };
  }
  const API = { generate }; root.MazeGenerator = API; if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);

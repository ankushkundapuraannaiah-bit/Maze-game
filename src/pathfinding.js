/* A*, BFS and Greedy on a 4-connected grid (0 = walkable). Binary-heap based, with telemetry. */
(function (root) {
  const D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function search(grid, s, t, mode, name) {
    const t0 = performance.now(), H = grid.length, W = grid[0].length, N = W * H;
    const g = new Float32Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N);
    const heap = []; let seq = 0, explored = [];
    const less = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
    const push = (p, k) => { heap.push([p, seq++, k]); let i = heap.length - 1;
      while (i > 0) { const q = (i - 1) >> 1; if (!less(heap[i], heap[q])) break; [heap[i], heap[q]] = [heap[q], heap[i]]; i = q; } };
    const pop = () => { const top = heap[0], last = heap.pop();
      if (heap.length) { heap[0] = last; let i = 0;
        for (;;) { const l = 2 * i + 1, r = l + 1; let m = i;
          if (l < heap.length && less(heap[l], heap[m])) m = l;
          if (r < heap.length && less(heap[r], heap[m])) m = r;
          if (m === i) break; [heap[i], heap[m]] = [heap[m], heap[i]]; i = m; } }
      return top; };
    const h = (x, y) => Math.abs(x - t.x) + Math.abs(y - t.y);
    const pr = (gv, x, y) => mode === 'astar' ? gv + h(x, y) : mode === 'greedy' ? h(x, y) : gv;
    const sk = s.y * W + s.x, tk = t.y * W + t.x;
    g[sk] = 0; push(pr(0, s.x, s.y), sk);
    while (heap.length) {
      const k = pop()[2]; if (done[k]) continue; done[k] = 1;
      const x = k % W, y = (k / W) | 0; explored.push({ x, y });
      if (k === tk) break;
      for (const [dx, dy] of D) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || grid[ny][nx] !== 0) continue;
        const nk = ny * W + nx, ng = g[k] + 1;
        if (ng < g[nk]) { g[nk] = ng; prev[nk] = k; push(pr(ng, nx, ny), nk); }
      }
    }
    const path = [];
    if (done[tk]) for (let k = tk; k !== -1; k = prev[k]) path.push({ x: k % W, y: (k / W) | 0 });
    path.reverse();
    return { path, explored, metrics: { algorithm: name, nodesExplored: explored.length, pathLength: path.length, timeMs: performance.now() - t0 } };
  }
  const API = {
    findPathAStar: (g, s, t) => search(g, s, t, 'astar', 'A*'),
    findPathBFS: (g, s, t) => search(g, s, t, 'bfs', 'BFS'),
    findPathGreedy: (g, s, t) => search(g, s, t, 'greedy', 'Greedy')
  };
  root.Pathfinding = API; if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);

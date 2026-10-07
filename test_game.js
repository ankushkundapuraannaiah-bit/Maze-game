/**
 * test_game.js
 * Automated unit test suite verifying pathfinding algorithms, maze generation,
 * reachability, and telemetry.
 */

const Pathfinding = require('./src/pathfinding.js');
const MazeGenerator = require('./src/maze.js');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

console.log('========================================================');
console.log('RUNNING TEST SUITE: CYBER MAZE AI PATHFINDING & MAZE GEN');
console.log('========================================================\n');

// 1. Basic Pathfinding Tests on a known 5x5 grid with obstacle
console.log('--- Test Group 1: Basic Pathfinding Unit Tests ---');
const simpleGrid = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1],
  [0, 0, 0, 0, 0]
];

const start = { x: 0, y: 0 };
const target = { x: 0, y: 4 };

const astarRes = Pathfinding.findPathAStar(simpleGrid, start, target);
assert(astarRes.path.length > 0, 'A* finds path through S-bend maze');
assert(astarRes.path[0].x === 0 && astarRes.path[0].y === 0, 'A* path starts at source');
assert(astarRes.path[astarRes.path.length - 1].x === 0 && astarRes.path[astarRes.path.length - 1].y === 4, 'A* path reaches target');
assert(astarRes.metrics.nodesExplored > 0, 'A* records nodesExplored telemetry');
assert(typeof astarRes.metrics.timeMs === 'number', 'A* records execution latency');

const bfsRes = Pathfinding.findPathBFS(simpleGrid, start, target);
assert(bfsRes.path.length > 0, 'BFS finds path through S-bend maze');
assert(bfsRes.path.length === astarRes.path.length, 'BFS and A* yield identical optimal path length on unweighted grid');
assert(bfsRes.metrics.algorithm === 'BFS', 'BFS telemetry algorithm name is correct');

const greedyRes = Pathfinding.findPathGreedy(simpleGrid, start, target);
assert(greedyRes.path.length > 0, 'Greedy search finds path through maze');

// 2. Procedural Maze Generation Tests
console.log('\n--- Test Group 2: Procedural Maze Generator Tests ---');
const easyMaze = MazeGenerator.generate(17, 17, 0.15);
assert(easyMaze.grid.length === 17 && easyMaze.grid[0].length === 17, 'Easy maze generated with correct dimensions 17x17');
assert(easyMaze.grid[easyMaze.playerStart.y][easyMaze.playerStart.x] === 0, 'Player start tile is walkable (0)');
assert(easyMaze.grid[easyMaze.exitPos.y][easyMaze.exitPos.x] === 0, 'Exit portal tile is walkable (0)');
assert(easyMaze.items.length > 0, `Items spawned in maze: ${easyMaze.items.length} items`);

const nightmareMaze = MazeGenerator.generate(29, 29, 0.08);
assert(nightmareMaze.grid.length === 29 && nightmareMaze.grid[0].length === 29, 'Nightmare maze generated with correct dimensions 29x29');

// 3. Monte Carlo Reachability Verification (50 random mazes)
console.log('\n--- Test Group 3: Monte Carlo Maze Navigability (50 Random Mazes) ---');
let allReachable = true;
for (let i = 0; i < 50; i++) {
  const maze = MazeGenerator.generate(23, 23, 0.12);
  const playerToExit = Pathfinding.findPathAStar(maze.grid, maze.playerStart, maze.exitPos);
  if (playerToExit.path.length === 0) {
    allReachable = false;
    break;
  }
  const enemyToPlayer = Pathfinding.findPathAStar(maze.grid, maze.enemyStart, maze.playerStart);
  if (enemyToPlayer.path.length === 0) {
    allReachable = false;
    break;
  }
}
assert(allReachable, 'In 50/50 procedural mazes, Player can reach Exit AND Enemy AI can pathfind to Player');

console.log('\n========================================================');
console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log('========================================================');

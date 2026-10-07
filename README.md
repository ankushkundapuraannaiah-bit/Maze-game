# 🕹️ Cyber Maze 3D: Nemesis AI Chaser

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://github.com/ankushkundapuraannaiah-bit/Maze-game)
[![Three.js](https://img.shields.io/badge/Three.js-r169-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B_Modules-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Web Audio API](https://img.shields.io/badge/Audio-Procedural_Web_Audio-orange?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Tests Passing](https://img.shields.io/badge/Tests-15%2F15_Passing-brightgreen?style=for-the-badge)](test_game.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

> A high-stakes, fast-paced tactical 3D cyberpunk maze game featuring real-time AI pathfinding (**A\***, **BFS**, and **Greedy Best-First**), procedural labyrinth generation with loop braiding, dynamic Three.js WebGL graphics with bloom and volumetric lighting, and a 100% procedural Web Audio synthesizer engine.

---

## ⚡ Quick Deployment & Play

### 🚀 Deploy to Vercel in 1 Click
This repository is pre-configured with [`vercel.json`](vercel.json) and zero build-step requirements. You can deploy it instantly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ankushkundapuraannaiah-bit/Maze-game)

### 💻 Run Locally (Instant Launcher)
Using the built-in zero-dependency Python launcher:
```bash
python serve.py
```
*Or using any static HTTP server:*
```bash
npx serve .
# or
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 🎮 How the Game Works

### 1. The Core Objective
You are dropped into a neon-lit cyber labyrinth. Your mission:
1. **Evade the Nemesis AI**: An autonomous entity that pursues you through the corridors in real time.
2. **Collect Data Cores**: Scattered throughout the maze for high-score multipliers.
3. **Reach the Extraction Portal**: Reach the green cylindrical portal beam on the opposite corner to escape.

### 2. Dual Camera & Gameplay Modes
- **🛰 Chase Cam (Third-Person Perspective)**: Smooth cinematic trailing camera that follows your runner avatar. Offers tactical awareness of corridors and approaching danger.
- **🏃 First-Person Runner (FPS Mode)**: Realistic, immersive first-person perspective. Click to activate Pointer Lock and look freely around corridors while sprinting.
- **🗺 Tactical Map View (`M` Key)**: Switch dynamically to an overhead bird's-eye view of the entire labyrinth.

### 3. Tactical Abilities
- **⚡ EMP Shockwave (`Spacebar` / On-Screen Button)**:
  - Discharges an 8-tile radius electric shockwave ring.
  - Paralyzes and stuns the Nemesis AI for **2.5s to 4.5s** (depending on difficulty).
  - High risk, high reward: You must let the Nemesis get close before triggering!
- **👤 Holographic / Spirit Decoy (`E` / On-Screen Button)**:
  - Deploys an illusory phantom hologram at your current tile.
  - Completely hijacks the AI's pathfinding target for **3.5 seconds**, giving you time to break line-of-sight and flank around loops.

### 4. Difficulty Levels & Dynamic Mechanics
| Difficulty | Grid Size | Nemesis Speed (Player = 4.4 t/s) | EMPs | Decoys | Rubber-Band Catch-Up | Multiplier |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Easy** | 11 × 11 | 2.9 tiles/s *(slower)* | 3 | 2 | None | 1× |
| **Medium** | 17 × 17 | 4.0 tiles/s *(steady)* | 2 | 1 | +15% | 2× |
| **Hard** | 23 × 23 | 4.9 tiles/s *(faster than you)* | 2 | 1 | +30% | 3× |
| **Nightmare** | 31 × 31 | 5.5 tiles/s *(furious)* | 1 | 0 | +50% | 5× |

- **Endless Level Progression**: Completing a maze unlocks the *Next Level*, which increases Nemesis speed by an additional **+5% cumulatively**.
- **Rubber-Banding Catch-Up**: When the player gets far ahead, the Nemesis AI accelerates dynamically to keep chase tension high.
- **Scoring Engine**:
  $$\text{Score} = \left(\text{Data Cores} \times 150 + \text{Survival Seconds} \times 2\right) \times \text{Multiplier} + \text{Escape Speed Bonus}$$
  *Best scores per difficulty are saved permanently to browser `localStorage`.*

---

## 🧠 AI Pathfinding Algorithms

The core technical highlight of Cyber Maze 3D is its graph search and pathfinding engine implemented in [`src/pathfinding.js`](src/pathfinding.js).

```
         ┌──────────────────────────────────────────────────┐
         │             Orthogonal 2D Maze Grid              │
         │             (Walkable = 0, Walls = 1)            │
         └────────────────────────┬─────────────────────────┘
                                  │
                  Tile Coordinate Transition Trigger
                                  ▼
         ┌──────────────────────────────────────────────────┐
         │            Dynamic Real-Time Replanning          │
         │        Target: Player Tile or Decoy Anchor       │
         └────────────────────────┬─────────────────────────┘
                                  │
         ┌────────────────────────┼─────────────────────────┐
         ▼                        ▼                         ▼
   ┌───────────┐            ┌───────────┐             ┌───────────┐
   │ A* Search │            │    BFS    │             │  Greedy   │
   │  f = g+h  │            │   f = g   │             │   f = h   │
   └─────┬─────┘            └─────┬─────┘             └─────┬─────┘
         │                        │                         │
         └────────────────────────┼─────────────────────────┘
                                  │
                                  ▼
         ┌──────────────────────────────────────────────────┐
         │  Binary Min-Heap Priority Queue & Path Traceback │
         └────────────────────────┬─────────────────────────┘
                                  │
                                  ▼
         ┌──────────────────────────────────────────────────┐
         │            AI Brain Deck Live Telemetry          │
         │   • Red Path Vector      • Blue Search Wavefront │
         │   • Nodes Explored Count • Calculation Latency   │
         └──────────────────────────────────────────────────┘
```

### 1. Real-Time Dynamic Replanning
Unlike games that compute paths intermittently or wander randomly:
- The Nemesis AI **re-evaluates and replans its path immediately whenever either the player or the enemy changes grid tiles**.
- The path search executes in **< 0.2 milliseconds** on modern devices, maintaining a rock-solid 60 FPS rendering loop.

### 2. Supported Pathfinding Modes

#### A\* (A-Star) Search — Optimal & Heuristic Guided
- **Priority Function**:
  $$f(n) = g(n) + h(n)$$
  where $g(n)$ is the exact cost from start to node $n$, and $h(n)$ is the admissible Manhattan distance heuristic:
  $$h(n) = |x_n - x_{\text{target}}| + |y_n - y_{\text{target}}|$$
- **Data Structure**: Binary Min-Heap Priority Queue with FIFO tie-breaking:
  $$\text{less}(a, b) \iff a[0] < b[0] \lor (a[0] = b[0] \land a[1] < b[1])$$
- **Characteristics**: Mathematically guarantees the shortest path while exploring the minimum number of nodes.

#### BFS (Breadth-First Search) — Unweighted Flood Fill
- **Priority Function**:
  $$f(n) = g(n)$$
- **Characteristics**: Expands uniformly outward in concentric diamond waves. Finds the optimal path on unweighted grids, but explores significantly more nodes than A*, clearly illustrating search efficiency differences.

#### Greedy Best-First Search — Aggressive Heuristic Pursuit
- **Priority Function**:
  $$f(n) = h(n)$$
- **Characteristics**: Prioritizes nodes purely based on estimated distance to the target. Fast in open areas, but susceptible to dead-end loops and non-optimal routes around long walls.

### 3. AI Brain Deck (`Tab` Key / Live Diagnostic Telemetry)
Press <kbd>Tab</kbd> or click the **AI DECK** button at any time to open the live diagnostics slide-out drawer:
- **Red Path Vector**: Visualizes the planned path waypoints in the 3D scene.
- **Cobalt Blue Frontier**: Displays all grid tiles explored during the search iteration.
- **Live Metrics**: Shows active algorithm, nodes explored, planned path length in tiles, execution latency in milliseconds, and enemy state (`HUNTING`, `LURED BY DECOY`, `BANISHED`, `DORMANT`).
- **On-the-Fly Algorithm Switcher**: Seamlessly toggle between A*, BFS, and Greedy to observe how search patterns change in real time.

---

## 🌀 Procedural Maze Generation & Braiding

Implemented in [`src/maze.js`](src/maze.js):

1. **Randomized Depth-First Search (DFS) Generator**:
   - Generates odd-dimension labyrinths ($11 \times 11$ up to $61 \times 61$) using a stack-based recursive backtracker.
2. **Loop Braiding (Cul-de-sac Elimination)**:
   - "Perfect mazes" generated by DFS contain exactly one path between any two points, meaning every dead-end is inescapable.
   - Our generator introduces a configurable **braiding factor (7% to 25%)**, selectively puncturing walls between adjacent corridors:
     $$\text{if } \text{horizontalIsCorridor} \neq \text{verticalIsCorridor} \implies \text{punctured}$$
   - This creates tactical loops, allowing players to juke, flank, and circle around the AI.
3. **Topological Farthest-Point Spawning**:
   - Spawns the player at $(1, H - 2)$.
   - Runs a BFS distance flood-fill across all walkable floor tiles.
   - Spawns the Nemesis AI on the tile with the **maximum graph distance** from the player, ensuring balanced and fair initial spacing.

---

## 🔊 Procedural Web Audio Engine

Implemented in [`src/audio.js`](src/audio.js):
- **Zero MP3 / WAV Dependencies**: 100% synthesized in real time via the browser's native **Web Audio API**.
- **Dynamic Proximity Heartbeat & Wail Synthesizer**:
  - Continuously monitors normalized distance to the Nemesis.
  - Heartbeat tempo and pitch accelerate urgently as the enemy closes in:
    $$\text{Period} = 1.1 - 0.85 \times \text{proximity}, \quad \text{Frequency} = 50 + 40 \times \text{proximity} \text{ Hz}$$
- **Procedural Sound FX**:
  - Low-frequency ambient drone (dual detuned sawtooth waves with lowpass filter).
  - EMP discharge roar (frequency-swept sawtooth down-ramp).
  - Decoy chirp (high-pitch sine frequency-glide).
  - Core pickup harmonics (two-tone triangle chime).
  - Victory fanfare and defeat dissonance chords.

---

## 🛠️ Tech Stack & Dependencies

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Core Runtime** | HTML5, CSS3, Vanilla JavaScript (ES6+) | Instant browser compatibility, zero framework overhead. |
| **3D Rendering** | Three.js (r169 via importmap CDN) | High-performance WebGL rendering without build steps. |
| **Post-Processing** | UnrealBloomPass, OutputPass, ACESFilmicToneMapping | Cyberpunk glow, volumetric neon accents, and tone mapping. |
| **Audio** | Web Audio API (`AudioContext`, `OscillatorNode`) | Zero external audio asset loading; dynamic parametric sound synthesis. |
| **Automated Testing** | Node.js Test Suite (`test_game.js`) | Unit tests for A*, BFS, Greedy, and 50-maze Monte Carlo reachability. |
| **Local Server** | Python 3 Standard Library (`serve.py`) | 1-click launcher without needing `npm` or `pip`. |
| **Cloud Deployment** | Vercel Static Hosting (`vercel.json`) | Global edge CDN, automated HTTPS, clean URLs, and security headers. |

---

## ⌨️ Controls Reference

| Action | Keyboard | Mouse / Pointer | Touch / Mobile |
| :--- | :--- | :--- | :--- |
| **Move / Sprint** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or Arrows | — | On-Screen D-Pad |
| **Look Around (FPS Mode)** | Arrow Left / Right | Mouse Look (Pointer Lock) | Right Screen Touch Swipe |
| **EMP Shockwave** | <kbd>Spacebar</kbd> | Click `EMP BLAST` button | On-Screen EMP Button |
| **Hologram Decoy** | <kbd>E</kbd> | Click `DECOY` button | On-Screen Decoy Button |
| **AI Brain Deck** | <kbd>Tab</kbd> | Click `AI DECK` / Pull Tab | Header `AI DECK` Button |
| **Toggle Camera View** | <kbd>M</kbd> | Pause Menu → "View Map" | Pause Menu View Map |
| **Pause Game** | <kbd>Esc</kbd> or <kbd>P</kbd> | Click `⏸` button | Top Pause Button |
| **Toggle Fullscreen** | <kbd>F</kbd> | Fullscreen Toggle | Fullscreen Toggle |
| **Return to Menu** | <kbd>R</kbd> | Pause Menu → "Main Menu" | Pause Menu Button |

---

## 📁 Project Structure

```
cyber-maze/
├── index.html            # Main entry point (root URL)
├── index3d.html          # Modular 3D game client
├── cyber-maze-3d.html    # Standalone all-in-one offline bundle
├── styles3d.css          # Responsive styling (HUD, tactical dock, AI deck)
├── styles.css            # Cyber theme fallback styles
├── serve.py              # Zero-dependency 1-click Python launcher
├── build.js              # Static build script synchronizing assets to public/
├── vercel.json           # Vercel deployment, outputDirectory, rewrites & headers
├── package.json          # Project metadata, build & test scripts
├── .gitignore            # Git exclusion rules
├── favicon.svg           # Cyber maze SVG icon
├── test_game.js          # Automated unit test suite (15 tests)
├── README.md             # Project documentation
├── public/               # Output directory for Vercel deployment
└── src/
    ├── pathfinding.js    # A*, BFS, and Greedy algorithms with binary heap
    ├── maze.js           # Procedural DFS generator, loop braiding, item placement
    ├── audio.js          # Procedural Web Audio API sound synthesizer
    └── game3d.js         # Three.js WebGL game loop, camera, and physics
```

---

## 🧪 Automated Testing

The project includes an automated test suite verifying algorithm correctness, optimality, telemetry metrics, and maze navigability:

```bash
# Run tests with Node
node test_game.js

# Or using npm
npm test
```

### Test Coverage (15 / 15 Passed):
1. **Pathfinding Verification**:
   - A* navigation through complex S-bend obstacle corridors.
   - Start coordinate and target coordinate integrity.
   - Telemetry data verification (`nodesExplored`, latency metrics).
   - BFS vs. A* path length optimality equality on unweighted grids.
   - Greedy Best-First target acquisition.
2. **Procedural Generation**:
   - Dimensions validation across Easy ($17 \times 17$) to Nightmare ($29 \times 29$).
   - Walkability check for player start and exit portal.
   - Item and Data Core placement constraints.
3. **Monte Carlo Reachability Verification (50 Mazes)**:
   - Generates 50 randomized mazes with loop braiding.
   - Proves mathematically that **in 50/50 cases, the player has a valid path to the exit AND the enemy has a valid path to the player**.

---

## 🚢 Deploying to Vercel

### Option 1: Automatic Deployment via Git
1. Fork or push this repository to your GitHub account:
   ```
   https://github.com/ankushkundapuraannaiah-bit/Maze-game
   ```
2. Navigate to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import the `Maze-game` repository.
4. Leave all build settings at their defaults (Framework Preset: **Other**, Build Command: empty).
5. Click **"Deploy"**. Vercel will deploy the site in ~10 seconds.

### Option 2: Deploying via Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy directly from the project directory
vercel
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Built with ❤️ by **Ankush Kundapura Annaiah**.

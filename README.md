# CRICKETVERSE AI 🏏
> **Analyze. Predict. Train. Dominate.**
> All-in-One Intelligent Cricket Ecosystem

CRICKETVERSE AI is a complete, production-oriented, full-stack intelligence platform merging real-time match analytics, interactive 3D stadium physics, computer-vision biomechanics, and tactical squad optimizers into a single unified command deck.

---

## 🌟 The Ten Core Intelligence Modules

1. **CricketMind AI (Match Intelligence)**: Real-time match scorecards, Manhattan and Worm charts, dynamic win probability curves factoring pitch wear and required run rate velocity, projected score scenarios, and automated downloadable PDF match dossiers.
2. **ShotSense AI (Batting Coach)**: Drag-and-drop batting video uploader with MediaPipe Pose kinematic tracking. Analyzes stance balance index, head-over-ball angle, backlift angle, and downswing path with annotated keyframe telemetry.
3. **BallTrack AI (Ball Tracking & Trajectory)**: Hawkeye-grade 3D ball trajectory modeling, release velocity estimation (kph/mph), pitch bounce coordinates, line/length classification (Yorker, Full, Good Length, Short), and real-time 3D flight path animation.
4. **BowlVision AI (Bowling Analyzer)**: Bowling action biomechanics tracking front-foot knee brace angle, trunk flexion, run-up consistency, arm release height, and personalized training drill prescriptions.
5. **ScoutXI AI (Player Scouting & Recruitment)**: Comprehensive directory of international cricketers with transparent weighted Scout Scores (0-100), multi-player radar comparison charts, and bulk CSV export/import.
6. **FieldIQ AI (Tactical Field Placement)**: Interactive 3D field placement interface with preset tactical formations (Powerplay 2-Out, Death Overs Yorker Trap, Spin Web), clickable & repositionable fielders, and AI recommendation assistant.
7. **TeamXI AI (Intelligent Team Builder)**: 11-player squad builder enforcing strict cricket regulations (minimum 1 wicketkeeper, 5+ bowling options, duplicate prevention), optimal batting order heuristics, and composite Team Balance Index.
8. **LiveCricket AI (Live Match Center)**: Live match dashboard with real-time ticking ball simulator, ball-by-ball commentary streams, partnership tracker, and live/demo mode toggles.
9. **PitchPredict AI (Pitch Intelligence)**: Pitch photo uploader with OpenCV surface segmentation extracting green grass coverage %, soil moisture index, and crack density combined with meteorological parameters.
10. **CricketVision AI (Full-Match Video Intelligence)**: Multi-player YOLO detection, shot-zone wagon wheel mapping, and automated candidate highlight timestamping.

---

## 🏟️ Interactive 3D Cricket Ground (Three.js)

- **Procedural Stadium Environment**: Tiered seating stands, 4 ambient floodlight towers with emissive lighting, day/night atmosphere, and radial lawn-mower striped grass turf.
- **Official Field Markings**: Center rectangular clay/soil pitch strip, popping creases, bowling creases, return creases, 30-yard inner circle, and boundary rope cushions.
- **3D Wooden Wickets**: 3 wooden stumps and 2 bails at both striker and non-striker ends.
- **3D Player Models**: 11 fielders, 2 batters, and umpires with glowing role rings and interactive labels.
- **Interactive Raycaster**: Click on any fielder to inspect their coordinates, distance from stumps, and field sector.
- **Multiple Camera Presets**:
  - Broadcast 3D View (Default TV angle)
  - Bowler's View (Pitch-level delivery perspective)
  - Batter POV (Crease perspective)
  - 2D Tactical Plan (Bird's eye tactical blueprint)
- **Animated 3D Ball Trajectory**: Real-time delivery arc from bowler's release -> pitch bounce point -> batsman shot wagon wheel with particle trails.
- **Graceful WebGL Fallback**: High-definition 2D tactical SVG canvas layout if WebGL is disabled or on low-end hardware.

---

## 🎨 Design System: Obsidian Lumina

- **Canvas Base**: Near-black obsidian (`#07080F`, `#0B0D19`, `#121626`) with soft radial ambient glows.
- **Accents**: Neon Electric Violet (`#A855F7`, `#8B5CF6`) as primary energy, Electric Cyan (`#06B6D4`, `#22D3EE`) for telemetry, Neon Emerald (`#10B981`) for boundaries/success, and Coral (`#F43F5E`) for wickets.
- **Glassmorphic Precision**: Frosted containers with `backdrop-filter: blur(20px)` and 1px micro-borders.
- **Typography**: **Plus Jakarta Sans** for display headlines, **Space Grotesk** / **JetBrains Mono** for quantitative telemetry.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+ (Python 3.14 recommended)
- Node.js 18+ (Node v26 recommended)

### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m app.seed_data
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Backend API will be live at `http://127.0.0.1:8000`.
Interactive Swagger API documentation: `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend application will be live at `http://127.0.0.1:5173`.

---

## 🧪 Automated Test Suite

Run the backend test suite:
```bash
cd backend
python -m pytest -v
```
All 15 tests verify authentication, player scouting formulas, team balance validation, match scorecards, live ball simulation, pitch CV analysis, and video job queues.

Run the frontend TypeScript & build check:
```bash
cd frontend
npm run build
```

---

## 🔒 Security & Roles

- **Admin** (`admin_rahul`): Director access, full player management, audit oversight.
- **Coach** (`coach_virat`): Head coach access, tactical lineups, video biomechanics, scouting.
- **Player** (`player_shubman`): Athlete access, personal training sessions, match previews.
- Instant 1-click demo role switching available directly from the user profile avatar in the navigation bar.

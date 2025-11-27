# CPU Scheduling Visualizer

This project is a web-based visualizer for CPU scheduling algorithms, specifically Round Robin and Shortest Remaining Time First (SRTF). It allows users to input process arrival and burst times, select an algorithm, and view the resulting Gantt chart, CPU utilization, and process statistics.

## Features
- **Round Robin and SRTF algorithms**
- Dynamic Gantt chart visualization
- CPU utilization calculation
- Table of process statistics (Finish, Turnaround, Waiting times)
- Responsive UI
- Quantum input is shown/hidden based on algorithm selection

## Usage
1. Enter arrival and burst times (space-separated).
2. Select the scheduling algorithm.
3. For Round Robin, enter the time quantum.
4. Click **Solve** to view results.
5. Click **Clear** to reset inputs and outputs.

## How to Run Locally
1. Clone the repository:
   ```
   git clone https://github.com/<your-username>/<repo-name>.git
   ```
2. Open `index.html` in your browser.

## Deploying to GitHub Pages
- Push your code to a GitHub repository.
- Enable GitHub Pages in the repository settings.
- Visit your site at `https://<your-username>.github.io/<repo-name>/`.

## Files
- `index.html` — Main HTML and UI
- `script.js` — Scheduling logic and interactivity

## License
MIT

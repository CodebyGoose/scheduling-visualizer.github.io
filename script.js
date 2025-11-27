// Auto-clear inputs and outputs on page load
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('arrival').value = '';
  document.getElementById('burst').value = '';
  document.getElementById('quantum').value = '';
  document.getElementById('cpuUtil').innerText = 'CPU Utilization: —';
  document.getElementById('gantt').innerHTML = '';
  document.getElementById('resultTable').innerHTML = '';
  document.querySelector('.legend').innerHTML = '';
});

// Hide quantum input for SRTF
const algoSelect = document.getElementById('algo');
const quantumInput = document.getElementById('quantum');
const quantumWrap = document.getElementById('quantumWrap');
algoSelect.addEventListener('change', () => {
  if (algoSelect.value === 'Shortest Remaining Time First (SRTF)') {
    quantumWrap.style.display = 'none';
  } else {
    quantumWrap.style.display = '';
  }
});
// Scheduling algorithms
function getProcName(i) {
  return `P${i+1}`;
}
function roundRobin(arrival, burst, quantum) {
  const n = arrival.length;
  let time = 0, completed = 0;
  let rem = burst.slice();
  let finish = Array(n).fill(0);
  let waiting = Array(n).fill(0);
  let turnaround = Array(n).fill(0);
  let ready = [];
  let gantt = [];
  let idle = 0;
  let lastTime = 0;
  let arrived = Array(n).fill(false);
  // Initial pass: give each process (in input order) one quantum sequentially
  // (respecting arrival times). This reduces each process by up to one quantum
  // before the usual Round Robin switching begins.
  for (let i = 0; i < n; i++) {
    // If the process hasn't arrived yet, advance time and record idle
    if (arrival[i] > time) {
      // record an idle segment until arrival
      gantt.push({name: 'Idle', start: time, end: arrival[i]});
      idle += arrival[i] - time;
      time = arrival[i];
    }
    if (rem[i] > 0) {
      let exec = Math.min(quantum, rem[i]);
      gantt.push({name: getProcName(i), start: time, end: time + exec});
      time += exec;
      rem[i] -= exec;
      arrived[i] = true; // mark as seen by the CPU
      lastTime = time;
      if (rem[i] === 0) {
        finish[i] = time;
        completed++;
      }
    }
  }
  // Seed ready queue with any arrived processes that still have remaining time
  for (let i = 0; i < n; i++) {
    if (arrived[i] && rem[i] > 0) ready.push(i);
  }
  while (completed < n) {
    // Add newly arrived processes
    for (let i = 0; i < n; i++) {
      if (!arrived[i] && arrival[i] <= time) {
        ready.push(i);
        arrived[i] = true;
      }
    }
    if (ready.length === 0) {
      gantt.push({name: 'Idle', start: time, end: time+1});
      idle++;
      time++;
      continue;
    }
    let idx = ready.shift();
    let exec = Math.min(quantum, rem[idx]);
    gantt.push({name: getProcName(idx), start: time, end: time+exec});
    time += exec;
    rem[idx] -= exec;
    // Add newly arrived during execution
    for (let i = 0; i < n; i++) {
      if (!arrived[i] && arrival[i] > lastTime && arrival[i] <= time) {
        ready.push(i);
        arrived[i] = true;
      }
    }
    lastTime = time;
    if (rem[idx] > 0) {
      ready.push(idx);
    } else {
      finish[idx] = time;
      completed++;
    }
  }
  for (let i = 0; i < n; i++) {
    turnaround[i] = finish[i] - arrival[i];
    waiting[i] = turnaround[i] - burst[i];
  }
  return {gantt, finish, turnaround, waiting, idle, total: time};
}
function srtf(arrival, burst) {
  const n = arrival.length;
  let time = 0, completed = 0;
  let rem = burst.slice();
  let finish = Array(n).fill(0);
  let waiting = Array(n).fill(0);
  let turnaround = Array(n).fill(0);
  let gantt = [];
  let idle = 0;
  let lastProc = -1;
  let lastTime = 0;
  while (completed < n) {
    let minRem = Infinity, idx = -1;
    for (let i = 0; i < n; i++) {
      if (arrival[i] <= time && rem[i] > 0 && rem[i] < minRem) {
        minRem = rem[i];
        idx = i;
      }
    }
    if (idx === -1) {
      if (lastProc !== -2) {
        gantt.push({name: 'Idle', start: time, end: time+1});
        lastProc = -2;
      } else {
        gantt[gantt.length-1].end++;
      }
      idle++;
      time++;
      continue;
    }
    if (lastProc !== idx) {
      gantt.push({name: getProcName(idx), start: time, end: time+1});
      lastProc = idx;
    } else {
      gantt[gantt.length-1].end++;
    }
    rem[idx]--;
    if (rem[idx] === 0) {
      finish[idx] = time+1;
      completed++;
    }
    time++;
  }
  for (let i = 0; i < n; i++) {
    turnaround[i] = finish[i] - arrival[i];
    waiting[i] = turnaround[i] - burst[i];
  }
  return {gantt, finish, turnaround, waiting, idle, total: time};
}
// Render Gantt chart
function renderGantt(gantt) {
  const colors = ['#2563eb','#10b981','#f97316','#a78bfa','#eab308','#ef4444','#14b8a6','#6366f1'];
  // Calculate segment widths
  let totalUnits = gantt.length > 0 ? gantt[gantt.length-1].end - gantt[0].start : 0;
  let pxPerUnit = 40;
  let totalWidth = totalUnits * pxPerUnit;
  let html = `<div style='display:flex;flex-direction:column;align-items:flex-start;width:${totalWidth}px'>`;
  // Gantt bar row
  html += `<div style='display:flex;border:1px solid #94a3b8;border-radius:6px;overflow:hidden;width:${totalWidth}px'>`;
  gantt.forEach((seg, i) => {
    let width = (seg.end-seg.start)*pxPerUnit;
    if (seg.name === 'Idle') {
      html += `<div class=\"seg idle\" style=\"background:#e6eef6;color:#334155;border-right:1px solid #94a3b8;width:${width}px;min-width:0;padding:0 8px;\">Idle</div>`;
    } else {
      let idx = Number(seg.name.replace('P',''))-1;
      html += `<div class=\"seg\" style=\"background:${colors[idx%colors.length]};border-right:1px solid #94a3b8;width:${width}px;min-width:0;padding:0 8px;\">${seg.name}</div>`;
    }
  });
  html += '</div>';
  // Timeline numbers row: each number precisely below its segment edge, no gap
  html += `<div style='display:flex;width:${totalWidth}px;margin-top:2px;position:relative;height:18px'>`;
  let left = 0;
  gantt.forEach((seg, i) => {
    html += `<span style='position:absolute;left:${left}px;transform:translateX(-50%);text-align:center;font-size:13px;color:#334155;'>${seg.start}</span>`;
    left += (seg.end-seg.start)*pxPerUnit;
  });
  // Last number at the right edge
  if (gantt.length > 0) {
    html += `<span style='position:absolute;left:${totalWidth}px;transform:translateX(-50%);text-align:center;font-size:13px;color:#334155;'>${gantt[gantt.length-1].end}</span>`;
  }
  html += '</div>';
  html += '</div>';
  document.getElementById('gantt').innerHTML = html;
  // Wrap gantt in responsive container
  document.getElementById('gantt').parentElement.classList.add('gantt-container');
}
// Render table
function renderTable(arrival, burst, finish, turnaround, waiting) {
  let html = '';
  for (let i = 0; i < arrival.length; i++) {
    html += `<tr><td>P${i+1}</td><td>${arrival[i]}</td><td>${burst[i]}</td><td>${finish[i]}</td><td>${turnaround[i]}</td><td>${waiting[i]}</td></tr>`;
  }
  document.getElementById('resultTable').innerHTML = html;
}
// Render legend and timeline
function renderLegend(arrival) {
  const colors = ['#2563eb','#10b981','#f97316','#a78bfa','#eab308','#ef4444','#14b8a6','#6366f1'];
  let html = '';
  for (let i = 0; i < arrival.length; i++) {
    html += `<div class=\"item\"><div class=\"dot\" style=\"background:${colors[i%colors.length]}\"></div><div class=\"small\">P${i+1}</div></div>`;
  }
  html += '<div style="flex:1"></div>';
  html += `<div class="small">Timeline (0 — <span id='timelineEnd'></span>)</div>`;
  document.querySelector('.legend').innerHTML = html;
}
// Solve button logic

document.getElementById('solveBtn').addEventListener('click', ()=>{
  let arrival = document.getElementById('arrival').value.trim().split(/\s+/).map(Number);
  let burst = document.getElementById('burst').value.trim().split(/\s+/).map(Number);
  let quantum = Number(document.getElementById('quantum').value);
  if (arrival.length !== burst.length || arrival.some(isNaN) || burst.some(isNaN)) {
    alert('Arrival and Burst lists must be same length and valid numbers.');
    return;
  }
  let result;
  if (algoSelect.value === 'Round Robin') {
    if (!quantum || quantum < 1) {
      alert('Quantum must be a positive number for Round Robin.');
      return;
    }
    result = roundRobin(arrival, burst, quantum);
  } else {
    result = srtf(arrival, burst);
  }
  renderGantt(result.gantt);
  renderTable(arrival, burst, result.finish, result.turnaround, result.waiting);
  renderLegend(arrival);
  document.getElementById('timelineEnd').innerText = result.total;
  let util = ((result.total-result.idle)/result.total*100).toFixed(2);
  document.getElementById('cpuUtil').innerText = `CPU Utilization: ${util}% (Idle ${result.idle})`;
});
// Clear button logic
document.getElementById('clearBtn').addEventListener('click', ()=>{
  document.getElementById('arrival').value='';
  document.getElementById('burst').value='';
  document.getElementById('quantum').value='';
  document.getElementById('cpuUtil').innerText='CPU Utilization: —';
  document.getElementById('gantt').innerHTML='';
  document.getElementById('resultTable').innerHTML='';
  document.querySelector('.legend').innerHTML='';
});

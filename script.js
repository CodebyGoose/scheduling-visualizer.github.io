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
  let html = '';
  let timelineHtml = '';
  let current = gantt.length > 0 ? gantt[0].start : 0;
  gantt.forEach((seg, i) => {
    if (seg.name === 'Idle') {
      html += `<div class="seg idle">Idle</div>`;
    } else {
      let idx = Number(seg.name.replace('P',''))-1;
      html += `<div class="seg" style="background:${colors[idx%colors.length]}">${seg.name}</div>`;
    }
    // Timeline numbers
    timelineHtml += `<span style='margin-left:8px;font-size:12px;color:#64748b'>${seg.start}</span>`;
    if (i === gantt.length-1) {
      timelineHtml += `<span style='margin-left:8px;font-size:12px;color:#64748b'>${seg.end}</span>`;
    }
  });
  document.getElementById('gantt').innerHTML = html;
  // Add timeline below gantt
  let timelineDiv = document.getElementById('ganttTimeline');
  if (!timelineDiv) {
    timelineDiv = document.createElement('div');
    timelineDiv.id = 'ganttTimeline';
    timelineDiv.style = 'display:flex;gap:0;justify-content:left;margin-top:2px;';
    document.getElementById('gantt').parentNode.appendChild(timelineDiv);
  }
  timelineDiv.innerHTML = timelineHtml;
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

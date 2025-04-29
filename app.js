// Crochet Stitch Tracker

const patternForm = document.getElementById('pattern-form');
const patternInput = document.getElementById('pattern-input');
const stitchList = document.getElementById('stitch-list');
const resetBtn = document.getElementById('reset-btn');
const undoBtn = document.getElementById('undo-btn');

// --- Enhanced pattern tracking ---
let stitches = [];
let stitchGroups = [];
let stitchProgress = [];
// For each stitch: 0 = not done, 1 = half (for inc and dec), 2 = done

function parsePatternGroups(pattern) {
  // Returns an array of groups: each group is { group: [stitch, ...], repeat: n }
  pattern = pattern.trim();
  let groups = [];

  // Match [group] x N
  let repeatMatch = pattern.match(/^\[(.+)\]\s*x\s*(\d+)$/i);
  if (repeatMatch) {
    let group = repeatMatch[1];
    let repeat = parseInt(repeatMatch[2]);
    let groupSeq = parsePatternGroups(group)[0].group;
    groups.push({ group: groupSeq, repeat });
    return groups;
  }

  // Match 'instructions xN' (not wrapped in [])
  let simpleRepeat = pattern.match(/^(.+?)\s*x\s*(\d+)$/i);
  if (simpleRepeat && !pattern.startsWith('[')) {
    let group = simpleRepeat[1].trim();
    let repeat = parseInt(simpleRepeat[2]);
    let groupSeq = parsePatternGroups(group)[0].group;
    groups.push({ group: groupSeq, repeat });
    return groups;
  }

  // Single group, possibly with multiple instructions
  let items = pattern.split(',').map(s => s.trim());
  let groupSeq = [];
  for (let item of items) {
    let m = item.match(/^(\d+)?\s*(dc|inc|dec)$/i);
    if (m) {
      let count = parseInt(m[1] || '1');
      let type = m[2].toLowerCase();
      for (let i = 0; i < count; i++) {
        groupSeq.push(type);
      }
    }
  }
  if (groupSeq.length > 0) {
    groups.push({ group: groupSeq, repeat: 1 });
  }
  return groups;
}

function flattenGroups(groups) {
  // Returns flat array of stitches, and also a mapping of each stitch to its group/position
  let flat = [];
  let map = [];
  groups.forEach((g, groupIdx) => {
    for (let r = 0; r < g.repeat; r++) {
      g.group.forEach((stitch, i) => {
        flat.push(stitch);
        map.push({ groupIdx, repeatNum: r, stitchIdx: i });
      });
    }
  });
  return { flat, map };
}

function renderStitches() {
  stitchList.innerHTML = '';
  let counter = 0;
  // Find the first incomplete stitch (active)
  let activeIdx = -1;
  for (let i = 0; i < stitches.length; i++) {
    if (((stitches[i] === 'inc' || stitches[i] === 'dec') && stitchProgress[i] !== 2) || (stitches[i] !== 'inc' && stitches[i] !== 'dec' && stitchProgress[i] !== 1)) {
      activeIdx = i;
      break;
    }
  }

  // Default rendering
  let allDone = stitches.length > 0 && stitches.every((st, i) =>
    (st === 'inc' || st === 'dec') ? stitchProgress[i] === 2 : stitchProgress[i] === 1
  );
  let lastRow;
  let lastRowIdx = -1;
  stitchGroups.forEach((g, groupIdx) => {
    for (let r = 0; r < g.repeat; r++) {
      const row = document.createElement('div');
      row.className = 'stitch-row';
      if (g.repeat > 1) {
        const num = document.createElement('span');
        num.className = 'row-num';
        num.textContent = (r + 1);
        row.appendChild(num);
      }
      g.group.forEach((stitch, i) => {
        const div = document.createElement('div');
        let prog = stitchProgress[counter] || 0;
        div.className = 'stitch-box';
        // Always wrap label in a span for z-index layering
        const label = document.createElement('span');
        label.className = 'stitch-label';
        label.textContent = stitch;
        div.appendChild(label);
        if (stitch === 'inc' || stitch === 'dec') {
          if (prog === 1) div.classList.add('half');
          if (prog === 2) div.classList.add('checked');
        } else {
          if (prog === 1 || prog === 2) div.classList.add('checked');
        }
        if (counter === activeIdx) div.classList.add('active');
        div.tabIndex = 0;
        div.addEventListener('click', () => {
          // No-op: click no longer sets a cursor, only visual highlight
        });
        row.appendChild(div);
        counter++;
      });
      lastRow = row;
      lastRowIdx++;
      stitchList.appendChild(row);
    }
  });
  // Add success checkmark if all done
  if (allDone && lastRow) {
    const check = document.createElement('span');
    check.className = 'success-check';
    check.style.marginLeft = '16px';
    check.style.fontSize = '2em';
    check.style.verticalAlign = 'middle';
    check.style.position = 'relative';
    // Confetti container (behind emoji)
    const confettiContainer = document.createElement('span');
    confettiContainer.className = 'confetti-container';
    confettiContainer.style.position = 'absolute';
    confettiContainer.style.left = '0';
    confettiContainer.style.top = '0';
    confettiContainer.style.width = '100%';
    confettiContainer.style.height = '100%';
    confettiContainer.style.pointerEvents = 'none';
    confettiContainer.style.zIndex = '1';
    check.appendChild(confettiContainer);
    // Emoji (above confetti)
    const emoji = document.createElement('span');
    emoji.textContent = '✅';
    emoji.style.position = 'relative';
    emoji.style.zIndex = '2';
    check.appendChild(emoji);

    lastRow.appendChild(check);
    // Confetti burst
    const confettiColors = ['#f44336', '#ffeb3b', '#4caf50', '#2196f3', '#ff9800', '#e040fb', '#00bcd4', '#ffd600'];
    const confettiCount = 8;
    for (let i = 0; i < confettiCount; i++) {
      const conf = document.createElement('span');
      conf.className = 'confetti-piece';
      conf.style.background = confettiColors[i % confettiColors.length];
      conf.style.position = 'absolute';
      conf.style.left = '50%';
      conf.style.top = '50%';
      conf.style.width = '7px';
      conf.style.height = '10px';
      conf.style.borderRadius = '2px';
      conf.style.transform = 'translate(-50%, -50%)';
      conf.style.opacity = (0.6 + Math.random()*0.4).toFixed(2);
      conf.style.pointerEvents = 'none';
      conf.style.transition = 'transform 0.27s cubic-bezier(.15,1.6,.4,.95), opacity 0.27s cubic-bezier(.15,1.6,.4,.95)';
      confettiContainer.appendChild(conf);
      // Animate outward instantly after DOM paint
      requestAnimationFrame(() => {
        const angle = (2 * Math.PI * i) / confettiCount;
        // Base and random velocity for confetti explosion (in px)
        const baseVelocity = 28; // <-- adjust these numbers to alter velocity
        const randomVelocity = 8; // <-- adjust these numbers to alter velocity
        const radius = baseVelocity + Math.random()*randomVelocity;
        conf.style.transform = `translate(-50%, -50%) translate(${Math.cos(angle)*radius}px, ${Math.sin(angle)*radius}px) rotate(${Math.random()*360}deg)`;
        // Start fade-out partway through movement
        setTimeout(() => {
          conf.style.opacity = '0';
        }, 100);
      });
      // Remove after animation
      setTimeout(() => {
        if (conf.parentNode) conf.parentNode.removeChild(conf);
      }, 290);
    }
  }
}



patternForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const errorDiv = document.getElementById('pattern-error');
  stitchGroups = parsePatternGroups(patternInput.value);
  const flat = flattenGroups(stitchGroups);
  stitches = flat.flat;
  if (!stitches.length) {
    errorDiv.textContent = "Didn't recognise that pattern, try again";
    errorDiv.style.display = 'block';
    return;
  } else {
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
  }
  stitchProgress = stitches.map(st => 0); // reset progress
  renderStitches();
  patternInput.blur();
});

// Hide error when user starts typing a new pattern
patternInput.addEventListener('input', () => {
  const errorDiv = document.getElementById('pattern-error');
  errorDiv.textContent = '';
  errorDiv.style.display = 'none';
});

resetBtn.addEventListener('click', () => {
  stitchProgress = stitches.map(st => 0);
  renderStitches();
});

/**
 * Undoes progress on the active stitch (called by backspace or UI),
 * or undoes the previous stitch if the active is empty.
 * Resets progress for all following stitches.
 */
function undoStitch() {
  if (!stitches.length) return;
  let activeIdx = getActiveStitchIdx();
  let idx = (activeIdx === -1) ? stitches.length - 1 : activeIdx;
  // If the active stitch has any progress, undo that progress
  if (idx >= 0 && stitchProgress[idx] > 0) {
    if ((stitches[idx] === 'inc' || stitches[idx] === 'dec') && stitchProgress[idx] === 2) {
      stitchProgress[idx] = 1;
    } else {
      stitchProgress[idx] = 0;
    }
  } else if (idx > 0) {
    // Otherwise, go to the previous stitch and undo its progress
    idx = idx - 1;
    if ((stitches[idx] === 'inc' || stitches[idx] === 'dec') && stitchProgress[idx] === 2) {
      stitchProgress[idx] = 1;
    } else {
      stitchProgress[idx] = 0;
    }
  }

  renderStitches();
}

undoBtn.addEventListener('click', undoStitch);

/**
 * Returns the index of the first incomplete ("active") stitch, or -1 if all are complete.
 */
function getActiveStitchIdx() {
  return stitches.findIndex((st, i) => ((st === 'inc' || st === 'dec') ? stitchProgress[i] !== 2 : stitchProgress[i] !== 1));
}

/**
 * Advances progress on the active stitch (called by spacebar or UI),
 * and resets progress for all following stitches.
 */
function advanceStitch() {
  if (!stitches.length) return;
  let idx = getActiveStitchIdx();
  if (idx === -1 || idx >= stitches.length) return;
  if (stitches[idx] === 'inc' || stitches[idx] === 'dec') {
    if ((stitchProgress[idx] || 0) === 0) {
      stitchProgress[idx] = 1; // half
    } else if (stitchProgress[idx] === 1) {
      stitchProgress[idx] = 2;
    }
  } else {
    if ((stitchProgress[idx] || 0) === 0) {
      stitchProgress[idx] = 1;
    }
  }

  renderStitches();
}

// Space bar to check off next stitch, Backspace to undo
window.addEventListener('keydown', (e) => {
  // Debug: log all keydown events
  console.log('keydown:', e.code, 'target:', document.activeElement.tagName);
  if (document.activeElement.tagName === 'INPUT') return;
  if (!stitches.length) return;
  // Advance triggers: Space, Enter/Return, Right Arrow
  if (
    e.code === 'Space' ||
    e.code === 'Enter' ||
    e.key === 'Enter' ||
    e.code === 'NumpadEnter' ||
    e.key === 'Return' ||
    e.code === 'ArrowRight' ||
    e.key === 'ArrowRight'
  ) {
    advanceStitch();
    e.preventDefault();
  // Undo triggers: Backspace, Left Arrow
  } else if (
    e.code === 'Backspace' || e.key === 'Backspace' ||
    e.code === 'ArrowLeft' || e.key === 'ArrowLeft'
  ) {
    console.log('Undo trigger:', e.code, e.key);
    undoStitch();
    e.preventDefault();
  }
});

// Initialize
renderStitches();

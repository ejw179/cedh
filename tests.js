// Pod math unit tests — run with: node tests.js
// Covers buildPods (round 1, random order) and seedPods (round 2+, sorted by points)

// ── Functions under test (must stay in sync with index.html) ─────────────────

function buildPods(players) {
  const n = players.length;
  const pods = [];
  let rem = [...players];
  const r = n % 4;

  if (r === 1 || r === 2) {
    while (rem.length > r) pods.push(rem.splice(0, 4));
    while (rem.length) pods.push(rem.splice(0, 1));
  } else {
    while (rem.length > 3) pods.push(rem.splice(0, 4));
    if (rem.length) pods.push(rem.splice(0));
  }
  return pods;
}

function seedPods(players, history, byedPlayerIds = new Set()) {
  const sorted = [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.wins - a.wins;
  });
  const n = sorted.length;
  const r = n % 4;

  if (r === 1 || r === 2) {
    const pool = [...sorted];
    const byePods = [];
    for (let i = 0; i < r; i++) {
      let byeIdx = -1;
      for (let j = pool.length - 1; j >= 0; j--) {
        if (!byedPlayerIds.has(pool[j].id)) { byeIdx = j; break; }
      }
      if (byeIdx === -1) byeIdx = pool.length - 1;
      byePods.push([pool.splice(byeIdx, 1)[0]]);
    }
    const regularPods = [];
    for (let i = 0; i < pool.length; i += 4) regularPods.push(pool.slice(i, i + 4));
    return [...regularPods, ...byePods];
  }

  const sizes = r === 0 ? Array(n / 4).fill(4) : [...Array((n - 3) / 4).fill(4), 3];
  const pods = [];
  let idx = 0;
  for (const size of sizes) {
    pods.push(sorted.slice(idx, idx + size));
    idx += size;
  }
  return pods;
}

// ── Test helpers ──────────────────────────────────────────────────────────────

function makePlayers(n) {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, points: 0, wins: 0 }));
}

let passed = 0;
let failed = 0;

function expect(label, pods, expectedSizes) {
  const actual = pods.map(p => p.length);
  const ok = JSON.stringify(actual) === JSON.stringify(expectedSizes);
  if (ok) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.log(`  ✗  ${label}`);
    console.log(`       expected: [${expectedSizes}]`);
    console.log(`       got:      [${actual}]`);
    failed++;
  }
}

function expectTotal(label, pods, n) {
  const total = pods.reduce((sum, p) => sum + p.length, 0);
  if (total !== n) {
    console.log(`  ✗  ${label} — player count: expected ${n}, got ${total}`);
    failed++;
  } else {
    passed++;
  }
}

// ── buildPods tests (round 1) ─────────────────────────────────────────────────

console.log('\nbuildPods (round 1)');
expect(' 4 players → 1×4',              buildPods(makePlayers(4)),  [4]);
expect(' 5 players → 1×4 + 1 bye',     buildPods(makePlayers(5)),  [4, 1]);
expect(' 6 players → 1×4 + 2 byes',    buildPods(makePlayers(6)),  [4, 1, 1]);
expect(' 7 players → 1×4 + 1×3',       buildPods(makePlayers(7)),  [4, 3]);
expect(' 8 players → 2×4',             buildPods(makePlayers(8)),  [4, 4]);
expect(' 9 players → 2×4 + 1 bye',     buildPods(makePlayers(9)),  [4, 4, 1]);
expect('10 players → 2×4 + 2 byes',    buildPods(makePlayers(10)), [4, 4, 1, 1]);
expect('11 players → 2×4 + 1×3',      buildPods(makePlayers(11)), [4, 4, 3]);
expect('12 players → 3×4',             buildPods(makePlayers(12)), [4, 4, 4]);

// ── seedPods tests (round 2+) ─────────────────────────────────────────────────

console.log('\nseedPods (round 2+)');
expect(' 4 players → 1×4',              seedPods(makePlayers(4),  {}), [4]);
expect(' 5 players → 1×4 + 1 bye',     seedPods(makePlayers(5),  {}), [4, 1]);
expect(' 6 players → 1×4 + 2 byes',    seedPods(makePlayers(6),  {}), [4, 1, 1]);
expect(' 7 players → 1×4 + 1×3',       seedPods(makePlayers(7),  {}), [4, 3]);
expect(' 8 players → 2×4',             seedPods(makePlayers(8),  {}), [4, 4]);
expect(' 9 players → 2×4 + 1 bye',     seedPods(makePlayers(9),  {}), [4, 4, 1]);
expect('10 players → 2×4 + 2 byes',    seedPods(makePlayers(10), {}), [4, 4, 1, 1]);
expect('11 players → 2×4 + 1×3',      seedPods(makePlayers(11), {}), [4, 4, 3]);
expect('12 players → 3×4',             seedPods(makePlayers(12), {}), [4, 4, 4]);

// ── Pod ordering: 4-player pods must come before smaller pods ─────────────────

console.log('\nPod ordering (4-player pods first)');

function assertFoursFirst(label, pods) {
  const sizes = pods.map(p => p.length).filter(s => s > 1);
  const sorted = [...sizes].sort((a, b) => b - a);
  const ok = JSON.stringify(sizes) === JSON.stringify(sorted);
  if (ok) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.log(`  ✗  ${label} — sizes not descending: [${sizes}]`);
    failed++;
  }
}

[7, 8, 11, 12].forEach(n => {
  assertFoursFirst(`${n} players buildPods`, buildPods(makePlayers(n)));
  assertFoursFirst(`${n} players seedPods`,  seedPods(makePlayers(n), {}));
});

// ── All players accounted for ─────────────────────────────────────────────────

console.log('\nAll players accounted for');
[4, 5, 6, 7, 8, 9, 10, 11, 12].forEach(n => {
  expectTotal(`buildPods ${n}p`, buildPods(makePlayers(n)), n);
  expectTotal(`seedPods  ${n}p`, seedPods(makePlayers(n), {}), n);
});
console.log(`  ✓  all player counts verified (${9 * 2} checks)`);

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(40)}`);
console.log(`  ${passed} passed  ${failed} failed`);
if (failed > 0) process.exit(1);

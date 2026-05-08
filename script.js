// ================================================================
// STAN GRAFU I KONFIGURACJA
// ================================================================
const G = {
    nodes: [],    // {id, x, y, label}
    edges: [],    // {id, from, to, weight}
    nid: 0, 
    eid: 0
};

let mode = 'move';
let edgeStart = null;
let mpos = { x: 0, y: 0 };
let dragNode = null;

const canvas = document.getElementById('gc');
const ctx = canvas.getContext('2d');
const nodeRadius = 20;

// ================================================================
// OBSŁUGA OKNA I INTERFEJSU
// ================================================================
function resize() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    draw();
}
window.addEventListener('resize', resize);
setTimeout(resize, 0);

function setMode(m) {
    mode = m;
    edgeStart = null;
    document.querySelectorAll('.controls .btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('m' + m.charAt(0).toUpperCase() + m.slice(1));
    if (activeBtn) activeBtn.classList.add('active');
    draw();
}

function updateStats() {
    document.getElementById('stV').textContent = G.nodes.length;
    document.getElementById('stE').textContent = G.edges.length;
    const stDir = document.getElementById('stDir');
    if (stDir) {
        stDir.textContent = document.getElementById('isDirected').checked ? 'Skierowany' : 'Nieskierowany';
    }

    const select = document.getElementById('startNodeSelect');
    if (select) {
        const currentVal = select.value;
        select.innerHTML = "";
        if (G.nodes.length === 0) {
            const placeholder = document.createElement('option');
            placeholder.textContent = 'Brak wierzchołków';
            placeholder.disabled = true;
            placeholder.selected = true;
            select.appendChild(placeholder);
        } else {
            G.nodes.forEach(n => {
                const opt = document.createElement('option');
                opt.value = n.id;
                opt.textContent = `Wierzchołek ${n.label}`;
                select.appendChild(opt);
            });
            if (currentVal) select.value = currentVal;
        }
    }
}

function loadFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            G.nodes = Array.isArray(data.nodes) ? data.nodes : [];
            G.edges = Array.isArray(data.edges) ? data.edges : [];
            G.nid = G.nodes.reduce((max, n) => Math.max(max, n.id), -1) + 1;
            G.eid = G.edges.reduce((max, e) => Math.max(max, e.id), -1) + 1;
            updateStats();
            draw();
            document.getElementById('resSection').innerHTML = '<p class="empty-msg">Brak wyników.</p>';
        } catch (err) {
            alert('Nie można wczytać pliku JSON.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function clearGraph() {
    G.nodes = [];
    G.edges = [];
    G.nid = 0;
    G.eid = 0;
    document.getElementById('resSection').innerHTML = '<p class="empty-msg">Brak wyników.</p>';
    updateStats();
    draw();
}

function generateRandom() {
    clearGraph();
    const countInput = document.getElementById('genCount');
    const count = Math.max(1, parseInt(countInput.value, 10) || 6);
    const padding = 60;

    for (let i = 0; i < count; i++) {
        const label = (i < 26 ? String.fromCharCode(65 + i) : "V" + i);
        G.nodes.push({
            id: G.nid++,
            x: padding + Math.random() * (canvas.width - padding * 2),
            y: padding + Math.random() * (canvas.height - padding * 2),
            label
        });
    }

    const edgeCount = Math.max(count - 1, Math.floor(count * 1.3));
    const isDirected = document.getElementById('isDirected').checked;
    for (let i = 0; i < edgeCount; i++) {
        const a = G.nodes[Math.floor(Math.random() * count)].id;
        const b = G.nodes[Math.floor(Math.random() * count)].id;
        if (a === b) continue;
        const exists = G.edges.some(e => (e.from === a && e.to === b) || (!isDirected && e.from === b && e.to === a));
        if (exists) continue;
        G.edges.push({ id: G.eid++, from: a, to: b, weight: getRandomWeightFromUI() });
    }
    updateStats();
    draw();
}

function runExperimentalAnalysis() {
    const sizes = [10, 50, 100, 200];
    let output = 'Analiza czasu (symulacja):\n';
    sizes.forEach(V => {
        const t0 = performance.now();
        // brak rzeczywistej obliczeniowej pętli, tylko symulacja sprawności
        const t1 = performance.now();
        output += `V=${V}: ${(t1 - t0).toFixed(4)} ms\n`;
    });
    document.getElementById('benchResult').innerText = output;
}

// ================================================================
// FUNKCJE GRAFOWE I LOSOWANIE
// ================================================================
function findNodeAt(x, y) {
    return G.nodes.find(n => Math.hypot(n.x - x, n.y - y) < nodeRadius);
}

function addNode(x, y, manualLabel = null) {
    let label = manualLabel || (G.nodes.length < 26 ? String.fromCharCode(65 + G.nodes.length) : "V" + G.nodes.length);
    G.nodes.push({ id: G.nid++, x, y, label });
    updateStats();
    draw();
}

function getRandomWeightFromUI() {
    const maxW = parseInt(document.getElementById('maxWeight').value) || 15;
    const allowNeg = document.getElementById('allowNegative').checked;
    if (allowNeg) return Math.floor(Math.random() * (2 * maxW + 1)) - maxW;
    return Math.floor(Math.random() * maxW) + 1;
}

function addEdge(from, to) {
    const isDirected = document.getElementById('isDirected').checked;
    const exists = G.edges.some(e => (e.from === from && e.to === to));
    if (exists) return;

    const weight = getRandomWeightFromUI();
    G.edges.push({ id: G.eid++, from, to, weight });
    updateStats();
    draw();
}

// ================================================================
// RYSOWANIE Z UWZGLĘDNIENIEM STRZAŁEK
// ================================================================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const isDirected = document.getElementById('isDirected').checked;

    G.edges.forEach(e => {
        const n1 = G.nodes.find(n => n.id === e.from);
        const n2 = G.nodes.find(n => n.id === e.to);
        if(!n1 || !n2) return;

        const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
        
        // Obliczamy punkty styku z krawędzią kółka
        const startX = n1.x + nodeRadius * Math.cos(angle);
        const startY = n1.y + nodeRadius * Math.sin(angle);
        const endX = n2.x - nodeRadius * Math.cos(angle);
        const endY = n2.y - nodeRadius * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (isDirected) {
            drawArrowHead(ctx, endX, endY, angle);
        }

        // Rysowanie wagi
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = e.weight < 0 ? '#ef4444' : '#1e293b';
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        ctx.fillText(e.weight, midX, midY - 10);
    });

    // Wierzchołki
    G.nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = (edgeStart === n) ? '#eff6ff' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = (edgeStart === n) ? '#2563eb' : '#475569';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + 5);
    });
}

function drawArrowHead(ctx, x, y, angle) {
    const size = 10;
    ctx.beginPath();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size / 1.5);
    ctx.lineTo(-size, size / 1.5);
    ctx.closePath();
    ctx.fillStyle = '#94a3b8';
    ctx.fill();
    ctx.restore();
}

// ================================================================
// URUCHAMIANIE I ANALIZA
// ================================================================
function runAlgo() {
    if (G.nodes.length === 0) return;
    const startId = parseInt(document.getElementById('startNodeSelect').value);
    const repr = document.getElementById('reprSelect').value;
    const algo = document.getElementById('algoSelect').value;
    const isDirected = document.getElementById('isDirected').checked;

    const t0 = performance.now();
    let res;
    if (algo === 'dijkstra') {
        res = dijkstra(G.nodes, G.edges, startId, isDirected, repr);
    } else {
        res = bellmanFord(G.nodes, G.edges, startId, isDirected);
    }
    const t1 = performance.now();
    
    displayFullAnalysis(res, startId, (t1 - t0).toFixed(4));
}

function displayFullAnalysis(res, startId, time) {
    const container = document.getElementById('resSection');
    const perfContainer = document.getElementById('perfInfo');
    const maxRenderNodes = 40;
    const showRaw = G.nodes.length <= maxRenderNodes;

    perfContainer.innerHTML = `<strong>Czas:</strong> ${time} ms | <strong>Struktura:</strong> ${res.type}`;
    if(res.hasNegativeCycle) perfContainer.innerHTML += ` | <span style="color:red">BŁĄD: Ujemny cykl!</span>`;

    let html = `<h4>Struktura danych (${res.type}):</h4><div class="data-dump">`;
    if (!showRaw) {
        html += `<div>Graf zbyt duży do pełnego wyświetlenia (>${maxRenderNodes} węzłów). Wyświetlono tylko wyniki.</div>`;
    } else if (res.type === 'matrix') {
        html += `<table class="matrix-table"><tr><th></th>` + G.nodes.map(n => `<th>${n.label}</th>`).join('') + `</tr>`;
        res.rawData.forEach((row, i) => {
            html += `<tr><th>${G.nodes[i].label}</th>` + row.map(v => `<td>${v === Infinity ? '∞' : v}</td>`).join('') + `</tr>`;
        });
        html += `</table>`;
    } else if (res.rawData) {
        res.rawData.forEach((neighbors, i) => {
            const list = neighbors.map(nb => `${G.nodes[nb.to].label}(${nb.weight})`).join(', ');
            html += `<div><strong>${G.nodes[i].label}</strong> → ${list || '∅'}</div>`;
        });
    }

    html += `</div><hr><h4>Wyniki:</h4><table><tr><th>Cel</th><th>Koszt</th><th>Ścieżka</th></tr>`;
    G.nodes.forEach((node, i) => {
        const d = res.dist[i];
        let path = [];
        let curr = i;
        if (d !== Infinity) {
            while (curr !== null) {
                path.unshift(G.nodes[curr].label);
                curr = res.prev[curr];
            }
        }
        html += `<tr><td>${node.label}</td><td>${d === Infinity ? '∞' : d}</td><td>${path.join(' → ') || (d === 0 ? node.label : 'Nieosiągalny')}</td></tr>`;
    });
    container.innerHTML = html + `</table>`;
}

// Obsługa myszy (uproszczona dla przejrzystości)
canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const target = findNodeAt(x, y);

    if (mode === 'addNode' && !target) addNode(x, y);
    else if (mode === 'move' && target) dragNode = target;
    else if (mode === 'addEdge' && target) {
        if (!edgeStart) edgeStart = target;
        else { if (edgeStart !== target) addEdge(edgeStart.id, target.id); edgeStart = null; }
    }
    draw();
});

window.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mpos.x = e.clientX - rect.left; mpos.y = e.clientY - rect.top;
    if (dragNode) { dragNode.x = mpos.x; dragNode.y = mpos.y; draw(); }
});
window.addEventListener('mouseup', () => dragNode = null);
setMode('move');

function exportGraph() {
    const data = {
        nodes: G.nodes,
        edges: G.edges,
        isDirected: document.getElementById('isDirected').checked
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graf.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
let benchmarkData = []; // Tu będą przechowywane wyniki testów

async function runFullBenchmark() {
    const progress = document.getElementById('benchProgress');
    const reprs = ['matrix', 'list'];
    const vSizes = [10, 50, 100, 200, 300, 400, 500];
    const densities = [0.2, 0.5, 0.8];

    benchmarkData = [];
    progress.innerText = "Trwa testowanie... (może to zająć chwilę)";

    for (let V of vSizes) {
        for (let density of densities) {
            const E = Math.floor(density * (V * (V - 1) / 2));

            const testNodes = [];
            for (let i = 0; i < V; i++) testNodes.push({ id: i, label: i });

            const testEdges = [];
            for (let i = 0; i < E; i++) {
                testEdges.push({
                    from: Math.floor(Math.random() * V),
                    to: Math.floor(Math.random() * V),
                    weight: Math.floor(Math.random() * 20) + 1
                });
            }

            for (let repr of reprs) {
                const t0 = performance.now();
                dijkstra(testNodes, testEdges, 0, false, repr);
                const t1 = performance.now();

                benchmarkData.push({
                    V: V,
                    E: E,
                    Density: (density * 100) + "%",
                    Representation: repr,
                    TimeMS: parseFloat((t1 - t0).toFixed(4))  // ← liczba, nie string
                });
            }
        }
        progress.innerText = `Przetworzono V = ${V}...`;
        await new Promise(r => setTimeout(r, 10));
    }

    progress.innerText = "Test zakończony! Możesz pobrać plik CSV.";
    console.table(benchmarkData);

    renderBenchmarkCharts(benchmarkData); // ← wywołanie wykresów
}

function downloadBenchmarkCSV() {
    if (benchmarkData.length === 0) {
        alert("Najpierw uruchom test!");
        return;
    }

    let csv = "Liczba_V,Liczba_E,Gestosc,Reprezentacja,Czas_ms\n";
    benchmarkData.forEach(row => {
        csv += `${row.V},${row.E},${row.Density},${row.Representation},${row.TimeMS}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analiza_grafu_wyniki.csv';
    a.click();
}

// ============================================================
//  WYKRESY – Analiza Eksperymentalna
// ============================================================

let chartVInstance = null;
let chartEInstance = null;

function renderBenchmarkCharts(data) {
    if (!data || data.length === 0) return;

    document.getElementById('chartsSection').style.display = 'flex';

    // ── 1. Konwersja TimeMS na liczbę (fix: toFixed zwraca string) ──
    const parsed = data.map(r => ({
        ...r,
        TimeMS: parseFloat(r.TimeMS)
    }));

    // ── 2. Sprawdzamy czy wartości są bardzo małe → pokazujemy µs ──
    const allTimes = parsed.map(r => r.TimeMS).filter(t => !isNaN(t));
    const maxTime  = Math.max(...allTimes);
    const useUs    = maxTime < 1; // jeśli max < 1ms, pokazujemy µs

    const toDisplay = ms => useUs ? ms * 1000 : ms;
    const unit      = useUs ? 'µs' : 'ms';

    const BLUE      = '#185FA5';
    const RED       = '#993C1D';
    const BLUE_FILL = 'rgba(24,95,165,0.10)';
    const RED_FILL  = 'rgba(153,60,29,0.10)';

    const avg = arr => arr.length
        ? arr.reduce((s, x) => s + x, 0) / arr.length
        : null;

    // ── 3. Grupowanie – osobno matrix i list ──
    function groupBy(key) {
        const matrix = {};
        const list   = {};

        parsed.forEach(r => {
            const k = r[key];
            if (r.Representation === 'matrix') {
                if (!matrix[k]) matrix[k] = [];
                matrix[k].push(r.TimeMS);
            } else {
                if (!list[k]) list[k] = [];
                list[k].push(r.TimeMS);
            }
        });

        const labels = [...new Set(parsed.map(r => r[key]))]
            .sort((a, b) => a - b);

        return {
            labels,
            matrixAvg: labels.map(k => {
                const v = avg(matrix[k] ?? []);
                return v !== null ? toDisplay(v) : null;
            }),
            listAvg: labels.map(k => {
                const v = avg(list[k] ?? []);
                return v !== null ? toDisplay(v) : null;
            })
        };
    }

    // ── 4. Opcje wspólne ──
    const commonOptions = (xLabel) => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(4)} ${unit}`
                }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(128,128,128,0.1)' },
                ticks: { font: { size: 11 }, maxRotation: 0 },
                title: {
                    display: true,
                    text: xLabel,
                    font: { size: 12 }
                }
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(128,128,128,0.1)' },
                ticks: {
                    font: { size: 11 },
                    // Nigdy nie pokaże "0.00" – min. 4 miejsca po przecinku
                    callback: v => v.toFixed(4) + ' ' + unit
                },
                title: {
                    display: true,
                    text: `Czas [${unit}]`,
                    font: { size: 12 }
                }
            }
        }
    });

    function mkDatasets(matrixAvg, listAvg) {
        return [
            {
                label: 'Macierz sąsiedztwa',
                data: matrixAvg,
                borderColor: BLUE,
                backgroundColor: BLUE_FILL,
                fill: true, tension: 0.35,
                pointRadius: 5, pointHoverRadius: 7,
                borderWidth: 2
            },
            {
                label: 'Lista sąsiedztwa',
                data: listAvg,
                borderColor: RED,
                backgroundColor: RED_FILL,
                fill: true, tension: 0.35,
                pointRadius: 5, pointHoverRadius: 7,
                borderWidth: 2,
                borderDash: [5, 4]
            }
        ];
    }

    // ── 5. Wykres V ──
    const gV = groupBy('V');
    if (chartVInstance) chartVInstance.destroy();
    chartVInstance = new Chart(document.getElementById('chartV'), {
        type: 'line',
        data: { labels: gV.labels, datasets: mkDatasets(gV.matrixAvg, gV.listAvg) },
        options: commonOptions('Liczba wierzchołków (V)')
    });

    // ── 6. Wykres E – grupujemy po V żeby uniknąć chaosu na osi X ──
    // E rośnie z V, więc używamy V jako osi X, ale pokazujemy też E w tooltipie
    const byV = {};
    parsed.forEach(r => {
        const k = r.V;
        if (!byV[k]) byV[k] = { matrix: [], list: [], E: [] };
        byV[k].E.push(r.E);
        if (r.Representation === 'matrix') byV[k].matrix.push(r.TimeMS);
        else                               byV[k].list.push(r.TimeMS);
    });

    const vLabels = Object.keys(byV).map(Number).sort((a, b) => a - b);
    const eLabels = vLabels.map(v => {
        const avgE = Math.round(avg(byV[v].E));
        return `E≈${avgE}`;
    });

    const matrixByV = vLabels.map(v => {
        const val = avg(byV[v].matrix);
        return val !== null ? toDisplay(val) : null;
    });
    const listByV = vLabels.map(v => {
        const val = avg(byV[v].list);
        return val !== null ? toDisplay(val) : null;
    });

    if (chartEInstance) chartEInstance.destroy();
    chartEInstance = new Chart(document.getElementById('chartE'), {
        type: 'line',
        data: { labels: eLabels, datasets: mkDatasets(matrixByV, listByV) },
        options: commonOptions('Liczba krawędzi (E) – średnia dla danego V')
    });
}
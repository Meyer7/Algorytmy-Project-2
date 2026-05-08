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
    const densities = [0.2, 0.5, 0.8]; // 20%, 50%, 80% gęstości krawędzi
    
    benchmarkData = [];
    progress.innerText = "Trwa testowanie... (może to zająć chwilę)";

    // Używamy setTimeout, aby UI nie zamarzło
    for (let V of vSizes) {
        for (let density of densities) {
            // Obliczamy liczbę krawędzi E na podstawie gęstości
            // Max krawędzi to V*(V-1)/2 (dla nieskierowanego)
            const E = Math.floor(density * (V * (V - 1) / 2));
            
            // Generujemy testowy zestaw danych (tylko w pamięci, bez rysowania)
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
                // Wykonujemy algorytm (Dijkstra najlepiej pokazuje różnice reprezentacji)
                dijkstra(testNodes, testEdges, 0, false, repr);
                const t1 = performance.now();

                benchmarkData.push({
                    V: V,
                    E: E,
                    Density: (density * 100) + "%",
                    Representation: repr,
                    TimeMS: (t1 - t0).toFixed(4)
                });
            }
        }
        progress.innerText = `Przetworzono V = ${V}...`;
        await new Promise(r => setTimeout(r, 10)); // Chwila oddechu dla przeglądarki
    }

    progress.innerText = "Test zakończony! Możesz pobrać plik CSV.";
    console.table(benchmarkData); // Wyniki w konsoli dla szybkiego podglądu
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
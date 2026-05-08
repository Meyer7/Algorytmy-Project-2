<<<<<<< HEAD
/**
 * Buduje strukturę danych w zależności od wybranej reprezentacji.
 * To jest kluczowe dla Twojej analizy porównawczej.
 */
function getGraphData(nodes, edges, isDirected, type) {
    const V = nodes.length;
    const nodeMap = {};
    nodes.forEach((n, i) => nodeMap[n.id] = i);

    if (type === 'matrix') {
        const matrix = Array.from({ length: V }, () => Array(V).fill(Infinity));
        for (let i = 0; i < V; i++) matrix[i][i] = 0;
        edges.forEach(e => {
            const u = nodeMap[e.from];
            const v = nodeMap[e.to];
            matrix[u][v] = e.weight;
            if (!isDirected) matrix[v][u] = e.weight; // Symetria dla nieskierowanego
        });
        return { data: matrix, nodeMap };
    } else {
        const adj = Array.from({ length: V }, () => []);
        edges.forEach(e => {
            const u = nodeMap[e.from];
            const v = nodeMap[e.to];
            adj[u].push({ to: v, weight: e.weight });
            if (!isDirected) adj[v].push({ to: u, weight: e.weight });
        });
        return { data: adj, nodeMap };
    }
}

function dijkstra(nodes, edges, startNodeId, isDirected, type) {
    const { data, nodeMap } = getGraphData(nodes, edges, isDirected, type);
    const V = nodes.length;
    const startIdx = nodeMap[startNodeId];
    
    const dist = Array(V).fill(Infinity);
    const prev = Array(V).fill(null);
    const visited = Array(V).fill(false);
    dist[startIdx] = 0;

    for (let i = 0; i < V; i++) {
        let u = -1;
        for (let j = 0; j < V; j++) {
            if (!visited[j] && (u === -1 || dist[j] < dist[u])) u = j;
        }

        if (u === -1 || dist[u] === Infinity) break;
        visited[u] = true;

        if (type === 'matrix') {
            for (let v = 0; v < V; v++) {
                if (data[u][v] !== Infinity) {
                    let alt = dist[u] + data[u][v];
                    if (alt < dist[v]) { dist[v] = alt; prev[v] = u; }
                }
            }
        } else {
            data[u].forEach(edge => {
                let alt = dist[u] + edge.weight;
                if (alt < dist[edge.to]) { dist[edge.to] = alt; prev[edge.to] = u; }
            });
        }
    }
    return { dist, prev, nodeMap, rawData: data, type };
}

function bellmanFord(nodes, edges, startNodeId, isDirected) {
    const V = nodes.length;
    const nodeMap = {};
    nodes.forEach((n, i) => nodeMap[n.id] = i);
    
    const dist = Array(V).fill(Infinity);
    const prev = Array(V).fill(null);
    dist[nodeMap[startNodeId]] = 0;

    for (let i = 0; i < V - 1; i++) {
        edges.forEach(e => {
            const u = nodeMap[e.from];
            const v = nodeMap[e.to];
            if (dist[u] !== Infinity && dist[u] + e.weight < dist[v]) {
                dist[v] = dist[u] + e.weight;
                prev[v] = u;
            }
            if (!isDirected && dist[v] !== Infinity && dist[v] + e.weight < dist[u]) {
                dist[u] = dist[v] + e.weight;
                prev[u] = v;
            }
        });
    }
    // Zwracamy typ 'list', aby system wiedział jak to wyświetlić
    return { dist, prev, nodeMap, type: 'list', rawData: null }; 
=======
/**
 * Buduje strukturę danych w zależności od wybranej reprezentacji.
 * To jest kluczowe dla Twojej analizy porównawczej.
 */
function getGraphData(nodes, edges, isDirected, type) {
    const V = nodes.length;
    const nodeMap = {};
    nodes.forEach((n, i) => nodeMap[n.id] = i);

    if (type === 'matrix') {
        const matrix = Array.from({ length: V }, () => Array(V).fill(Infinity));
        for (let i = 0; i < V; i++) matrix[i][i] = 0;
        edges.forEach(e => {
            const u = nodeMap[e.from];
            const v = nodeMap[e.to];
            matrix[u][v] = e.weight;
            if (!isDirected) matrix[v][u] = e.weight; // Symetria dla nieskierowanego
        });
        return { data: matrix, nodeMap };
    } else {
        const adj = Array.from({ length: V }, () => []);
        edges.forEach(e => {
            const u = nodeMap[e.from];
            const v = nodeMap[e.to];
            adj[u].push({ to: v, weight: e.weight });
            if (!isDirected) adj[v].push({ to: u, weight: e.weight });
        });
        return { data: adj, nodeMap };
    }
}

function dijkstra(nodes, edges, startNodeId, isDirected, type) {
    const { data, nodeMap } = getGraphData(nodes, edges, isDirected, type);
    const V = nodes.length;
    const startIdx = nodeMap[startNodeId];
    
    const dist = Array(V).fill(Infinity);
    const prev = Array(V).fill(null);
    const visited = Array(V).fill(false);
    dist[startIdx] = 0;

    for (let i = 0; i < V; i++) {
        let u = -1;
        for (let j = 0; j < V; j++) {
            if (!visited[j] && (u === -1 || dist[j] < dist[u])) u = j;
        }

        if (u === -1 || dist[u] === Infinity) break;
        visited[u] = true;

        if (type === 'matrix') {
            for (let v = 0; v < V; v++) {
                if (data[u][v] !== Infinity) {
                    let alt = dist[u] + data[u][v];
                    if (alt < dist[v]) { dist[v] = alt; prev[v] = u; }
                }
            }
        } else {
            data[u].forEach(edge => {
                let alt = dist[u] + edge.weight;
                if (alt < dist[edge.to]) { dist[edge.to] = alt; prev[edge.to] = u; }
            });
        }
    }
    return { dist, prev, nodeMap, rawData: data, type };
}

function bellmanFord(nodes, edges, startNodeId, isDirected) {
    const V = nodes.length;
    const nodeMap = {};
    nodes.forEach((n, i) => nodeMap[n.id] = i);
    
    const dist = Array(V).fill(Infinity);
    const prev = Array(V).fill(null);
    dist[nodeMap[startNodeId]] = 0;

    for (let i = 0; i < V - 1; i++) {
        edges.forEach(e => {
            const u = nodeMap[e.from];
            const v = nodeMap[e.to];
            if (dist[u] !== Infinity && dist[u] + e.weight < dist[v]) {
                dist[v] = dist[u] + e.weight;
                prev[v] = u;
            }
            if (!isDirected && dist[v] !== Infinity && dist[v] + e.weight < dist[u]) {
                dist[u] = dist[v] + e.weight;
                prev[u] = v;
            }
        });
    }
    // Zwracamy typ 'list', aby system wiedział jak to wyświetlić
    return { dist, prev, nodeMap, type: 'list', rawData: null }; 
>>>>>>> 32b4c9cfad65f744a6f86c1c2f7e06640748dbcf
}
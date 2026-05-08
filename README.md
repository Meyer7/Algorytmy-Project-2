# Algorytmy-Project-2

Projekt implementuje grafy w postaci listy sąsiedztwa lub macierzy sąsiedztwa.

## Funkcje

- Grafy skierowane i nieskierowane
- Grafy ważone
- Wczytywanie grafu z pliku tekstowego
- Generowanie grafu losowego
- Algorytmy:
  - Dijkstra
  - Bellman-Ford
  - Prim (MST)
- Interfejs HTML do uruchamiania algorytmów i wyświetlania wyników

## Jak używać

1. Otwórz `index.html` w przeglądarce obsługującej moduły ES.
2. Wybierz algorytm, typ reprezentacji grafu oraz czy graf ma być skierowany.
3. Możesz wygenerować losowy graf lub wczytać go z pliku.
4. Dla Dijkstry i Bellmana-Forda podaj wierzchołek startowy.
5. Dla Prima uzyskasz łączną wagę MST oraz listę krawędzi drzewa.

## Format pliku grafu

Plik powinien mieć postać:

```txt
v E directed
u v weight
...
```

Przykład:

```txt
6 9 0
0 1 7
0 2 9
0 5 14
1 2 10
1 3 15
2 3 11
2 5 2
3 4 6
4 5 9
```

- `v` — liczba wierzchołków
- `E` — liczba krawędzi (opcjonalne)
- `directed` — `0` lub `1`, `tak`/`nie`
- `u`, `v` — numer wierzchołków
- `weight` — waga krawędzi

## Benchmark

Uruchom `node Benchmark.js` w katalogu projektu.

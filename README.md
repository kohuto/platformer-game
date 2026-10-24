# Platformer Game

Jednoduchá 2D plošinovka vytvořená v HTML, CSS, JavaScriptu a [Phaseru](https://phaser.io/).

## Lokální spuštění

Protože hra načítá Phaser z CDN, je vhodné ji spouštět přes jednoduchý lokální HTTP server:

```bash
python3 -m http.server 8000
```

Potom otevřete [http://localhost:8000](http://localhost:8000) v prohlížeči.

## Ovládání

- `←` / `A` — pohyb doleva
- `→` / `D` — pohyb doprava
- `↑` / `W` / mezerník — skok
- `X` — střelba ve směru, kterým postava míří

## Struktura

```text
.
├── index.html          # Vstupní stránka hry
├── css/
│   └── style.css       # Vzhled stránky a herního rámu
├── js/
│   └── game.js         # Konfigurace Phaseru a herní scéna
└── assets/             # Budoucí obrázky, zvuky a sprity
```

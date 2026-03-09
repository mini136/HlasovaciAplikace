# scriptsToDestroy (test only)

Tyto skripty jsou pouze pro **vlastní testovací prostředí**, aby šly sledovat anomálie návštěv ve statistikách (např. Google Analytics).

## Frontend anomaly simulator

Soubor: `frontend-anomaly-simulator.mjs`

### Co dělá
- posílá paralelní GET návštěvy na frontend URL,
- mění `User-Agent` (včetně `curl`/`wget` stylu),
- přidává neobvyklé "viewport" signály v hlavičce `X-Simulated-Viewport`,
- simuluje burst chování (hodně requestů v krátkém čase).

### Spuštění
V kořeni projektu:

```bash
node scriptsToDestroy/frontend-anomaly-simulator.mjs --url=http://localhost:40160/ --threads=12 --requests=150 --minDelay=10 --maxDelay=120
```

### Poznámka ke Google Analytics
GA typicky měří JS eventy v browseru; tento skript generuje HTTP návštěvy bez vykreslení JS jako reálný browser. Přesto je vhodný pro pozorování nestandardního provozu na úrovni web server logů a základních návštěvnostních signálů.

## GA browser simulator (doporučeno pro Google Analytics)

Soubor: `frontend-ga-browser-simulator.mjs`

### Proč ho použít
- spouští reálný browser engine (Playwright/Chromium),
- načte stránku jako normální uživatel,
- tím se spustí i JS měření (např. Google Analytics tag).

### Instalace

```bash
cd scriptsToDestroy
npm install
npx playwright install chromium
```

### Spuštění

```bash
node frontend-ga-browser-simulator.mjs --url=http://46.13.167.200:40160/ --sessions=50 --concurrency=10 --minStayMs=1200 --maxStayMs=5000
```

`--headless=false` otevře viditelné okno browseru.

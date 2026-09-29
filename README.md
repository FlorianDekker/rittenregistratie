# Rittenregistratie 🚗

Een web-app (PWA) om zakelijke en privé-ritten met de auto van de zaak bij te
houden, met bewijslast richting de Belastingdienst (max. 500 km privé per
kalenderjaar). Ritten komen automatisch binnen via een iPhone-automatisering
(Opdrachten/Shortcuts) die bij het verbinden/verbreken van de Bluetooth of
CarPlay van je auto een regel toevoegt aan `Rittenlog.txt` in iCloud Drive.
Data staat **lokaal** in je browser (IndexedDB) — er is geen server.

## Functies
- 📥 Import van `Rittenlog.txt`: START/STOP-events worden gekoppeld tot
  ritten, robuust tegen komma-decimalen, afwijkende datumnotaties en
  dubbele/groeiende bestanden
- 🛣️ Afstand via OSRM (routeafstand), met hemelsbrede schatting als fallback
- 🔢 Kilometerstand-keten met **ijkpunten**: voer de echte tellerstand in en
  het verschil wordt evenredig verdeeld over de ritten sinds het vorige
  ijkpunt
- 📍 Vaste locaties (Thuis, Kantoor, ...) met automatisch label, en
  standaardregels per locatiepaar (bijv. woon-werk = zakelijk)
- ✅ Ritten bekijken/bewerken per maand, zakelijk/privé met één tik wisselen,
  ritten samenvoegen (bijv. na een tankstop), wijzigingslog per rit
- 📊 Dashboard: privé-km dit jaar t.o.v. de 500 km-grens, zakelijke km,
  ritten "te controleren", laatste ijkpunt
- 📄 CSV-export per jaar/maand (NL-notatie, voor de Belastingdienst)
- 💾 Volledige back-up als JSON
- 📱 Installeerbaar op je telefoon (PWA)

## Lokaal draaien
```bash
npm install
npm run dev        # http://localhost:5173
```

## iPhone instellen
Zie **Instellingen → Help** in de app, of [docs/OPDRACHTEN.md](docs/OPDRACHTEN.md)
voor de volledige stap-voor-stap instructies (Opdrachten-app, iOS 17/18).

## Bouwen, linten en testen
```bash
npm run build       # productie-build in dist/
npm run lint        # oxlint
npm test            # vitest (pure logica: parser, koppelen, km-keten, CSV, ...)
npm run preview     # test de productie-build lokaal
```

## Architectuur
- `src/lib/` — pure logica (geen DB/netwerk), met vitest-tests:
  `parser.ts` (Rittenlog.txt inlezen), `linking.ts` (START/STOP koppelen),
  `distance.ts` (OSRM + schatting), `geocode.ts` (Nominatim reverse
  geocoding), `kmchain.ts` (kilometerstand-keten + ijkpunt-verdeling),
  `merge.ts` (samenvoeg-suggesties), `locations.ts` (locatie-matching),
  `csv.ts` / `format.ts` (export & NL-notatie).
- `src/db.ts` — Dexie (IndexedDB) schema en CRUD.
- `src/actions.ts` — orkestratie tussen `lib/` en `db.ts` (import-pipeline,
  ijkpunten toepassen, ritten samenvoegen).
- `src/pages/` — React-pagina's, `src/components/` — gedeelde UI.

## Publiceren op GitHub Pages
Deze repo bevat een workflow (`.github/workflows/deploy.yml`) die bij elke
push naar `main` bouwt en publiceert naar GitHub Pages, op het pad
`/rittenregistratie/`. In dev draait de app op `/`.

## Let op
- Alles blijft lokaal op je toestel; er wordt geen data naar een server
  gestuurd, behalve de afstandsberekening (OSRM) en reverse geocoding
  (Nominatim), die alleen coördinaten versturen — geen persoonsgegevens.
- Maak regelmatig een back-up (Instellingen → Back-up exporteren).

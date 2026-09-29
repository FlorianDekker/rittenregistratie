# iPhone-instructies: Opdrachten (Shortcuts) voor Rittenregistratie

Deze app leest een tekstbestand `Rittenlog.txt` dat je iPhone automatisch
aanvult zodra je verbinding maakt met (of verbreekt van) de Bluetooth/CarPlay
van je auto. Hieronder staat hoe je dat instelt met de app **Opdrachten**
(Shortcuts), in het Nederlands, voor iOS 17/18.

## 0. Voorwaarden

1. Open **Instellingen → Privacy en beveiliging → Locatievoorzieningen** en
   zet Locatievoorzieningen aan.
2. Zoek in dezelfde lijst de app **Opdrachten** op en zet de toegang op
   **"Altijd"** (of minimaal "Tijdens gebruik van de app", maar "Altijd" is
   nodig omdat de automatisering op de achtergrond moet kunnen draaien).
   Zet ook **"Nauwkeurige locatie"** aan.
3. Zorg dat iCloud Drive aanstaat (Instellingen → [jouw naam] → iCloud →
   iCloud Drive) zodat het bestand `Rittenlog.txt` synchroniseert.

## 1. Opdracht "Rit start" maken

1. Open de app **Opdrachten** → tab **Opdrachten** → **+** (nieuwe opdracht).
2. Geef de opdracht de naam **"Rit start"**.
3. Voeg de volgende acties toe, in deze volgorde:
   1. **Huidige locatie ophalen**
   2. **Details van locaties ophalen** — invoer: de uitvoer van de vorige
      stap. Vraag de details op: **Breedtegraad**, **Lengtegraad**, en
      **Straat, Postcode, Stad** (of kies "Volledig adres" als je dat
      liever hebt — de app ondersteunt allebei; leeg mag ook, dan vult de
      app het adres later automatisch aan).
   3. **Huidige datum**
   4. **Datum opmaken** — invoer: de uitvoer van "Huidige datum". Kies
      notatie **Aangepast** met formaat **ISO 8601** (of stel handmatig in:
      `jjjj-MM-dd'T'HH:mm:ssZZZZZ`), zodat je een tijdstip als
      `2026-09-29T08:12:33+02:00` krijgt.
   5. **Tekst** — stel de tekst hierin samen:
      ```
      START|[Datum opgemaakt]|[Breedtegraad]|[Lengtegraad]|[Adres]
      ```
      Sleep de betreffende variabelen (uit stap 2 en 4) op de juiste plek
      tussen de `|`-tekens. Zorg dat er geen losse spaties bij komen.
   6. **Voeg toe aan tekstbestand** — invoer: de tekst uit de vorige stap.
      - Bestand: kies of maak `Rittenlog.txt`.
      - Locatie: **iCloud Drive → Shortcuts** (de standaard Opdrachten-map).
      - Zet **"Nieuwe regel maken"** aan, zodat elk event op een eigen
        regel komt.
4. Sla de opdracht op (tik op **Gereed**).

## 2. Opdracht "Rit stop" maken

Herhaal stap 1, maar:
- Noem de opdracht **"Rit stop"**.
- Gebruik in de tekst-actie `STOP` in plaats van `START`:
  ```
  STOP|[Datum opgemaakt]|[Breedtegraad]|[Lengtegraad]|[Adres]
  ```
- Verder identiek (zelfde bestand, zelfde "Nieuwe regel maken" aan).

## 3. Automatisering koppelen aan de Bluetooth van je auto

1. Open **Opdrachten** → tab **Automatisering** → **+** (rechtsboven) →
   **Nieuwe persoonlijke automatisering**.
2. Kies **Bluetooth** → selecteer het Bluetooth-apparaat van je auto uit de
   lijst (koppel de telefoon eerst één keer met de auto als dat nog niet is
   gebeurd) → kies **Is verbonden** → **Volgende**.
3. Voeg de actie **Voer opdracht uit** toe en kies de opdracht **"Rit
   start"**.
4. Zet **"Voer direct uit"** aan (anders vraagt iOS elke keer om
   bevestiging) → **Gereed**.
5. Maak een tweede automatisering op dezelfde manier, maar kies deze keer
   **Is verbroken** i.p.v. "Is verbonden", en koppel de opdracht **"Rit
   stop"**.

### Alternatief: CarPlay als trigger

Heb je geen vaste Bluetooth-naam (bijvoorbeeld bij een deelauto) of gebruik
je liever CarPlay als trigger? Kies bij stap 2 in plaats van **Bluetooth**
de optie **CarPlay** → **Is verbonden** (voor "Rit start") resp. **Is
verbroken** (voor "Rit stop"). De rest van de stappen is gelijk.

## 4. Testen

- Rijd een stukje (of simuleer door Bluetooth handmatig te verbreken/
  verbinden) en controleer daarna in de Bestanden-app of `Rittenlog.txt` is
  bijgewerkt (zie stap 5).
- Werkt de automatisering niet automatisch? Controleer of "Vraag voor
  uitvoeren" in de automatisering uitstaat en of Opdrachten toegang heeft
  tot locatie op "Altijd".

## 5. Importeren in de Rittenregistratie-app

1. Open de app **Bestanden** op je iPhone.
2. Ga naar **iCloud Drive → Shortcuts** en zoek `Rittenlog.txt`.
3. Open de Rittenregistratie-app (in de browser of als geïnstalleerde PWA)
   en ga naar **Import**.
4. Kies de auto waarvoor je importeert, tik op het bestandsveld en kies
   `Rittenlog.txt` uit **Bestanden → iCloud Drive → Shortcuts**.
5. De app leest het bestand, koppelt START/STOP-events tot ritten en zet
   nieuwe ritten op status "te controleren". Je kunt hetzelfde (gegroeide)
   bestand later gewoon opnieuw importeren: al eerder verwerkte ritten
   worden niet dubbel aangemaakt.
6. Ga naar **Ritten** om de nieuwe ritten te controleren: kies per rit
   zakelijk/privé, vul een omschrijving in, en corrigeer eventueel het
   adres of de kilometerstand.

## Veelvoorkomende problemen

- **Adres is leeg**: kan gebeuren als "Details van locaties ophalen" geen
  adres kon bepalen (bv. zwak GPS-signaal). De app vult dit automatisch aan
  via reverse geocoding zodra je de ritten bekijkt/importeert.
- **Coördinaten met een komma** (bv. `52,0907` in plaats van `52.0907`):
  gebeurt door de Nederlandse landinstelling van je toestel. De app
  ondersteunt dit automatisch.
- **Datum in een ander formaat** (bv. `29-09-2026 08:12` in plaats van
  ISO 8601): ook dit wordt automatisch herkend.
- **Losse START zonder STOP** (of andersom): de app toont dit als
  waarschuwing bij het importeren. Vaak betekent dit dat de rit nog niet is
  afgerond (auto nog niet losgekoppeld) of dat een automatisering een keer
  niet is afgegaan.

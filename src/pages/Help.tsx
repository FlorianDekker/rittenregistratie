export default function Help() {
  return (
    <div className="app">
      <header className="app__header">
        <h1>Help</h1>
      </header>
      <main className="app__main">
        <div className="card help-block">
          <h2>iPhone instellen: Opdrachten (Shortcuts)</h2>
          <p className="helper">
            De app leest <code>Rittenlog.txt</code>, dat je iPhone automatisch aanvult zodra je
            verbinding maakt met (of verbreekt van) de Bluetooth/CarPlay van je auto.
          </p>
        </div>

        <div className="card help-block">
          <h3>0. Voorwaarden</h3>
          <ul>
            <li>
              Instellingen → Privacy en beveiliging → Locatievoorzieningen: aan. Zet voor de app
              Opdrachten de toegang op <strong>"Altijd"</strong> en <strong>Nauwkeurige locatie</strong>{' '}
              aan.
            </li>
            <li>iCloud Drive staat aan, zodat het bestand synchroniseert.</li>
          </ul>
        </div>

        <div className="card help-block">
          <h3>1. Opdracht "Rit start"</h3>
          <ol>
            <li>Opdrachten → Opdrachten → + → naam: "Rit start".</li>
            <li>Actie: <strong>Huidige locatie ophalen</strong>.</li>
            <li>
              Actie: <strong>Details van locaties ophalen</strong> (Breedtegraad, Lengtegraad,
              Straat/Postcode/Stad of volledig adres).
            </li>
            <li>Actie: <strong>Huidige datum</strong>.</li>
            <li>
              Actie: <strong>Datum opmaken</strong> — notatie ISO 8601 (met tijd), bijv.{' '}
              <code>2026-09-29T08:12:33+02:00</code>.
            </li>
            <li>
              Actie: <strong>Tekst</strong> —{' '}
              <code>START|[Datum]|[Breedtegraad]|[Lengtegraad]|[Adres]</code>.
            </li>
            <li>
              Actie: <strong>Voeg toe aan tekstbestand</strong> — bestand{' '}
              <code>Rittenlog.txt</code> in de Opdrachten-map in iCloud Drive, met{' '}
              <strong>"Nieuwe regel maken"</strong> aan.
            </li>
          </ol>
          <p className="helper">
            Maak opdracht <strong>"Rit stop"</strong> op dezelfde manier, maar met <code>STOP</code>{' '}
            in plaats van <code>START</code>.
          </p>
        </div>

        <div className="card help-block">
          <h3>2. Automatisering</h3>
          <ol>
            <li>Opdrachten → Automatisering → + → Bluetooth → kies de auto.</li>
            <li>"Is verbonden" → Volgende → actie "Voer opdracht uit" → "Rit start".</li>
            <li>Zet "Voer direct uit" aan → Gereed.</li>
            <li>Tweede automatisering: "Is verbroken" → opdracht "Rit stop".</li>
          </ol>
          <p className="helper">
            Alternatief: gebruik <strong>CarPlay</strong> i.p.v. Bluetooth als trigger ("Is
            verbonden"/"Is verbroken").
          </p>
        </div>

        <div className="card help-block">
          <h3>3. Importeren in de app</h3>
          <ol>
            <li>Bestanden-app → iCloud Drive → Shortcuts → <code>Rittenlog.txt</code>.</li>
            <li>In deze app: Import → kies de auto → kies het bestand.</li>
            <li>
              Nieuwe ritten krijgen status "te controleren". Hetzelfde (gegroeide) bestand kun je
              later gewoon opnieuw importeren; al verwerkte ritten worden niet dubbel aangemaakt.
            </li>
          </ol>
        </div>

        <div className="card help-block">
          <h3>Veelvoorkomende problemen</h3>
          <ul>
            <li>Adres leeg → de app vult dit automatisch aan via reverse geocoding.</li>
            <li>
              Coördinaten met een komma (bijv. <code>52,0907</code>) of een datum als{' '}
              <code>29-09-2026 08:12</code> → wordt automatisch herkend.
            </li>
            <li>
              Losse START zonder STOP (of andersom) → verschijnt als waarschuwing bij het
              importeren; vaak omdat de rit nog niet is afgerond.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

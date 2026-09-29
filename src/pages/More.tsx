import { Link } from 'react-router-dom';

const items = [
  { to: '/autos', label: "Auto's", icon: '🚙' },
  { to: '/locaties', label: 'Vaste locaties', icon: '📍' },
  { to: '/ijkpunten', label: 'IJkpunten', icon: '📏' },
  { to: '/export', label: 'Export (CSV)', icon: '📄' },
  { to: '/instellingen', label: 'Instellingen &amp; back-up', icon: '⚙️' },
  { to: '/help', label: 'Help / iPhone-instructies', icon: '❓' },
];

export default function More() {
  return (
    <div className="app">
      <header className="app__header">
        <h1>Meer</h1>
      </header>
      <main className="app__main">
        <nav className="list-links">
          {items.map((item) => (
            <Link key={item.to} to={item.to}>
              <span>
                <span aria-hidden="true">{item.icon} </span>
                {item.label.replace('&amp;', '&')}
              </span>
              <span aria-hidden="true">›</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}

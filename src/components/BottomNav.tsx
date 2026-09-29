import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Overzicht', icon: '🏠', end: true },
  { to: '/ritten', label: 'Ritten', icon: '🚗', end: false },
  { to: '/import', label: 'Import', icon: '📥', end: false },
  { to: '/meer', label: 'Meer', icon: '⋯', end: false },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Hoofdnavigatie">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `bottom-nav__item${isActive ? ' active' : ''}`}
        >
          <span className="bottom-nav__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

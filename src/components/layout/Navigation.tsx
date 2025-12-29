import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/swap', label: 'Swap' },
  { path: '/liquidity', label: 'Liquidity' },
  { path: '/positions', label: 'Positions' },
  { path: '/faucet', label: 'Faucet' },
];

export default function Navigation() {
  return (
    <nav className="flex items-center gap-1 bg-[#1a1a1a] rounded-xl p-1">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg font-medium transition-colors ${
              isActive ? 'bg-[#242424] text-white' : 'text-[#a0a0a0] hover:text-white'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

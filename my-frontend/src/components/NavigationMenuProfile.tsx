import React from "react";

interface MenuItem {
  path: string;
  icon: string;
  label: string;
}

interface NavigationMenuProps {
  menuItems: MenuItem[];
  activeTab: string;
  onTabChange: (path: string) => void;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ menuItems, activeTab, onTabChange }) => {
  return (
    <div className="nav-align-top">
      <ul className="nav nav-pills flex-column flex-md-row mb-3 flex-wrap row-gap-2">
        {menuItems.map((item) => (
          <li className="nav-item" key={item.path}>
            <button
              className={`nav-link ${activeTab === item.path ? "active" : ""}`}
              onClick={() => onTabChange(item.path)}
              aria-current={activeTab === item.path ? "page" : undefined}
            >
              <i className={`bx ${item.icon} me-2`}></i>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NavigationMenu;
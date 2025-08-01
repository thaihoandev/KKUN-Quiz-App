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
        {menuItems.map((item, index) => (
          <li className="nav-item" key={index}>
            <button
              className={`nav-link ${activeTab === item.path ? "active" : ""}`}
              onClick={() => onTabChange(item.path)}
            >
              <i className={`icon-base bx ${item.icon} icon-sm me-1_5`}></i>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NavigationMenu;
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
    <div className="w-100 d-flex justify-content-center">
      <ul className="nav nav-pills mb-3 d-flex flex-wrap justify-content-center gap-2">
        {menuItems.map((item) => (
          <li className="nav-item" key={item.path}>
            <button
              className={`nav-link px-4 py-2 rounded-pill fw-medium ${
                activeTab === item.path ? "active" : "text-secondary"
              }`}
              onClick={() => onTabChange(item.path)}
              aria-current={activeTab === item.path ? "page" : undefined}
              style={{
                minWidth: "120px",
                transition: "all 0.2s ease-in-out",
              }}
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

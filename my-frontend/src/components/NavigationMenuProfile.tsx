import React from "react";
import {useNavigate, useLocation} from "react-router-dom";

interface MenuItem {
    path: string;
    icon: string;
    label: string;
}

interface NavigationMenuProps {
    menuItems: MenuItem[];
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({menuItems}) => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="nav-align-top">
            <ul className="nav nav-pills flex-column flex-md-row mb-3 flex-wrap row-gap-2">
                {menuItems.map((item, index) => (
                    <li className="nav-item" key={index}>
                        <button
                            className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
                            onClick={() => navigate(item.path)}
                        >
                            <i
                                className={`icon-base bx ${item.icon} icon-sm me-1_5`}
                            ></i>
                            {item.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default NavigationMenu;

import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { FaBars } from "react-icons/fa";
import { AiOutlineClose } from "react-icons/ai";

import { SidebarData } from "./SidebarData";
import { IconContext } from "react-icons/lib";

const Navbar = (): JSX.Element => {
  const [sidebar, setSidebar] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  useEffect(() => setSidebar(false), [location.pathname]);
  useEffect(() => {
    if (sidebar) closeButtonRef.current?.focus();
  }, [sidebar]);

  const closeSidebar = (): void => {
    setSidebar(false);
    openButtonRef.current?.focus();
  };

  return (
    <div>
      <IconContext.Provider value={{ color: "white" }}>
        <div className="navbar">
          <button
            type="button"
            className="menu-bars"
            aria-label="Open navigation"
            aria-expanded={sidebar}
            aria-controls="navigation-menu"
            ref={openButtonRef}
            onClick={() => setSidebar(true)}
          >
            <FaBars />
          </button>
        </div>
        <nav
          id="navigation-menu"
          aria-label="Main navigation"
          aria-hidden={!sidebar}
          className={sidebar ? "nav-menu active" : "nav-menu"}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeSidebar();
            }
          }}
        >
          <ul className="nav-menu-items">
            <li className="navbar-toggle">
              <button
                type="button"
                className="menu-bars"
                aria-label="Close navigation"
                tabIndex={sidebar ? 0 : -1}
                ref={closeButtonRef}
                onClick={closeSidebar}
              >
                <AiOutlineClose />
              </button>
            </li>
            {SidebarData.map((item) => (
              <li key={item.path} className={item.cName}>
                <Link
                  to={item.path}
                  tabIndex={sidebar ? 0 : -1}
                  onClick={closeSidebar}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </IconContext.Provider>
    </div>
  );
};

export default Navbar;

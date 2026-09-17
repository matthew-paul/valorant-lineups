import React from "react";

import { AiOutlineInfoCircle } from "react-icons/ai";
import { IoMapOutline } from "react-icons/io5";

export interface SidebarItem {
  title: string;
  path: string;
  icon: React.ReactElement;
  cName: string;
}

export const SidebarData: SidebarItem[] = [
  {
    title: "Lineups",
    path: "/",
    icon: <IoMapOutline />,
    cName: "nav-text",
  },
  {
    title: "Info",
    path: "/about",
    icon: <AiOutlineInfoCircle />,
    cName: "nav-text",
  },
];

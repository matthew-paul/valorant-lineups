import React from "react";

import { AiOutlineInfoCircle } from "react-icons/ai";
import { IoMapOutline } from "react-icons/io5";

export const SidebarData = [
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
  /*{
        title: 'Send Lineups',
        path: '/send',
        icon: <AiIcons.AiOutlineSend />,
        cName: 'nav-text'
    }*/
];

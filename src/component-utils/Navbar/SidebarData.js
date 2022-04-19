import React from "react";

import * as AiIcons from "react-icons/ai";
import * as IoIcons from "react-icons/io5";

export const SidebarData = [
  {
    title: "View Lineups",
    path: "/",
    icon: <IoIcons.IoMapOutline />,
    cName: "nav-text",
  },
  {
    title: "Info",
    path: "/about",
    icon: <AiIcons.AiOutlineInfoCircle />,
    cName: "nav-text",
  },
  /*{
        title: 'Send Lineups',
        path: '/send',
        icon: <AiIcons.AiOutlineSend />,
        cName: 'nav-text'
    }*/
];

import React from "react";

import * as AiIcons from "react-icons/ai";
import * as IoIcons from "react-icons/io5";

export const SidebarData = [
  {
    title: "Home",
    path: "/",
    icon: <AiIcons.AiFillHome />,
    cName: "nav-text",
  },
  {
    title: "View Lineups",
    path: "/abilities",
    icon: <IoIcons.IoMapOutline />,
    cName: "nav-text",
  },
  /*{
        title: 'Send Lineups',
        path: '/send',
        icon: <AiIcons.AiOutlineSend />,
        cName: 'nav-text'
    }*/
];

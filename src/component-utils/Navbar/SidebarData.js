import React from 'react'

import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as IoIcons from 'react-icons/io5';

export const SidebarData = [
    {
        title: 'Home',
        path: '/',
        icon: <AiIcons.AiFillHome />,
        cName: 'nav-text'
    },
    {
        title: 'View Lineups',
        path: '/lineups',
        icon: <IoIcons.IoMapOutline />,
        cName: 'nav-text'
    },
    {
        title: 'Send Lineups',
        path: '/send',
        icon: <AiIcons.AiOutlineSend />,
        cName: 'nav-text'
    }
]
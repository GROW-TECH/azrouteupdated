// D:\azrouteadmin-master\routes\DashboardRoutes.js
import { v4 as uuid } from 'uuid';
import { FaCalendarCheck, FaSchool } from 'react-icons/fa';
import {
  FaHome,
  FaUsers,
  FaCreditCard,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaFileAlt,
  FaUserCircle,
  FaSignOutAlt
} from 'react-icons/fa';

// --- unchanged DashboardMenu export (keeps shape you requested) ---
export const DashboardMenu = [
  {
    id: uuid(),
    title: 'Dashboard',
    icon: <FaHome />,
    link: '/dashboard'
  },
  {
    id: uuid(),
    title: 'Add Branch',
    icon: <FaHome />,
    link: '/branch'
  },
  {
    id: uuid(),
    title: 'Student List',
    icon: <FaUsers />,
    link: '/student-list'
  },
  {
    id: uuid(),
    title: 'Coach List',
    icon: <FaChalkboardTeacher />,
    link: '/coach-list'
  },
  {
    id: uuid(),
    title: 'Course Register',
    icon: <FaSchool/> ,
    link: '/course-students'
  },
  {
    id: uuid(),
    title: 'Add Course',
    icon: <FaSchool/> ,
    link: '/courses'
  },
  {
    id: uuid(),
    title: 'Add Course  Video',
    icon: <FaSchool/> ,
    link: '/courses-video'
  },
  {
    id: uuid(),
    title: 'Payment',
    icon: <FaCreditCard />,
    link: '/payment'
  },
  {
    id: uuid(),
    title: 'Attendance',
    icon: <FaCalendarCheck />,
    link: '/attendance'
  },
  {
    id: uuid(),
    title: 'Marks',
    icon: <FaUserGraduate/>,
    link: '/marks'
  },
  {
    id: uuid(),
    title: 'Events',
    icon: <FaCalendarAlt />,
    link: '/events'
  },
  {
    id: uuid(),
    title: 'Scheduled Classes',
    icon: <FaUserGraduate />,
    link: '/class-list'
  },
  {
    id: uuid(),
    title: 'Demo Class',
    icon: <FaChalkboardTeacher />,
    link: '/demo-class'
  },
  {
    id: uuid(),
    title: 'Assessments',
    icon: <FaFileAlt />,
    link: '/assessments'
  },
  {
    id: uuid(),
    title: 'Profile',
    icon: <FaUserCircle />,
    link: '/profile'
  },
  {
    id: uuid(),
    title: 'Logout',
    icon: <FaSignOutAlt />,
    link: '/logout'
  }
];

// --- helper for filtering (exported so your sidebar renderer can use it) ---
const itemsToHideForRestricted = new Set(['Add Branch', 'Attendance']);


export function filterMenuForUser(userId) {
  const restrictedIds = [
    '415ed8d0-547d-4c84-8f82-495e59dc834a'
  ];

  if (!userId) return DashboardMenu;
  if (restrictedIds.includes(userId)) {
    return DashboardMenu.filter(item => !itemsToHideForRestricted.has(item.title));
  }
  return DashboardMenu;
}

export default DashboardMenu; // keep default export (unchanged)

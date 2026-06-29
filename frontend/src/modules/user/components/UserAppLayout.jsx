import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNavbar from './BottomNavbar';

const UserAppLayout = () => {
  const location = useLocation();

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      {/* Route Outlet wrapped in page transitions */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full min-h-screen flex flex-col flex-1"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>

      {/* Fixed bottom navigation */}
      <BottomNavbar />
    </div>
  );
};

export default UserAppLayout;

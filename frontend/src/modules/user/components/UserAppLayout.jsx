import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavbar from './BottomNavbar';

const UserAppLayout = () => {
  return (
    <div className="relative min-h-screen">
      {/* Route Outlet */}
      <Outlet />
      
      {/* Fixed bottom navigation */}
      <BottomNavbar />
    </div>
  );
};

export default UserAppLayout;

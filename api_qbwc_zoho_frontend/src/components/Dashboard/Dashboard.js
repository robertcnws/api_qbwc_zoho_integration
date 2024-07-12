import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Swal from 'sweetalert2';
import Sidebar from '../Sidebar/Sidebar';


const Dashboard = () => {
  const [expanded, setExpanded] = React.useState(false);

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = '/logout/';
      }
    });
  };

  const toggleSubmenu = () => {
    setExpanded(!expanded);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#f4f4f4' }}>
      <Sidebar expanded={expanded} toggleSubmenu={toggleSubmenu} handleLogout={handleLogout} />
      <Box sx={{ flexGrow: 1, p: 2, marginLeft: '13%', padding: 2, width: '100%' }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Dashboard;

import React from 'react';
import { Outlet , useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Swal from 'sweetalert2';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import axios from 'axios';
import { useAuth } from '../AuthContext/AuthContext'

const apiUrl = process.env.REACT_APP_BACKEND_URL


const Dashboard = () => {
  const [expanded, setExpanded] = React.useState(false);
  const { logout } = useAuth()
  const navigate = useNavigate()

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
        axios.get(`${apiUrl}/logout/`)
            .then(response => {
                logout()
                navigate('/integration') 
            })
            .catch(error => {
                console.error('Error loging out:', error);
            })
      }
    });
  };

  const toggleSubmenu = () => {
    setExpanded(!expanded);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#f4f4f4' }}>
      <Sidebar expanded={expanded} toggleSubmenu={toggleSubmenu} handleLogout={handleLogout} />
      <Box sx={{ flexDirection: 'column', flexGrow: 1, width: '100%' }}>
        <Topbar handleLogout={handleLogout} />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Dashboard;

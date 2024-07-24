import React from 'react';
import { Outlet , useNavigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import Swal from 'sweetalert2';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import { useAuth } from '../AuthContext/AuthContext'
import { fetchWithToken } from '../../utils'

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;


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
        const fetchData = async () => {
          try {
              await fetchWithToken(`${apiUrl}/logout/`, 'GET', null, {}, apiUrl);
              logout()
              navigate('/integration') 
          } catch (error) {
              console.error('Error loging out:', error);
          }
        };
        fetchData();
      }
    });
  };

  const toggleSubmenu = () => {
    setExpanded(!expanded);
  };

  return (
    <Container 
      maxWidth={false}
      disableGutters
      sx={{ 
        display: 'flex', 
        minHeight: '100vh', 
        minWidth: '100vw',
        backgroundColor: '#f4f4f4' 
      }}
    >
      <Sidebar 
        expanded={expanded} 
        toggleSubmenu={toggleSubmenu} 
        handleLogout={handleLogout} 
      />
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flexGrow: 1, 
          width: '100%' 
        }}
      >
        <Topbar handleLogout={handleLogout} />
        <Box 
          sx={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            p: 3,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;

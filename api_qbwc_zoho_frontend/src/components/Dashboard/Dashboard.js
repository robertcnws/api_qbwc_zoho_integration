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

  const handleDoBackup = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Want to do this DB BackUp?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Do backUp!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const fetchData = async () => {
          try {
              const url = `${apiUrl}/do_backup_db/`
              const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
              if (response.status === 200) {
                Swal.fire({
                  title: 'Success!',
                  text: 'DB Backup was successful!',
                  icon: 'success'
                })
              } else {
                Swal.fire({
                  title: 'Error!',
                  text: 'DB Backup failed!',
                  icon: 'error'
                })
              }
          } catch (error) {
              console.error('Error doing Backup:', error);
              Swal.fire({
                title: 'Error!',
                text: `Error doing Backup: ${error}`,
                icon: 'error'
              })
          } 
      };
      fetchData();
      }
    });
  }

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
        handleDoBackup={handleDoBackup}
      />
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flexGrow: 1, 
          width: '100%' 
        }}
      >
        <Topbar handleLogout={handleLogout} handleDoBackup={handleDoBackup}/>
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

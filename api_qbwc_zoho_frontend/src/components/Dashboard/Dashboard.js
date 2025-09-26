import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Swal from 'sweetalert2';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import { useAuth } from '../AuthContext/AuthContext';
import { fetchWithToken } from '../../utils';
import Footer from '../Footer/Footer';
// import './Dashboard.css'; // Ojo: si aquí hay estilos de tamaño/posicionamiento, coméntalo o límpialo.

const apiUrl =
  process.env.REACT_APP_ENVIRONMENT === 'DEV'
    ? process.env.REACT_APP_BACKEND_URL_DEV
    : process.env.REACT_APP_BACKEND_URL_PROD;

// Mantén este ancho consistente con el Sidebar
const SIDEBAR_WIDTH = 240;

const Dashboard = () => {
  const [expanded, setExpanded] = React.useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleDoBackup = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Want to do this DB BackUp?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Do backUp!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        (async () => {
          try {
            const url = `${apiUrl}/do_backup_db/`;
            const data = { username: localStorage.getItem('username') };
            const response = await fetchWithToken(url, 'GET', data, {}, apiUrl);
            if (response.status === 200) {
              Swal.fire({
                title: 'Success!',
                text: 'DB Backup was successful!',
                icon: 'success',
                willClose: () => navigate('/integration/download_backup_db'),
              });
            } else {
              Swal.fire({
                title: 'Error!',
                text: 'DB Backup failed!',
                icon: 'error',
                willClose: () => navigate('/integration'),
              });
            }
          } catch (error) {
            console.error('Error doing Backup:', error);
            Swal.fire({
              title: 'Error!',
              text: `Error doing Backup: ${error}`,
              icon: 'error',
              willClose: () => navigate('/integration'),
            });
          }
        })();
      }
    });
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        (async () => {
          try {
            const data = { username: localStorage.getItem('username') };
            await fetchWithToken(`${apiUrl}/logout/`, 'GET', data, {}, apiUrl);
            logout();
            navigate('/integration');
          } catch (error) {
            console.error('Error loging out:', error);
          }
        })();
      }
    });
  };

  const toggleSubmenu = () => setExpanded((v) => !v);

  return (
    <>
      <Sidebar
        width={SIDEBAR_WIDTH}
        expanded={expanded}
        toggleSubmenu={toggleSubmenu}
        handleLogout={handleLogout}
        handleDoBackup={handleDoBackup}
      />

      {/* Contenedor principal desplazado a la derecha del sidebar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          pl: `${SIDEBAR_WIDTH}px`,
          bgcolor: 'background.default',
          width: 'calc(100% - ' + SIDEBAR_WIDTH + 'px)',
        }}
      >
        {/* Topbar sticky alineado a la derecha del sidebar */}
        <Box
          sx={{
            position: 'sticky',
            top: 0, // no 10
            zIndex: (t) => t.zIndex.appBar,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Topbar handleLogout={handleLogout} handleDoBackup={handleDoBackup} />
        </Box>

        {/* Contenido scrollable */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            overflow: 'auto',
            p: { xs: 1.5, md: 2 },
            mr: 3
          }}
        >
          <Outlet />
        </Box>

      </Box>

      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          width: '100%',
        }}
      >
        <Footer />
      </Box>

    </>
  );
};

export default Dashboard;

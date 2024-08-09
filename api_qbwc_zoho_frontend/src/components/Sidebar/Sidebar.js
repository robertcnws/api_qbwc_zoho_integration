import React from 'react';
import { Container, Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Dashboard, People, Receipt, RocketLaunch, Settings, ExpandMore, ExpandLess, Download } from '@mui/icons-material';
import BackupIcon from '@mui/icons-material/Backup';
import InventoryIcon from '@mui/icons-material/Inventory';
import AppsIcon from '@mui/icons-material/Apps';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ expanded, toggleSubmenu, handleLogout, handleDoBackup }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => {
    if (currentPath === path) return true;
    if (currentPath.startsWith(`${path}/`)) {
      return (path.includes('qbwc')) ? true : false;  
    }
    else if (currentPath.includes('item_details')) {
      if (path.includes('list_items')) return true;
    }
    else if (currentPath.includes('invoice_details')) {
      if (path.includes('list_invoices')) return true;
    }
    else if (currentPath.includes('customer_details')) {
      if (path.includes('list_customers')) return true;
    }
    return false;
  };

  

  return (
    
    <Container maxWidth="md" sx={{
      position: 'fixed',
      width: 240,
      backgroundColor: '#21263c',
      color: '#fff',
      top: 0,
      left: 0,
      paddingTop: 1,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1,
    }}>
      <Box sx={{ padding: 0, textAlign: 'center' }}>
        {/* <Typography variant="h5">Zoho - QBWC</Typography> */}
        <img
          src="/logo_qbwc_zoho_mini.png"
          alt="Login Logo"
          style={{ maxWidth: '100%', height: 'auto', marginTop: '-5px', borderRadius: '3px', }} 
        />
      </Box>
      <List>
        <ListItemButton component={Link} to="/integration" 
        sx={{ 
          backgroundColor: isActive('/integration') ? '#00796b' : 'inherit', 
          borderRadius: isActive('/integration') ? 3 : 0,
        }}
        >
          <ListItemIcon><Dashboard sx={{ color: '#fff', maxWidth: '20px', maxHeight: '20px', minHeight: '20px' }} /></ListItemIcon>
          <ListItemText primary="Dashboard" 
                        sx={{
                          '& .MuiListItemText-primary': { 
                              fontSize: '13px', 
                              fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                          },
                          marginLeft: '-30px',
                      }}
          />
        </ListItemButton>
        <ListItemButton component={Link} to="/integration/list_customers" 
        sx={{ backgroundColor: isActive('/integration/list_customers') ? '#00796b' : 'inherit', borderRadius: isActive('/integration/list_customers') ? 3 : 0 }}>
          <ListItemIcon><People sx={{ color: '#fff', maxWidth: '20px', maxHeight: '20px', minHeight: '20px' }} /></ListItemIcon>
          <ListItemText primary="Customers" sx={{
                          '& .MuiListItemText-primary': { 
                              fontSize: '13px', 
                              fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                          },
                          marginLeft: '-30px',
                      }}
          />
        </ListItemButton>
        <ListItemButton component={Link} to="/integration/list_items" 
        sx={{ backgroundColor: isActive('/integration/list_items') ? '#00796b' : 'inherit', borderRadius: isActive('/integration/list_items') ? 3 : 0 }}>
          <ListItemIcon><InventoryIcon sx={{ color: '#fff', maxWidth: '20px', maxHeight: '20px', minHeight: '20px' }} /></ListItemIcon>
          <ListItemText primary="Items" sx={{
                          '& .MuiListItemText-primary': { 
                              fontSize: '13px', 
                              fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                          },
                          marginLeft: '-30px',
                      }}
          />
        </ListItemButton>
        <ListItemButton component={Link} to="/integration/list_invoices" 
        sx={{ backgroundColor: isActive('/integration/list_invoices') ? '#00796b' : 'inherit', borderRadius: isActive('/integration/list_invoices') ? 3 : 0 }}>
          <ListItemIcon><Receipt sx={{ color: '#fff', maxWidth: '20px', maxHeight: '20px', minHeight: '20px' }} /></ListItemIcon>
          <ListItemText primary="Invoices" sx={{
                          '& .MuiListItemText-primary': { 
                              fontSize: '13px', 
                              fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                          },
                          marginLeft: '-30px',
                      }}
          />
        </ListItemButton>
        <ListItemButton onClick={toggleSubmenu} 
        sx={{ backgroundColor: isActive('/integration/zoho') || isActive('/integration/qbwc') || isActive('/integration/application_settings') ? '#00796b' : 'inherit', 
              borderRadius: isActive('/integration/zoho') || isActive('/integration/qbwc') || isActive('/integration/application_settings') ? 3 : 0 }}>
          <ListItemIcon><RocketLaunch sx={{ color: '#fff', maxWidth: '20px', maxHeight: '20px', minHeight: '20px' }} /></ListItemIcon>
          <ListItemText primary="Integration" sx={{
                          '& .MuiListItemText-primary': { 
                              fontSize: '13px', 
                              fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                          },
                          marginLeft: '-30px',
                      }}
          />
          {expanded ? <ExpandLess sx={{ color: '#fff', maxWidth: '20px', maxHeight: '20px', minHeight: '20px' }} /> : 
                      <ExpandMore sx={{ color: '#fff', maxWidth: '20px', maxHeight: '20px', minHeight: '20px' }} />}
        </ListItemButton>
        {expanded && (
          <>
            <Divider />
            <List sx={{ pl: 4 }}>
              <ListItemButton component={Link} to="/integration/zoho" 
              sx={{ 
                backgroundColor: isActive('/integration/zoho') ? '#00796b' : 'inherit', 
                borderRadius: isActive('/integration/zoho') ? 3 : 0,
                marginLeft: '-33px',
                }}>
                {/* <ListItemIcon><AppsIcon sx={{ color: '#fff', maxWidth: '20px', maxHeight: '20px', minHeight: '20px' }} /></ListItemIcon> */}
                <ListItemText primary="Zoho" sx={{
                          '& .MuiListItemText-primary': { 
                              fontSize: '13px', 
                              fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                          },
                          marginLeft: '27px',
                      }}
                />
              </ListItemButton>
              <ListItemButton component={Link} to="/integration/qbwc" 
              sx={{ 
                backgroundColor: isActive('/integration/qbwc') ? '#00796b' : 'inherit', 
                borderRadius: isActive('/integration/qbwc') ? 3 : 0,
                marginLeft: '-33px', 
                }}>
                {/* <ListItemIcon><AccountBalanceWalletIcon sx={{ color: '#fff', maxWidth: '20px', maxHeight: '20px', minHeight: '20px' }} /></ListItemIcon> */}
                <ListItemText primary="Quickbooks" sx={{
                          '& .MuiListItemText-primary': { 
                              fontSize: '13px', 
                              fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                          },
                          marginLeft: '27px',
                      }}
                />
              </ListItemButton>
              <ListItemButton component={Link} to="/integration/application_settings" 
              sx={{ 
                backgroundColor: isActive('/integration/application_settings') ? '#00796b' : 'inherit', 
                borderRadius: isActive('/integration/application_settings') ? 3 : 0,
                marginLeft: '-33px',  
                }}>
                {/* <ListItemIcon><Settings sx={{ color: '#fff', maxWidth: '20px', maxHeight: '20px', minHeight: '20px' }} /></ListItemIcon> */}
                <ListItemText primary="Settings" sx={{
                          '& .MuiListItemText-primary': { 
                              fontSize: '13px', 
                              fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                          },
                          marginLeft: '27px',
                      }}
                />
              </ListItemButton>
            </List>
          </>
        )}
        <ListItemButton onClick={handleDoBackup}>
          <ListItemIcon><BackupIcon sx={{ color: '#fff', maxWidth: '20px', maxHeight: '20px', minHeight: '20px' }} /></ListItemIcon>
          <ListItemText primary="Do BackUp" sx={{
                          '& .MuiListItemText-primary': { 
                              fontSize: '13px', 
                              fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                          },
                          marginLeft: '-30px',
                      }}
                      
          />
        </ListItemButton>
        <ListItemButton component={Link} to="/integration/download_backup_db" 
        sx={{ backgroundColor: isActive('/integration/download_backup_db') ? '#00796b' : 'inherit', borderRadius: isActive('/integration/download_backup_db') ? 3 : 0 }}>
          <ListItemIcon><Download sx={{ color: '#fff', maxWidth: '20px', maxHeight: '20px', minHeight: '20px' }}/></ListItemIcon>
          <ListItemText primary="BackUps" sx={{
                          '& .MuiListItemText-primary': { 
                              fontSize: '13px', 
                              fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                          },
                          marginLeft: '-30px',
                      }}
          />
        </ListItemButton>
        {localStorage.getItem('isStaff') === 'admin' &&
          <ListItemButton component={Link} to="/integration/list_users" 
          sx={{ 
            backgroundColor: isActive('/integration/list_users') || isActive('/integration/view_user') ? '#00796b' : 'inherit', 
            borderRadius: isActive('/integration/list_users') || isActive('/integration/view_user') ? 3 : 0  }}>
            <ListItemIcon><AccountCircle sx={{ color: '#fff', maxWidth: '20px', maxHeight: '20px', minHeight: '20px' }}/></ListItemIcon>
            <ListItemText primary="Users" sx={{
                          '& .MuiListItemText-primary': { 
                              fontSize: '13px', 
                              fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                          },
                          marginLeft: '-30px',
                      }}
            />
          </ListItemButton>
        }
      </List>
    </Container>
  );
};

export default Sidebar;

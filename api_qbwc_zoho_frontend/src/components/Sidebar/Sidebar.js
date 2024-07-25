import React from 'react';
import { Container, Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Dashboard, People, Receipt, RocketLaunch, Settings, ExpandMore, ExpandLess } from '@mui/icons-material';
import BackupIcon from '@mui/icons-material/Backup';
import InventoryIcon from '@mui/icons-material/Inventory';
import AppsIcon from '@mui/icons-material/Apps';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ expanded, toggleSubmenu, handleLogout, handleDoBackup }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => {
    if (currentPath === path) return true;
    if (currentPath.startsWith(`${path}/`)) {
      return (path.includes('qbwc')) ? true : false;  
    }
    return false;
  };

  

  return (
    <Container maxWidth="lg" sx={{
      width: 250,
      backgroundColor: '#3a3f51',
      color: '#fff',
      top: 0,
      left: 0,
      paddingTop: 2,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Box sx={{ padding: 1, textAlign: 'center', backgroundColor: '#2c2f3d' }}>
        <Typography variant="h5">Zoho - QBWC</Typography>
      </Box>
      <List>
        <ListItemButton component={Link} to="/integration" sx={{ backgroundColor: isActive('/integration') ? '#2c2f3f' : 'inherit' }}>
          <ListItemIcon><Dashboard sx={{ color: '#fff' }} /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        <ListItemButton component={Link} to="/integration/list_customers" sx={{ backgroundColor: isActive('/integration/list_customers') ? '#2c2f3d' : 'inherit' }}>
          <ListItemIcon><People sx={{ color: '#fff' }} /></ListItemIcon>
          <ListItemText primary="Customers" />
        </ListItemButton>
        <ListItemButton component={Link} to="/integration/list_items" sx={{ backgroundColor: isActive('/integration/list_items') ? '#2c2f3d' : 'inherit' }}>
          <ListItemIcon><InventoryIcon sx={{ color: '#fff' }} /></ListItemIcon>
          <ListItemText primary="Items" />
        </ListItemButton>
        <ListItemButton component={Link} to="/integration/list_invoices" sx={{ backgroundColor: isActive('/integration/list_invoices') ? '#2c2f3d' : 'inherit' }}>
          <ListItemIcon><Receipt sx={{ color: '#fff' }} /></ListItemIcon>
          <ListItemText primary="Invoices" />
        </ListItemButton>
        <ListItemButton onClick={toggleSubmenu} sx={{ backgroundColor: isActive('/integration/zoho') || isActive('/integration/qbwc') || isActive('/integration/application_settings') ? '#2c2f3d' : 'inherit' }}>
          <ListItemIcon><RocketLaunch sx={{ color: '#fff' }} /></ListItemIcon>
          <ListItemText primary="Integration" />
          {expanded ? <ExpandLess sx={{ color: '#fff' }} /> : <ExpandMore sx={{ color: '#fff' }} />}
        </ListItemButton>
        {expanded && (
          <>
            <Divider />
            <List sx={{ pl: 4 }}>
              <ListItemButton component={Link} to="/integration/zoho" sx={{ backgroundColor: isActive('/integration/zoho') ? '#2c2f3d' : 'inherit' }}>
                <ListItemIcon><AppsIcon sx={{ color: '#fff' }} /></ListItemIcon>
                <ListItemText primary="Zoho" />
              </ListItemButton>
              <ListItemButton component={Link} to="/integration/qbwc" sx={{ backgroundColor: isActive('/integration/qbwc') ? '#2c2f3d' : 'inherit' }}>
                <ListItemIcon><AccountBalanceWalletIcon sx={{ color: '#fff' }} /></ListItemIcon>
                <ListItemText primary="Quickbooks" />
              </ListItemButton>
              <ListItemButton component={Link} to="/integration/application_settings" sx={{ backgroundColor: isActive('/integration/application_settings') ? '#2c2f3d' : 'inherit' }}>
                <ListItemIcon><Settings sx={{ color: '#fff' }} /></ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItemButton>
            </List>
          </>
        )}
        <ListItemButton onClick={handleDoBackup}>
          <ListItemIcon><BackupIcon sx={{ color: '#fff' }} /></ListItemIcon>
          <ListItemText primary="Backup DB" />
        </ListItemButton>
      </List>
    </Container>
  );
};

export default Sidebar;

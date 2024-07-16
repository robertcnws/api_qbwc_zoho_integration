import React from 'react';
import { Container, Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Dashboard, People, Receipt, RocketLaunch, Settings, ExpandMore, ExpandLess } from '@mui/icons-material';
import InventoryIcon from '@mui/icons-material/Inventory';
import AppsIcon from '@mui/icons-material/Apps';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { Link } from 'react-router-dom';

// Corrección de importaciones y nombres de íconos
const Sidebar = ({ expanded, toggleSubmenu, handleLogout }) => {
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
        <ListItemButton component={Link} to="/integration">
          <ListItemIcon><Dashboard sx={{ color: '#fff' }} /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        <ListItemButton component={Link} to="/integration/list_customers">
          <ListItemIcon><People sx={{ color: '#fff' }} /></ListItemIcon>
          <ListItemText primary="Customers" />
        </ListItemButton>
        <ListItemButton component={Link} to="/integration/list_items">
          <ListItemIcon><InventoryIcon sx={{ color: '#fff' }} /></ListItemIcon>
          <ListItemText primary="Items" />
        </ListItemButton>
        <ListItemButton component={Link} to="/integration/list_invoices">
          <ListItemIcon><Receipt sx={{ color: '#fff' }} /></ListItemIcon>
          <ListItemText primary="Invoices" />
        </ListItemButton>
        <ListItemButton onClick={toggleSubmenu}>
          <ListItemIcon><RocketLaunch sx={{ color: '#fff' }} /></ListItemIcon>
          <ListItemText primary="Integration" />
          {expanded ? <ExpandLess sx={{ color: '#fff' }} /> : <ExpandMore sx={{ color: '#fff' }} />}
        </ListItemButton>
        {expanded && (
          <>
            <Divider />
            <List>
              <ListItemButton component={Link} to="/integration/zoho">
                <ListItemIcon><AppsIcon sx={{ color: '#fff' }} /></ListItemIcon>
                <ListItemText primary="Zoho" />
              </ListItemButton>
              <ListItemButton component={Link} to="/integration/qbwc">
                <ListItemIcon><AccountBalanceWalletIcon sx={{ color: '#fff' }} /></ListItemIcon>
                <ListItemText primary="Quickbooks" />
              </ListItemButton>
              <ListItemButton component={Link} to="/integration/application_settings">
                <ListItemIcon><Settings sx={{ color: '#fff' }} /></ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItemButton>
            </List>
          </>
        )}
      </List>
    </Container>
  );
};

export default Sidebar;

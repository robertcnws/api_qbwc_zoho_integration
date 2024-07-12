import React from 'react';
import { Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, Divider, Button } from '@mui/material';
import { Dashboard, People, Receipt, RocketLaunch, Settings, ExpandMore, ExpandLess, Logout } from '@mui/icons-material';
import { Link } from 'react-router-dom';

// Corrección de importaciones y nombres de íconos
const Sidebar = ({ expanded, toggleSubmenu, handleLogout }) => {
  return (
    <Box sx={{
      width: 250,
      backgroundColor: '#3a3f51',
      color: '#fff',
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100%',
      paddingTop: 2
    }}>
      <Box sx={{ padding: 2, textAlign: 'center', backgroundColor: '#2c2f3d' }}>
        <Typography variant="h5">Mi App</Typography>
      </Box>
      <List>
        <ListItemButton component={Link} to="/integration">
          <ListItemIcon><Dashboard sx={{ color: '#fff' }} /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        <ListItemButton component={Link} to="/integration/customers">
          <ListItemIcon><People sx={{ color: '#fff' }} /></ListItemIcon>
          <ListItemText primary="Customers" />
        </ListItemButton>
        <ListItemButton component={Link} to="/integration/items">
          <ListItemIcon><Box sx={{ color: '#fff' }} /></ListItemIcon>
          <ListItemText primary="Items" />
        </ListItemButton>
        <ListItemButton component={Link} to="/integration/invoices">
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
                <ListItemIcon><Box sx={{ color: '#fff' }} /></ListItemIcon>
                <ListItemText primary="Zoho" />
              </ListItemButton>
              <ListItemButton component={Link} to="/integration/quickbooks">
                <ListItemIcon><Box sx={{ color: '#fff' }} /></ListItemIcon>
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
      <Box sx={{ position: 'absolute', bottom: 20, left: 20 }}>
        <Button
          variant="contained"
          color="warning"
          startIcon={<Logout />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;

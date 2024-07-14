import React from 'react';
import { Toolbar, Button, IconButton } from '@mui/material';
import { Link } from 'react-router-dom';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const Topbar = ({ handleLogout }) => {

    return (
              <Toolbar sx={{ bgcolor: '#e0e0e0', position:'relative', justifyContent: 'flex-end' }}>
                  <Button component={Link} to="/integration/application_settings" color="inherit">
                      Settings
                  </Button>
                  <IconButton onClick={handleLogout} color="inherit">
                      <ExitToAppIcon />
                  </IconButton>
              </Toolbar>
  );
};

export default Topbar;

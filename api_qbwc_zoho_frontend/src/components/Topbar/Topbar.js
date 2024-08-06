import React from 'react';
import { Toolbar, Button, IconButton, TextField, Box } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const Topbar = ({ handleLogout }) => {

    return (
        <Toolbar sx={{ bgcolor: '#f7f7fe', position: 'relative', border: '1px solid #ccc' }}>
            <Box sx={{ flexGrow: 1 }}>
                <TextField
                    label="Search"
                    variant="outlined"
                    size="small"
                    sx={{ width: '20%' }}
                />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button color="inherit">
                    User: <b>{localStorage.getItem('username')}</b>
                </Button>
                <IconButton onClick={handleLogout} color="inherit">
                    <ExitToAppIcon />
                </IconButton>
            </Box>
        </Toolbar>
  );
};

export default Topbar;

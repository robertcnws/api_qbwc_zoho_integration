import { Alert } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import React from 'react';

export const AlertError = ({ isSmallScreen, error, redirect }) => {

    const handleClose = () => {
        if (redirect) {
            redirect();
        }
    };

    return (
        <>
            <Alert 
            severity="error" 
            xs={12} 
            sx={{
                mt: 3,
                p: 1,
                marginLeft: isSmallScreen ? '0' : '-19%',
                transition: 'margin-left 0.3s ease',
                minWidth: '83.5vw',
            }}
            action={
                redirect ? (
                    <IconButton
                        aria-label="close"
                        color="inherit"
                        size="small"
                        onClick={handleClose}
                        sx={{ paddingRight: '15px' }}
                    >
                        <CloseIcon fontSize="inherit" />
                    </IconButton>
                ) : null
            }
            >
                {error}
            </Alert>
        </>
    )
}

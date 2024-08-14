import { Alert } from '@mui/material';
import React from 'react';


export const AlertLoading = ({ isSmallScreen, message }) => {
    return <Alert severity="info" xs={12} sx={{
        mt: 3,
        p: 1,
        marginLeft: isSmallScreen ? '0' : '-19%',
        transition: 'margin-left 0.3s ease',
        minWidth: '83.5vw',
    }}>
        <b>Loading {message ? `(${message})` : ''}...</b>
    </Alert>;
}

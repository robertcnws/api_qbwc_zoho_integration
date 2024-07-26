import { Alert } from '@mui/material';
import React from 'react';


export const AlertLoading = ( {isSmallScreen, message} ) => {
  return <Alert severity="info" xs={12} sx={{
              mt: 5,
              p: 2,
              marginLeft: isSmallScreen ? '0' : '3%',
              transition: 'margin-left 0.3s ease', 
          }}>
              Loading {message ? `(${message})`: ''}...
          </Alert>;
}

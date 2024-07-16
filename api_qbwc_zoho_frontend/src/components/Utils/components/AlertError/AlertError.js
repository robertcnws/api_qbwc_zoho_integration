import { Alert } from '@mui/material';
import React from 'react';

export const AlertError = ({isSmallScreen, error}) => {
  return <Alert severity="error" xs={12} sx={{
              mt: 5,
              p: 2,
              marginLeft: isSmallScreen ? '0' : '3%',
              transition: 'margin-left 0.3s ease', 
          }}>
              {error}
          </Alert>
}

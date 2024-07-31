import React from 'react';
import { Alert, AlertTitle } from '@mui/material';

const SmallAlert = ({ severity, title, message }) => {
  return (
    <Alert
      severity={severity}
      sx={{
        fontSize: '0.75rem', // Tamaño de la fuente pequeño
        padding: '4px 4px 4px 4px',  // Espaciado reducido
      }}
    >
      {title && <AlertTitle sx={{ fontSize: '0.85rem' }}>{title}</AlertTitle>}
      <b>{message}</b>
    </Alert>
  );
};

export default SmallAlert;

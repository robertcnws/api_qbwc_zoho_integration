import React, { useEffect, useState } from 'react';
import { Grid, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Link } from 'react-router-dom';

const NavigationRightButton = ({ children }) => {

  const [anchorEl, setAnchorEl] = useState(null);
  const [border, setBorder] = useState('');
  const [borderRight, setBorderRight] = useState('');
  const [borderRadius, setBorderRadius] = useState('');

  useEffect(() => {
    if (children[0].noBorder) {
      setBorder('none');
      setBorderRight('1px solid #ddd');
      setBorderRadius('0px 0px 0px 0px');
    }
    else {
      setBorder('1px solid #ddd');
      setBorderRight('1px solid #ddd');
      setBorderRadius('5px 5px 5px 5px');
    }
  }, [border]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (onClick) => {
    if (onClick) {
      if (typeof onClick === 'function') {
        onClick();
      }
    }
    setAnchorEl(null);
  };

  return (
    <Grid item>
      <IconButton onClick={handleClick}
        style={{ backgroundColor: '#f5f5f5', borderRadius: borderRadius, border: border, borderRight: borderRight }}
        sx={{
          maxHeight: '40px',
          maxWidth: '40px',
          minWidth: '40px',
          minHeight: '40px',
          padding: '0px 0px 0px 0px',
        }}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{
          '& .MuiMenuItem-root': {
            color: 'black', // Color de texto por defecto
            '&:hover': {
              backgroundColor: '#007bff', // Color azul en hover
              color: 'white', // Color del texto en hover
              borderRadius: '5px 5px 5px 5px',
              marginLeft: '5px',
              maxWidth: '95%',
              minWidth: '95%',
            },
            '&.Mui-selected': {
              backgroundColor: '#007bff', // Color azul cuando seleccionado
              color: 'white', // Color del texto cuando seleccionado
              borderRadius: '5px 5px 5px 5px',
              marginLeft: '5px',
              maxWidth: '95%',
              minWidth: '95%',
            },
          },
        }}
      >

        {
          children.map((child, index) => {
            return child.visibility &&
              (
                <MenuItem
                  key={index}
                  onClick={() => handleClose(child.onClick)}
                  component={child.route ? Link : null}
                  to={child.route ? child.route : null}

                >
                  {child.icon} {child.label}
                </MenuItem>
              );
          })
        }
      </Menu>
    </Grid>
  )

};


export default NavigationRightButton;
import React from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  People,
  Receipt,
  ExpandMore,
  ExpandLess,
  Settings,
  ListAlt,
} from '@mui/icons-material';
import InventoryIcon from '@mui/icons-material/Inventory';
import { Link, useLocation } from 'react-router-dom';
// import './Sidebar.css'; // Evita estilos que cambien tamaños/posiciones si usas el sx de abajo

const Sidebar = ({ width = 240, expanded, toggleSubmenu, handleLogout, handleDoBackup }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => {
    if (currentPath === path) return true;
    if (currentPath.startsWith(`${path}/`)) {
      return path.includes('qbwc') ? true : false;
    } else if (currentPath.includes('item_details')) {
      if (path.includes('list_items')) return true;
    } else if (currentPath.includes('invoice_details')) {
      if (path.includes('list_invoices')) return true;
    } else if (currentPath.includes('customer_details')) {
      if (path.includes('list_customers')) return true;
    }
    return false;
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width,
        height: '100vh',
        bgcolor: '#21263c',
        color: '#fff',
        zIndex: (t) => t.zIndex.drawer,  // por encima del contenido
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        overflowY: 'auto',               // scroll si hay muchos items
      }}
    >
      {/* Header/logo */}
      <Box sx={{ p: 1, textAlign: 'center' }}>
        <img
          src="/logo_qbwc_zoho_mini.png"
          alt="Login Logo"
          style={{
            maxWidth: '100%',
            height: 'auto',
            marginTop: '-5px',
            borderRadius: 3,
          }}
        />
      </Box>

      {/* Menú */}
      <List sx={{ px: 1 }}>
        <ListItemButton
          component={Link}
          to="/integration"
          sx={{
            backgroundColor: isActive('/integration') ? '#00796b' : 'inherit',
            borderRadius: isActive('/integration') ? 3 : 0,
          }}
        >
          <ListItemIcon>
            <Dashboard sx={{ color: '#fff', width: 20, height: 20 }} />
          </ListItemIcon>
          <ListItemText
            primary="Dashboard"
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '13px',
                fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
              },
              ml: -3,
            }}
          />
        </ListItemButton>

        <ListItemButton
          component={Link}
          to="/integration/list_customers"
          sx={{
            backgroundColor: isActive('/integration/list_customers') ? '#00796b' : 'inherit',
            borderRadius: isActive('/integration/list_customers') ? 3 : 0,
          }}
        >
          <ListItemIcon>
            <People sx={{ color: '#fff', width: 20, height: 20 }} />
          </ListItemIcon>
          <ListItemText
            primary="Customers"
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '13px',
                fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
              },
              ml: -3,
            }}
          />
        </ListItemButton>

        <ListItemButton
          component={Link}
          to="/integration/list_items"
          sx={{
            backgroundColor: isActive('/integration/list_items') ? '#00796b' : 'inherit',
            borderRadius: isActive('/integration/list_items') ? 3 : 0,
          }}
        >
          <ListItemIcon>
            <InventoryIcon sx={{ color: '#fff', width: 20, height: 20 }} />
          </ListItemIcon>
          <ListItemText
            primary="Items"
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '13px',
                fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
              },
              ml: -3,
            }}
          />
        </ListItemButton>

        <ListItemButton
          component={Link}
          to="/integration/list_invoices"
          sx={{
            backgroundColor: isActive('/integration/list_invoices') ? '#00796b' : 'inherit',
            borderRadius: isActive('/integration/list_invoices') ? 3 : 0,
          }}
        >
          <ListItemIcon>
            <Receipt sx={{ color: '#fff', width: 20, height: 20 }} />
          </ListItemIcon>
          <ListItemText
            primary="Stock Invoices"
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '13px',
                fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
              },
              ml: -3,
            }}
          />
        </ListItemButton>

        <ListItemButton
          component={Link}
          to="/integration/list_sales_orders"
          sx={{
            backgroundColor: isActive('/integration/list_sales_orders') ? '#00796b' : 'inherit',
            borderRadius: isActive('/integration/list_sales_orders') ? 3 : 0,
          }}
        >
          <ListItemIcon>
            <ListAlt sx={{ color: '#fff', width: 20, height: 20 }} />
          </ListItemIcon>
          <ListItemText
            primary="Custom Sales Orders"
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '13px',
                fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
              },
              ml: -3,
            }}
          />
        </ListItemButton>

        {/* Settings + submenú */}
        <ListItemButton
          onClick={toggleSubmenu}
          sx={{
            backgroundColor:
              isActive('/integration/zoho') ||
              isActive('/integration/qbwc') ||
              isActive('/integration/application_settings') ||
              isActive('/integration/download_backup_db') ||
              isActive('/integration/list_users') ||
              isActive('/integration/list_logs') ||
              isActive('/integration/view_user')
                ? '#00796b'
                : 'inherit',
            borderRadius:
              isActive('/integration/zoho') ||
              isActive('/integration/qbwc') ||
              isActive('/integration/application_settings') ||
              isActive('/integration/download_backup_db') ||
              isActive('/integration/list_users') ||
              isActive('/integration/list_logs') ||
              isActive('/integration/view_user')
                ? 3
                : 0,
          }}
        >
          <ListItemIcon>
            <Settings sx={{ color: '#fff', width: 20, height: 20 }} />
          </ListItemIcon>
          <ListItemText
            primary="Settings"
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '13px',
                fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
              },
              ml: -3,
            }}
          />
          {expanded ? (
            <ExpandLess sx={{ color: '#fff', width: 20, height: 20 }} />
          ) : (
            <ExpandMore sx={{ color: '#fff', width: 20, height: 20 }} />
          )}
        </ListItemButton>

        {expanded && (
          <>
            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.12)' }} />
            <List sx={{ pl: 4 }}>
              <ListItemButton
                component={Link}
                to="/integration/zoho"
                sx={{
                  backgroundColor: isActive('/integration/zoho') ? '#00796b' : 'inherit',
                  borderRadius: isActive('/integration/zoho') ? 3 : 0,
                  ml: -4, 
                }}
              >
                <ListItemText
                  primary="Zoho"
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '13px',
                      fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                    },
                    ml: 3.3, 
                  }}
                />
              </ListItemButton>

              <ListItemButton
                component={Link}
                to="/integration/qbwc"
                sx={{
                  backgroundColor: isActive('/integration/qbwc') ? '#00796b' : 'inherit',
                  borderRadius: isActive('/integration/qbwc') ? 3 : 0,
                  ml: -4,
                }}
              >
                <ListItemText
                  primary="Quickbooks"
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '13px',
                      fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                    },
                    ml: 3.3,
                  }}
                />
              </ListItemButton>

              <ListItemButton
                component={Link}
                to="/integration/application_settings"
                sx={{
                  backgroundColor: isActive('/integration/application_settings') ? '#00796b' : 'inherit',
                  borderRadius: isActive('/integration/application_settings') ? 3 : 0,
                  ml: -4,
                }}
              >
                <ListItemText
                  primary="Configuration"
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '13px',
                      fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                    },
                    ml: 3.3,
                  }}
                />
              </ListItemButton>

              <ListItemButton onClick={handleDoBackup} sx={{ ml: -4 }}>
                <ListItemText
                  primary="Do BackUp"
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '13px',
                      fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                    },
                    ml: 3.3,
                  }}
                />
              </ListItemButton>

              <ListItemButton
                component={Link}
                to="/integration/download_backup_db"
                sx={{
                  backgroundColor: isActive('/integration/download_backup_db') ? '#00796b' : 'inherit',
                  borderRadius: isActive('/integration/download_backup_db') ? 3 : 0,
                  ml: -4,
                }}
              >
                <ListItemText
                  primary="BackUps"
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '13px',
                      fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                    },
                    ml: 3.3,
                  }}
                />
              </ListItemButton>

              {localStorage.getItem('isStaff') === 'admin' && (
                <>
                  <ListItemButton
                    component={Link}
                    to="/integration/list_users"
                    sx={{
                      backgroundColor:
                        isActive('/integration/list_users') || isActive('/integration/view_user')
                          ? '#00796b'
                          : 'inherit',
                      borderRadius:
                        isActive('/integration/list_users') || isActive('/integration/view_user') ? 3 : 0,
                      ml: -4,
                    }}
                  >
                    <ListItemText
                      primary="Users"
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontSize: '13px',
                          fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                        },
                        ml: 3.3,
                      }}
                    />
                  </ListItemButton>

                  <ListItemButton
                    component={Link}
                    to="/integration/list_logs"
                    sx={{
                      backgroundColor: isActive('/integration/list_logs') ? '#00796b' : 'inherit',
                      borderRadius: isActive('/integration/list_logs') ? 3 : 0,
                      ml: -4,
                    }}
                  >
                    <ListItemText
                      primary="Logs"
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontSize: '13px',
                          fontFamily: 'Inter, Source Sans Pro, Helvetica, Arial, sans-serif',
                        },
                        ml: 3.3,
                      }}
                    />
                  </ListItemButton>
                </>
              )}
            </List>
          </>
        )}
      </List>
    </Box>
  );
};

export default Sidebar;
import React from 'react';
import { Container, Typography, Link, Grid, Box } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import ContactsIcon from '@mui/icons-material/Contacts';

const Footer = () => {
    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 0,
                backgroundColor: '#f7f7fe',
                padding: '1px 1px 1px 0',
                boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
                border: '1px solid #ccc',
                zIndex: 9900,
                width: '100%'
            }}
        >
            <Box sx={{
                marginLeft: '0px',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 10px',
                py: 0.5
            }}>
                <Grid container item xs={6} justifyContent="left" spacing={6}>
                    <Grid item>
                        <Link href="mailto:" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
                            <MessageIcon fontSize="small" sx={{ fontSize: 16 }} />
                            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.1, mb: 0, fontSize: '0.50rem' }}>
                                Contact Us
                            </Typography>
                        </Link>
                    </Grid>
                    <Grid item>
                        <Link href="#" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
                            <RssFeedIcon fontSize="small" sx={{ fontSize: 16 }} />
                            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.1, mb: 0, fontSize: '0.50rem' }}>
                                Feed
                            </Typography>
                        </Link>
                    </Grid>
                    <Grid item>
                        <Link href="#" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
                            <ContactsIcon fontSize="small" sx={{ fontSize: 16 }} />
                            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.1, mb: 0, fontSize: '0.50rem' }}>
                                Contacts
                            </Typography>
                        </Link>
                    </Grid>
                </Grid>
                <Box sx={{ marginLeft: '0px' }} >
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem', mb: 0.1, mt: 0.8, }}>
                        © {new Date().getFullYear()} New Window System. All rights reserved. |
                        <Link href="/privacy-policy" color="inherit" underline="hover" sx={{ fontSize: '0.75rem' }}>
                            Privacy Policy
                        </Link>
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default Footer;
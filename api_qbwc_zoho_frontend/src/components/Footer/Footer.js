import React from 'react';
import { Container, Typography, Link, Grid } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import ContactsIcon from '@mui/icons-material/Contacts';

const Footer = () => {
    return (
        <Container
            sx={{
                position: 'fixed',
                bottom: 0,
                minWidth: 'calc(100vw - 30px)',
                maxWidth: 'calc(100vw - 30px)',
                backgroundColor: '#f7f7fe',
                padding: '1px 1px 1px 0',
                boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
                border: '1px solid #ccc',
                zIndex: 1000,
            }}
        >
            <Container maxWidth="lg" sx={{ marginLeft: '0px' }}>
                <Grid container item xs={12} sx={{ marginLeft: '-30px'}}>
                    <Grid item container xs={6} justifyContent="left" spacing={6}>
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
                    <Grid item container xs={6} justifyContent="right">
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem', mb: 0.1, mt: 0.8,  }}>
                            © {new Date().getFullYear()} New Window System. All rights reserved. |
                            <Link href="/privacy-policy" color="inherit" underline="hover" sx={{ fontSize: '0.75rem' }}>
                                Privacy Policy
                            </Link>
                        </Typography>
                    </Grid>
                </Grid>
            </Container>
        </Container>
    );
};

export default Footer;
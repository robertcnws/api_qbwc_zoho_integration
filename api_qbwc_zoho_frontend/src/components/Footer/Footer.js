import React from 'react';
import { Container, Box, Typography, Link } from '@mui/material';

const Footer = () => {
    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 0,
                width: '200vm',
                minWidth: '100vw',
                backgroundColor: '#f5f5f5',
                padding: '10px 10px 10px 0',
                boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
            }}
        >
            <Container maxWidth="md">
                <Typography variant="body2" color="textSecondary">
                    © {new Date().getFullYear()} Your Company. All rights reserved. | 
                    <Link href="/privacy-policy" color="inherit" sx={{ marginLeft: '5px' }}>
                        Privacy Policy
                    </Link>
                </Typography>
            </Container>
        </Box>
    );
};

export default Footer;
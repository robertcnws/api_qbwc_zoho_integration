import React, { useState, useEffect } from 'react';
import { Grid, Button, TextField, IconButton, Box, Container, Typography, Alert } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import './ApplicationSettingsForm.css';
import { Link } from 'react-router-dom';

const ApplicationSettingsForm = ({ formData, onSubmit, error, success }) => {
    const [data, setData] = useState(formData);
    const [showZohoSecret, setShowZohoSecret] = useState(false);
    const [showQBPassword, setShowQBPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [formChanged, setFormChanged] = useState(false);

    useEffect(() => {
        setData(formData);
        setFormChanged(false);
    }, [formData]);

    useEffect(() => {
        const isFormChanged =
            data.zoho_client_id !== formData.zoho_client_id ||
            data.zoho_client_secret !== formData.zoho_client_secret ||
            data.zoho_org_id !== formData.zoho_org_id ||
            data.zoho_redirect_uri !== formData.zoho_redirect_uri ||
            data.qb_username !== formData.qb_username ||
            data.qb_password !== formData.qb_password;
        setFormChanged(isFormChanged);
    }, [data, formData]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        const updatedData = { ...data, [name]: value };
        setData(updatedData);
        const isFormChanged = Object.keys(updatedData).some(key => updatedData[key] !== formData[key]);
        setFormChanged(isFormChanged);
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: value ? '' : prevErrors[name],
        }));
    };

    const handleBlur = (event) => {
        const { name, value } = event.target;
        const newErrors = { ...errors };
        if (!value) {
            newErrors[name] = `${name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} is required`;
        } else {
            newErrors[name] = '';
        }
        setErrors(newErrors);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!data.zoho_client_id) newErrors.zoho_client_id = 'Zoho Client ID is required';
        if (!data.zoho_client_secret) newErrors.zoho_client_secret = 'Zoho Client Secret is required';
        if (!data.zoho_org_id) newErrors.zoho_org_id = 'Zoho Organization ID is required';
        if (!data.zoho_redirect_uri) newErrors.zoho_redirect_uri = 'Zoho Redirect URI is required';
        if (!data.qb_username) newErrors.qb_username = 'QB Username is required';
        if (!data.qb_password) newErrors.qb_password = 'QB Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (validateForm()) {
            onSubmit(data);
            setFormChanged(false);
        }
    };



    return (
        // <Container 
        //     maxWidth="md" 
        //     sx={{ 
        //         mt: '1%', 
        //         bgcolor: 'background.paper', 
        //         boxShadow: 3, 
        //         borderRadius: 2, 
        //         minWidth:'67vw', 
        //         minHeight: '55vh',
        //         marginLeft: '-20%',
        //         paddingBottom: '20px',
        //       }}
        // >
        //     <Typography
        //         variant="h6"
        //         align="center"
        //         gutterBottom
        //         sx={{
        //             borderBottom: '2px solid #2196F3',
        //             paddingBottom: '8px',
        //             marginBottom: '20px',
        //             textTransform: 'uppercase',
        //             color: '#212529',
        //             fontWeight: 'bold',
        //         }}
        //     >
        //         App Configuration
        //     </Typography>
        //     {success && <Alert severity="success">{success}<br/></Alert>}
        //     {error && <Alert severity="error">{error}<br/></Alert>}
        //     <form onSubmit={handleSubmit}>
        //         <Box sx={{ mb: 3, bgcolor: '#E3F2FD'}}>
        //             <Typography variant="h6" className="separator">Zoho Section</Typography>
        //         </Box>
        //         <Grid container spacing={2}>
        //             <Grid item xs={6}>
        //                 <TextField
        //                     label="Zoho Client ID"
        //                     name="zoho_client_id"
        //                     value={data.zoho_client_id || ''}
        //                     onChange={handleChange}
        //                     onBlur={handleBlur}
        //                     fullWidth
        //                     margin="normal"
        //                     error={!!errors.zoho_client_id}
        //                     helperText={errors.zoho_client_id}
        //                 />
        //             </Grid>
        //             <Grid item xs={6}>
        //                 <TextField
        //                     label="Zoho Client Secret"
        //                     name="zoho_client_secret"
        //                     type={showZohoSecret ? 'text' : 'password'}
        //                     value={data.zoho_client_secret || ''}
        //                     onChange={handleChange}
        //                     onBlur={handleBlur}
        //                     fullWidth
        //                     margin="normal"
        //                     error={!!errors.zoho_client_secret}
        //                     helperText={errors.zoho_client_secret}
        //                     InputProps={{
        //                         endAdornment: (
        //                             <IconButton
        //                                 onClick={() => setShowZohoSecret(!showZohoSecret)}
        //                                 edge="end"
        //                             >
        //                                 {showZohoSecret ? <Visibility /> : <VisibilityOff />}
        //                             </IconButton>
        //                         ),
        //                     }}
        //                 />
        //             </Grid>
        //         </Grid>
        //         <Grid container spacing={2}>
        //             <Grid item xs={6}>
        //                 <TextField
        //                     label="Zoho Organization ID"
        //                     name="zoho_org_id"
        //                     value={data.zoho_org_id || ''}
        //                     onChange={handleChange}
        //                     onBlur={handleBlur}
        //                     fullWidth
        //                     margin="normal"
        //                     error={!!errors.zoho_org_id}
        //                     helperText={errors.zoho_org_id}
        //                 />
        //             </Grid>
        //             <Grid item xs={6}>
        //                 <TextField
        //                     label="Zoho Redirect URI"
        //                     name="zoho_redirect_uri"
        //                     value={data.zoho_redirect_uri || ''}
        //                     onChange={handleChange}
        //                     onBlur={handleBlur}
        //                     fullWidth
        //                     margin="normal"
        //                     error={!!errors.zoho_redirect_uri}
        //                     helperText={errors.zoho_redirect_uri}
        //                 />
        //             </Grid>
        //         </Grid>
        //         <Box sx={{ mb: 3, mt: 3, bgcolor: '#E3F2FD' }}>
        //             <Typography variant="h6" className="separator">QBWC Section</Typography>
        //         </Box>
        //         <Grid container spacing={2}>
        //             <Grid item xs={6}>
        //                 <TextField
        //                     label="QB Username"
        //                     name="qb_username"
        //                     value={data.qb_username || ''}
        //                     onChange={handleChange}
        //                     onBlur={handleBlur}
        //                     fullWidth
        //                     margin="normal"
        //                     error={!!errors.qb_username}
        //                     helperText={errors.qb_username}
        //                 />
        //             </Grid>
        //             <Grid item xs={6}>
        //                 <TextField
        //                     label="QB Password"
        //                     name="qb_password"
        //                     type={showQBPassword ? 'text' : 'password'}
        //                     value={data.qb_password || ''}
        //                     onChange={handleChange}
        //                     onBlur={handleBlur}
        //                     fullWidth
        //                     margin="normal"
        //                     error={!!errors.qb_password}
        //                     helperText={errors.qb_password}
        //                     InputProps={{
        //                         endAdornment: (
        //                             <IconButton
        //                                 onClick={() => setShowQBPassword(!showQBPassword)}
        //                                 edge="end"
        //                             >
        //                                 {showQBPassword ? <Visibility /> : <VisibilityOff />}
        //                             </IconButton>
        //                         ),
        //                     }}
        //                 />
        //             </Grid>
        //         </Grid>
        //         <Typography
        //             sx={{
        //                 borderBottom: '2px solid #2196F3',
        //                 paddingBottom: '8px',
        //                 marginBottom: '20px',
        //                 color: '#2196F3',
        //                 fontWeight: 'bold',
        //             }}
        //         ></Typography>
        //         <Box sx={{ mt: 3 }}>
        //             <Button
        //                 type="submit"
        //                 variant="contained"
        //                 color="primary"
        //                 disabled={!formChanged} // Deshabilitar si no hay cambios
        //                 sx={{ mr: 2 }}
        //                 size='small'
        //             >
        //                 Update
        //             </Button>
        //             <Button
        //                 variant="contained"
        //                 component={Link}
        //                 color="warning"
        //                 to="/integration"
        //                 size='small'
        //             >
        //                 Cancel
        //             </Button>
        //         </Box>
        //     </form>
        // </Container>
        <Box className="main-content">

            <Box className="form-header">
                <Typography variant="h6" sx={{ paddingTop: '10px', paddingLeft: '10px' }}>App Configuration</Typography>
            </Box>

            <Container sx={{
                paddingTop: '20px',
                // paddingBottom: '485px',
                backgroundColor: '#F9F9FB',
                minWidth: '85.7vw',
                borderRight: '1px solid #ddd',
                // maxHeight: '25vh',
            }}>
                {success && <Alert severity="success">{success}<br /></Alert>}
                {error && <Alert severity="error">{error}<br /></Alert>}
                <form onSubmit={handleSubmit}>
                    <Box sx={{ mb: 3, color: 'gray' }}>
                        <Typography variant="h6" className="separator">Zoho Section</Typography>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item container xs={6}>
                            <Grid item xs={3}>
                                <Typography
                                    sx={{
                                        color: 'error.main',
                                        fontSize: '14px',
                                        marginLeft: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        height: '100%',
                                    }}
                                >
                                    Zoho Client ID*
                                </Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <TextField
                                    name="zoho_client_id"
                                    value={data.zoho_client_id || ''}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.zoho_client_id}
                                    helperText={errors.zoho_client_id}
                                />
                            </Grid>
                        </Grid>
                        <Grid item container xs={6}>
                            <Grid item xs={3}>
                                <Typography
                                    sx={{
                                        color: 'error.main',
                                        fontSize: '14px',
                                        marginLeft: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        height: '100%',
                                    }}
                                >
                                    Zoho Client Secret*
                                </Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <TextField
                                    name="zoho_client_secret"
                                    type={showZohoSecret ? 'text' : 'password'}
                                    value={data.zoho_client_secret || ''}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.zoho_client_secret}
                                    helperText={errors.zoho_client_secret}
                                    InputProps={{
                                        endAdornment: (
                                            <IconButton
                                                onClick={() => setShowZohoSecret(!showZohoSecret)}
                                                edge="end"
                                            >
                                                {showZohoSecret ? <Visibility /> : <VisibilityOff />}
                                            </IconButton>
                                        ),
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid container spacing={2}>
                        <Grid item container xs={6}>
                            <Grid item xs={3}>
                                <Typography
                                    sx={{
                                        color: 'error.main',
                                        fontSize: '14px',
                                        marginLeft: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        height: '100%',
                                    }}
                                >
                                    Zoho Organization ID*
                                </Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <TextField
                                    name="zoho_org_id"
                                    value={data.zoho_org_id || ''}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.zoho_org_id}
                                    helperText={errors.zoho_org_id}
                                />
                            </Grid>
                        </Grid>
                        <Grid item container xs={6}>
                            <Grid item xs={3}>
                                <Typography
                                    sx={{
                                        color: 'error.main',
                                        fontSize: '14px',
                                        marginLeft: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        height: '100%',
                                    }}
                                >
                                    Zoho Redirect URI*
                                </Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <TextField
                                    name="zoho_redirect_uri"
                                    value={data.zoho_redirect_uri || ''}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.zoho_redirect_uri}
                                    helperText={errors.zoho_redirect_uri}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Box sx={{ mb: 3, mt: 3, color: 'gray' }}>
                        <Typography variant="h6" className="separator">QBWC Section</Typography>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item container xs={6}>
                            <Grid item xs={3}>
                                <Typography
                                    sx={{
                                        color: 'error.main',
                                        fontSize: '14px',
                                        marginLeft: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        height: '100%',
                                    }}
                                >
                                    QBWC Username*
                                </Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <TextField
                                    name="qb_username"
                                    value={data.qb_username || ''}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.qb_username}
                                    helperText={errors.qb_username}
                                />
                            </Grid>
                        </Grid>
                        <Grid item container xs={6}>
                            <Grid item xs={3}>
                                <Typography
                                    sx={{
                                        color: 'error.main',
                                        fontSize: '14px',
                                        marginLeft: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        height: '100%',
                                    }}
                                >
                                    QBWC Password*
                                </Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <TextField
                                    name="qb_password"
                                    type={showQBPassword ? 'text' : 'password'}
                                    value={data.qb_password || ''}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.qb_password}
                                    helperText={errors.qb_password}
                                    InputProps={{
                                        endAdornment: (
                                            <IconButton
                                                onClick={() => setShowQBPassword(!showQBPassword)}
                                                edge="end"
                                            >
                                                {showQBPassword ? <Visibility /> : <VisibilityOff />}
                                            </IconButton>
                                        ),
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Typography
                        sx={{
                            paddingBottom: '8px',
                            marginBottom: '20px',
                        }}
                    ></Typography>
                    <Box className="form-footer" sx={{ display: 'flex', justifyContent: 'flex-start', border: '1px solid #ddd' }}>
                        <Button
                            type='submit'
                            variant="contained"
                            color="success"
                            size='small'
                            disabled={!formChanged}
                            sx={{ borderRadius: '5px', marginTop: '0px', marginRight: 1 }}>
                            Update
                        </Button>
                        <Button
                            component={Link}
                            to="/integration"
                            size='small'
                            sx={{
                                border: '1px solid #ddd',
                                borderRadius: '5px',
                                marginTop: '0px',
                                color: 'rgba(0, 0, 0, 0.54)',
                                backgroundColor: 'rgba(0, 0, 0, 0.1)'
                            }}>
                            Cancel
                        </Button>
                    </Box>
                </form>
            </Container>
        </Box>
    );
};

export default ApplicationSettingsForm;

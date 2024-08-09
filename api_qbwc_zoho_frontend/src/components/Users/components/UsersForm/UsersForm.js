import React, { useState, useEffect } from 'react';
import { Grid, Button, TextField, IconButton, Box, Container, Typography, Alert, Select, MenuItem, FormControl, InputLabel, FormHelperText } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import './UsersForm.css';
import { Link } from 'react-router-dom';

const UsersForm = ({ formData, onSubmit, error, success, isNew }) => {
    const [data, setData] = useState(formData);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [formChanged, setFormChanged] = useState(false);

    useEffect(() => {
        if (!isNew){
            setData({
              ...formData,
              role: formData.is_staff ? 'admin' : 'user',
            });
        }
        setFormChanged(false);
    }, [formData]);

    useEffect(() => {
        const role = data.role === 'admin' ? true : false;
        const isFormChanged =
            data.username !== formData.username ||
            data.first_name !== formData.first_name ||
            data.last_name !== formData.last_name ||
            role !== formData.is_staff ||
            data.email !== formData.email;
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
            if (name === 'confirm_password') {
                if (value !== data.password) {
                    newErrors[name] = 'Passwords do not match';
                } else {
                    newErrors[name] = '';
                }
            } else if (name === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    newErrors[name] = 'Invalid email address';
                } else {
                    newErrors[name] = '';
                }
            } else {
                newErrors[name] = '';
            }
        }
        setErrors(newErrors);
    };

    const validateForm = () => {
      const newErrors = {};
      if (!data.first_name) newErrors.first_name = 'First Name is required';
      if (!data.last_name) newErrors.last_name = 'Last Name is required';
      if (!data.email) {
        newErrors.email = 'Email is required';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          newErrors.email = 'Invalid email address';
        }
      }
      if (!data.password) newErrors.password = 'Password is required';
      if (!data.confirm_password) {
        newErrors.confirm_password = 'Password Confirm is required';
      } else if (data.password !== data.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match';
      }
      if (!data.role) newErrors.role = 'Role is required';
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (validateForm()) {
            setData({
                ...data,
                is_new: isNew,
            })
            onSubmit(data);
            setFormChanged(false);
        }
    };

    return (
        <Container 
            maxWidth="md" 
            sx={{ 
                mt: '1%', 
                bgcolor: 'background.paper', 
                boxShadow: 3, 
                borderRadius: 2, 
                minWidth:'67vw', 
                minHeight: '50vh',
                marginLeft: '-20%',
              }}
        >
            <Typography
                variant="h6"
                align="center"
                gutterBottom
                sx={{
                    borderBottom: '2px solid #2196F3',
                    paddingBottom: '8px',
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    color: '#212529',
                    fontWeight: 'bold',
                }}
            >
                User
            </Typography>
            {success && <Alert severity="success">{success}<br/></Alert>}
            {error && <Alert severity="error">{error}<br/></Alert>}
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField
                            label="Username"
                            name="username"
                            value={data.username || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            margin="normal"
                            error={!!errors.username}
                            helperText={errors.username}
                            disabled={!isNew}
                        />
                    </Grid>
              </Grid>
              <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField
                            label="First Name"
                            name="first_name"
                            value={data.first_name || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            margin="normal"
                            error={!!errors.first_name}
                            helperText={errors.first_name}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            label="Last Name"
                            name="last_name"
                            value={data.last_name || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            margin="normal"
                            error={!!errors.last_name}
                            helperText={errors.last_name}
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField
                            label="Email"
                            name="email"
                            value={data.email || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            margin="normal"
                            error={!!errors.email}
                            helperText={errors.email}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth margin="normal" error={!!errors.role}>
                            <InputLabel>Role</InputLabel>
                            <Select
                                label="Role"
                                name="role"
                                value={data.role || ''}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            >
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="user">User</MenuItem>
                            </Select>
                            <FormHelperText>{errors.role}</FormHelperText>
                        </FormControl>
                    </Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField
                            label="Password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={data.password || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            margin="normal"
                            error={!!errors.password}
                            helperText={errors.password}
                            InputProps={{
                                endAdornment: (
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                    >
                                        {showPassword ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            label="Confirm Password"
                            name="confirm_password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={data.confirm_password || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            margin="normal"
                            error={!!errors.confirm_password}
                            helperText={errors.confirm_password}
                            InputProps={{
                                endAdornment: (
                                    <IconButton
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        edge="end"
                                    >
                                        {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                ),
                            }}
                        />
                    </Grid>
                </Grid>
                <Typography
                    sx={{
                        borderBottom: '2px solid #2196F3',
                        paddingBottom: '8px',
                        marginBottom: '20px',
                        color: '#2196F3',
                        fontWeight: 'bold',
                    }}
                ></Typography>
                <Box sx={{ mt: 3 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={!formChanged}
                        sx={{ mr: 2 }}
                        size='small'
                    >
                        {isNew ? 'Create' : 'Update'}
                    </Button>
                    <Button
                        variant="contained"
                        component={Link}
                        color="warning"
                        to="/integration/list_users"
                        size='small'
                    >
                        Cancel
                    </Button>
                </Box>
            </form>
        </Container>
    );
};

export default UsersForm;

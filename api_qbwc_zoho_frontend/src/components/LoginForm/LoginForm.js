import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../AuthContext/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCookie } from '../../utils';

const apiUrl = process.env.REACT_APP_BACKEND_URL;

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const body_jwt = JSON.stringify({ username, password });
      const jwtResponse = await axios.post(`${apiUrl}/api/token/`, body_jwt, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      localStorage.setItem('accessToken', jwtResponse.data.access);
      localStorage.setItem('refreshToken', jwtResponse.data.refresh);

      const body = JSON.stringify({ username, password });
      const loginResponse = await axios.post(`${apiUrl}/login/`, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'), 
        },
      });

      if (loginResponse.status === 200) {
        setSuccess('Login successful');
        login();
        navigate('/integration');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        Login
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{ mt: 1 }}
      >
        <TextField
          label="Username"
          variant="outlined"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Box sx={{ position: 'relative', mt: 3, mb: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
          >
            Login
          </Button>
          {loading && (
            <CircularProgress
              size={24}
              sx={{
                color: 'primary.main',
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px',
              }}
            />
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default LoginForm;

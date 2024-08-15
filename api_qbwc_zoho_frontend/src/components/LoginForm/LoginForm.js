import React, { useState } from 'react';
import { Container, TextField, Button, Box, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../AuthContext/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCookie } from '../../utils';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

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

    // Validación básica del formulario
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      setLoading(false);
      return;
    }

    let jwtResponse = null;

    try {
      const body_jwt = JSON.stringify({ username, password });
      jwtResponse = await axios.post(`${apiUrl}/api/token/`, body_jwt, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (jwtResponse.status !== 200) {
        setError(`Invalid Credentials : No active account found with the given credentials`);
        throw new Error(`${error}`);
      }

      else {
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
          localStorage.setItem('isStaff', loginResponse.data.is_staff);
          localStorage.setItem('username', loginResponse.data.username);
          localStorage.setItem('firstName', loginResponse.data.first_name);
          localStorage.setItem('lastName', loginResponse.data.last_name);
          login();
          navigate('/integration');
        } else {
          console.log(loginResponse);
          setError(`${loginResponse.data.error} : ${loginResponse.data.description}`);
          throw new Error(`${error}`);
        }
      }
    } catch (error) {
      setError(`Invalid Credentials : No active account found with the given credentials`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <img
        src="/logo_qbwc_zoho.png"
        alt="Login Logo"
        style={{ maxWidth: '100%', height: 'auto' }} // Ajusta el tamaño según sea necesario
      />
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
          error={!username.trim() && Boolean(error)}
          helperText={!username.trim() && error ? 'Username is required' : ''}
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
          error={!password.trim() && Boolean(error)}
          helperText={!password.trim() && error ? 'Password is required' : ''}
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

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext/AuthContext';
import ProtectedRoute from './components/ProtectedRoutes/ProtectedRoutes';
import LoginForm from './components/LoginForm/LoginForm';
import Dashboard from './components/Dashboard/Dashboard';
import ApplicationSettingsContainer from './components/ApplicationSettings/components/ApplicationSettingsContainer/ApplicationSettingsContainer';
import MainContent from './components/MainContent/MainContent';

const HomeRedirect = () => {
  const { isAuthenticated } = useAuth();

  console.log('isAuthenticated', isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/integration" />;
  }

  return <LoginForm />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/integration/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} >
            <Route path="" element={<MainContent />} />
            <Route path="application_settings" element={<ApplicationSettingsContainer />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

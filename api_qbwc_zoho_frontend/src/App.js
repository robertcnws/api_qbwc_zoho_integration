import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext/AuthContext';
import ProtectedRoute from './components/ProtectedRoutes/ProtectedRoutes';
import LoginForm from './components/LoginForm/LoginForm';
import Dashboard from './components/Dashboard/Dashboard';
import ApplicationSettingsContainer from './components/ApplicationSettings/components/ApplicationSettingsContainer/ApplicationSettingsContainer';
import MainContent from './components/MainContent/MainContent';
import ZohoLoading from './components/ZohoLoading/ZohoLoading';
import ItemsListPage from './components/Items/components/ItemsListPage/ItemsListPage';
import ItemsDetails from './components/Items/components/ItemsDetails/ItemsDetails';

const HomeRedirect = () => {
  const { isAuthenticated } = useAuth();

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
            <Route path="zoho" element={<ZohoLoading />} />
            <Route path="list_items" element={<ItemsListPage />} />
            <Route path="item_details" element={<ItemsDetails />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

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
import CustomersListPage from './components/Customers/components/CustomersListPage/CustomersListPage';
import CustomersDetails from './components/Customers/components/CustomersDetails/CustomersDetails';
import InvoicesListPage from './components/Invoices/components/InvoicesListPage/InvoicesListPage';
import InvoicesDetails from './components/Invoices/components/InvoicesDetails/InvoicesDetails';
import QbwcItemsListPage from './components/QbwcItems/components/QbwcItemsListPage/QbwcItemsListPage';
import QbwcGetting from './components/QbwcGetting/QbwcGetting';
import QbwcCustomersListPage from './components/QbwcCustomers/components/QbwcCustomersListPage/QbwcCustomersListPage';
import QbwcSimilarItemsListPage from './components/QbwcItems/components/QbwcSimilarItemsListPage/QbwcSimilarItemsListPage';
import QbwcSimilarCustomersListPage from './components/QbwcCustomers/components/QbwcSimilarCustomersListPage/QbwcSimilarCustomersListPage';
import QbwcMatchedCustomersListPage from './components/QbwcCustomers/components/QbwcMatchedCustomersListPage/QbwcMatchedCustomersListPage';
import QbwcMatchedItemsListPage from './components/QbwcItems/components/QbwcMatchedItemsListPage/QbwcMatchedItemsListPage';
import QbwcNeverMatchedItemsListPage from './components/QbwcItems/components/QbwcNeverMatchedItemsListPage/QbwcNeverMatchedItemsListPage';
import QbwcNeverMatchedCustomersListPage from './components/QbwcCustomers/components/QbwcNeverMatchedCustomersListPage/QbwcNeverMatchedCustomersListPage';
import DownloadBackupList from './components/DownloadBackupList/DownloadBackupList';

const HomeRedirect = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    const redirectPath = localStorage.getItem('redirectPath') || '/integration';
    localStorage.removeItem('redirectPath'); 
    return <Navigate to={redirectPath} />;
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
            <Route path="list_customers" element={<CustomersListPage />} />
            <Route path="customer_details" element={<CustomersDetails />} />
            <Route path="list_invoices" element={<InvoicesListPage />} />
            <Route path="invoice_details" element={<InvoicesDetails />} />
            <Route path="qbwc" element={<QbwcGetting />} />
            <Route path="qbwc/items/list" element={<QbwcItemsListPage />} />
            <Route path="qbwc/customers/list" element={<QbwcCustomersListPage />} />
            <Route path="qbwc/items/similar" element={<QbwcSimilarItemsListPage />} />
            <Route path="qbwc/customers/similar" element={<QbwcSimilarCustomersListPage />} />
            <Route path="qbwc/items/matched" element={<QbwcMatchedItemsListPage />} />
            <Route path="qbwc/customers/matched" element={<QbwcMatchedCustomersListPage />} />
            <Route path="qbwc/items/never_match" element={<QbwcNeverMatchedItemsListPage />} />
            <Route path="qbwc/customers/never_match" element={<QbwcNeverMatchedCustomersListPage />} />
            <Route path="download_backup_db" element={<DownloadBackupList />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

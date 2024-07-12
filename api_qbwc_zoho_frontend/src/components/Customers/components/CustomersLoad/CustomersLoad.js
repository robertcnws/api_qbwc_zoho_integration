// src/components/CustomersLoad.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';

const CustomersLoad = () => {
  return (
    <div className="container mt-5 shadow p-3 mb-5 bg-white rounded">
      <div className="alert alert-success d-flex align-items-center mb-0" role="alert">
        <FaExclamationTriangle className="text-success me-2" />
        <p className="mb-0">Customers loaded successfully!</p>
      </div>

      <div className="container text-end mt-3">
        <Link to="/list_customers" className="btn btn-primary btn-sm">
          List Customers
        </Link>
        <Link to="/zoho_loading" className="btn btn-info btn-sm ms-2">
          Loading
        </Link>
      </div>
    </div>
  );
};

export default CustomersLoad;

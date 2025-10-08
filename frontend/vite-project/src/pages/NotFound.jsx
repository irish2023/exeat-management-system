// In src/pages/NotFound.jsx

import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="container text-center mt-5">
      <h1 className="display-1">404</h1>
      <h2>Page Not Found</h2>
      <p className="lead">
        Sorry, the page you are looking for does not exist.
      </p>
      <Link to="/dashboard" className="btn btn-primary mt-3">
        Go to Dashboard
      </Link>
    </div>
  );
}

export default NotFound;
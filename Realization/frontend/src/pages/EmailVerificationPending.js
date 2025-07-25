import React from 'react';
import { Link } from 'react-router-dom';

const EmailVerificationPending = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{ color: '#28a745', marginBottom: '20px', fontSize: '2.5rem' }}>
          <i className="fas fa-check-circle" style={{ marginRight: '10px' }}></i>
          Registration Successful!
        </h1>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#555', marginBottom: '25px' }}>
          Thank you for registering. An email has been sent to your inbox. Please check your email and click on the verification link to activate your account.
        </p>
        <p style={{ fontSize: '1rem', color: '#777' }}>
          If you don't see the email, please check your spam folder.
        </p>
        <Link to="/login" style={{
          display: 'inline-block',
          marginTop: '30px',
          padding: '10px 25px',
          backgroundColor: '#007bff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '25px',
          fontSize: '1rem',
          transition: 'background-color 0.3s ease, transform 0.2s ease'
        }} onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.backgroundColor = '#0056b3';
        }} onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.backgroundColor = '#007bff';
        }}>
          Go to Login
        </Link>
      </div>
    </div>
  );
};

export default EmailVerificationPending; 
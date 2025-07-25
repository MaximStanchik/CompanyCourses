import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ConsentModal = ({ isOpen, onClose, onRegister }) => {
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={modalHeaderStyle}>
          <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Read the terms and conditions</h3>
          <button onClick={onClose} style={closeButtonStyle}>&times;</button>
        </div>
        <div style={modalBodyStyle}>
          <label style={{ display: 'block', cursor: 'pointer', fontSize: '1.1rem', lineHeight: '1.6' }}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              style={{ marginRight: '10px', width: '20px', height: '20px', verticalAlign: 'middle' }}
            />
            I agree to the <Link to="/terms-of-service" style={{ color: '#007bff', textDecoration: 'underline' }}>Terms of Service</Link>, <Link to="/privacy-policy" style={{ color: '#007bff', textDecoration: 'underline' }}>Privacy Policy</Link> and allow my <Link to="/license-agreement" style={{ color: '#007bff', textDecoration: 'underline' }}>personal data</Link> to be processed
          </label>
        </div>
        <div style={modalFooterStyle}>
          <button 
            onClick={onRegister}
            disabled={!isChecked}
            style={{
              ...registerButtonStyle,
              opacity: isChecked ? 1 : 0.5,
              cursor: isChecked ? 'pointer' : 'not-allowed'
            }}
          >
            Register
          </button>
          <button onClick={onClose} style={cancelButtonStyle}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  backgroundColor: '#fff',
  padding: '30px',
  borderRadius: '10px',
  width: '90%',
  maxWidth: '500px',
  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
  display: 'flex',
  flexDirection: 'column'
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #eee',
  paddingBottom: '15px',
  marginBottom: '20px'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '2rem',
  cursor: 'pointer',
  color: '#aaa'
};

const modalBodyStyle = {
  marginBottom: '20px',
  // fontSize: '1.1rem',
  // lineHeight: '1.6'
};

const modalFooterStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '15px'
};

const baseButtonStyle = {
  padding: '10px 25px',
  borderRadius: '25px',
  border: 'none',
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease, transform 0.2s ease'
};

const registerButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: '#28a745',
  color: 'white',
};

const cancelButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: '#6c757d',
  color: 'white',
};

export default ConsentModal; 
import React from 'react';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.45)',
  zIndex: 2000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalStyle = {
  background: 'white',
  borderRadius: 8,
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  maxWidth: 480,
  width: '90vw',
  padding: 0,
  position: 'relative',
};

const closeBtnStyle = {
  position: 'absolute',
  top: 8,
  right: 12,
  background: 'none',
  border: 'none',
  fontSize: 24,
  color: '#888',
  cursor: 'pointer',
  zIndex: 1,
};

const Modal = ({ children, onClose }) => {
  React.useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={modalStyle}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button style={closeBtnStyle} aria-label="Close" onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
};

export default Modal; 
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, googleProvider, githubProvider } from '../firebase';
import { signInWithPopup, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import ConsentModal from '../components/ConsentModal';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const history = useHistory();
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Пароли не совпадают');
    }

    try {
      setError('');
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setVerificationSent(true);
      setUser(userCredential.user);
    } catch (err) {
      setError('Ошибка при создании аккаунта: ' + err.message);
    }
    setLoading(false);
  };

  const handleSocialLogin = async (provider) => {
    try {
      setError('');
      setLoading(true);
      
      const result = await signInWithPopup(auth, provider).catch((error) => {
        if (error.code === 'auth/popup-blocked') {
          throw new Error('Пожалуйста, разрешите всплывающие окна для этого сайта');
        }
        if (error.code === 'auth/popup-closed-by-user') {
          throw new Error('Вход был отменен');
        }
        throw error;
      });

      if (result.user) {
        setUser(result.user);
        history.push('/dashboard');
      }
    } catch (err) {
      setError('Ошибка при входе через социальную сеть: ' + err.message);
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };

  const openConsentModal = (provider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Регистрация</h2>
      
      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}

      {verificationSent && (
        <div style={{ 
          backgroundColor: '#e8f5e9', 
          color: '#2e7d32', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem' 
        }}>
          Письмо с подтверждением отправлено на ваш email. Пожалуйста, проверьте почту.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Подтвердите пароль</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          Зарегистрироваться
        </button>
      </form>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ marginBottom: '1rem' }}>Или зарегистрируйтесь через:</p>
        
        <button
          type="button"
          onClick={() => openConsentModal(googleProvider)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#fff',
            color: '#757575',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginBottom: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google" 
            style={{ width: '20px', height: '20px' }} 
          />
          Google
        </button>

        <button
          type="button"
          onClick={() => openConsentModal(githubProvider)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#24292e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <img 
            src="https://github.com/favicon.ico" 
            alt="GitHub" 
            style={{ width: '20px', height: '20px' }} 
          />
          GitHub
        </button>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p>
          Уже есть аккаунт?{' '}
          <a 
            href="/login" 
            style={{ color: '#007bff', textDecoration: 'none' }}
          >
            Войти
          </a>
        </p>
      </div>

      <ConsentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRegister={() => handleSocialLogin(selectedProvider)}
      />
    </div>
  );
};

export default Register; 
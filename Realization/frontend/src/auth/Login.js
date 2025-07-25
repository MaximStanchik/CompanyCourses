// Login.js
import React, { useState } from "react";
import "./style.css";
import classnames from "classnames";
import { useHistory, Link } from "react-router-dom";
import { connect } from "react-redux";
import { loginUser } from "../actions/authActions";
import NavBar from "../components/NavBar";
import SocialButtons from '../components/SocialButtons';
import ConsentModal from '../components/ConsentModal';
import SimpleCaptchaModal from '../components/SimpleCaptchaModal';
import { API_BASE_URL } from '../utils/constants';
import Modal from "../components/Modal";

const Login = (props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [checkbox1, setCheckbox1] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSocialProvider, setSelectedSocialProvider] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const history = useHistory();

  const handleTransition = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      history.push('/register');
    }, 300);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPassword(value);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const newUser = {
      email: email,
      password: password,
    };
    props.loginUser(newUser);
  };

  // Обработчик для клика по кнопкам социальных сетей
  const handleSocialButtonClick = (provider) => {
    setSelectedSocialProvider(provider);
    setIsModalOpen(true);
  };

  // Логика входа через соцсеть после согласия
  const handleSocialLogin = async () => {
    setIsModalOpen(false); // Закрыть модальное окно
    setErrors({}); // Очистить предыдущие ошибки

    // Просто перенаправляем пользователя на соответствующий эндпоинт бэкенда,
    // который инициирует OAuth-аутентификацию.
    let url;
    switch (selectedSocialProvider) {
      case 'google':
        url = `${API_BASE_URL}/auth/google`;
        break;
      case 'facebook':
        url = `${API_BASE_URL}/auth/facebook`;
        break;
      case 'github':
        url = `${API_BASE_URL}/auth/social/github`;
        break;
      case 'yandex':
        url = `${API_BASE_URL}/auth/yandex`;
        break;
      case 'dribbble':
        url = `${API_BASE_URL}/auth/dribbble`;
        break;
      default:
        setErrors({ social: 'Неизвестный провайдер социальной сети' });
        return;
    }
    window.location.href = url;
  };

  React.useEffect(() => {
    if (props.auth.isAuthenticated) {
      const role =
        props.auth.users.role || props.auth.users.roles?.[0];
      if (role === "ADMIN") {
        history.push("/services");
      } else if (role === "USER") {
        history.push("/my-training");
      }
    }
    if (props.errors) {
      setErrors(props.errors);
    }
    if (props.errors && props.errors.message === "Please verify your email address to log in.") {
      setShowVerifyModal(true);
    }
  }, [props.auth.isAuthenticated, props.auth.users, props.errors, history]);

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    // TODO: Replace with real API call
    setTimeout(() => {
      setResendLoading(false);
      setResendSuccess(true);
    }, 1200);
  };

  return (
    <div>
      <NavBar />
      <div className={`auth-wrapper ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
        <div className="auth-contentcontainer">
          <div className="card">
            <div className="row align-items-center">
              <div className="col-md-12">
                <div className="card-body">
                  <h4 className="mb-3 f-w-400">Login to your account</h4>

                  <form noValidate onSubmit={onSubmit}>
                    <div className="input-group mb-2">
                      <div className="input-group-prepend">
                        <span className="input-group-text">✉</span>
                      </div>
                      <input
                        name="email"
                        type="email"
                        className={classnames("form-control", {
                          "is-invalid": errors.email,
                        })}
                        placeholder="Email address"
                        value={email}
                        onChange={onChange}
                        error={errors.email}
                      />
                      {errors.email && (
                        <div className="invalid-feedback">{errors.email}</div>
                      )}
                    </div>
                    
                    <div className="input-group mb-3">
                      <div className="input-group-prepend">
                        <span className="input-group-text">✔</span>
                      </div>
                      <input
                        name="password"
                        type="password"
                        className={classnames("form-control", {
                          "is-invalid": errors.password,
                        })}
                        placeholder="Password"
                        value={password}
                        onChange={onChange}
                      />
                      {errors.password && (
                        <div className="invalid-feedback">
                          {errors.password}
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group mt-2" style={{ display:'flex', alignItems:'center' }}>
                      <label style={{ display:'flex', alignItems:'center', cursor:'pointer', gap:'10px', margin:0 }}>
                        <input
                          type="checkbox"
                          id="remember-me"
                          checked={checkbox1}
                          onChange={(e) => setCheckbox1(e.target.checked)}
                          style={{ display: 'none' }}
                        />
                        <span style={{
                          width: '40px',
                          height: '22px',
                          background: checkbox1 ? '#4680ff' : '#e0e0e0',
                          borderRadius: '22px',
                          position: 'relative',
                          transition: 'background 0.2s',
                          display: 'inline-block',
                          verticalAlign: 'middle',
                        }}>
                          <span style={{
                            position: 'absolute',
                            left: checkbox1 ? '20px' : '2px',
                            top: '3px',
                            width: '16px',
                            height: '16px',
                            background: '#fff',
                            borderRadius: '50%',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                            transition: 'left 0.2s',
                          }}></span>
                        </span>
                        Remember me
                      </label>
                    </div>
                    
                    <div className="auth-buttons mb-4">
                      <button className="btn btn-primary shadow-2 w-100 mb-2">
                        Login
                      </button>
                      <button 
                        type="button"
                        onClick={handleTransition}
                        className="btn btn-outline-primary w-100"
                      >
                        Sign Up
                      </button>
                    </div>
                    {(errors && (errors.email || errors.password || errors.message || errors.error)) && (
                      <div style={{ color: '#c62828', marginBottom: '1rem', textAlign: 'center' }}>
                        {errors.email && <div>{errors.email}</div>}
                        {errors.password && <div>{errors.password}</div>}
                        {errors.message && <div>{errors.message}</div>}
                        {errors.error && <div>{errors.error}</div>}
                      </div>
                    )}
                  </form>
                  
                  <div className="divider-with-text my-4">
                    <span>Other methods of authorization</span>
                  </div>

                  {/* Social buttons */}
                  <div className="social-buttons">
                    <SocialButtons onSocialClick={handleSocialButtonClick} />
                  </div>

                  <p className="mt-3 text-muted text-center small terms-text">
                    By authorizing, you agree with{' '}
                    <Link to="/privacy-policy" className="text-primary">personal data processing</Link>
                    {' '}and{' '}
                    <Link to="/terms-of-service" className="text-primary">terms of user agreement</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConsentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRegister={handleSocialLogin}
      />
      {showVerifyModal && (
        <Modal onClose={() => setShowVerifyModal(false)}>
          <div style={{ padding: '2.2rem 1.5rem 2rem 1.5rem', maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 22, marginBottom: 18, fontWeight: 600, letterSpacing: 0.2 }}>Email Verification Required</h2>
            <p style={{ marginBottom: 28, color: '#444', fontSize: 16, lineHeight: 1.6 }}>
              Please verify your email address to log in. Check your inbox for a verification link.<br/>
              If you did not receive the email, you can resend it below.
            </p>
            {resendSuccess ? (
              <div style={{ color: '#28a745', marginBottom: 18, fontWeight: 500 }}>Verification email sent!</div>
            ) : null}
            <button
              onClick={handleResendVerification}
              disabled={resendLoading || resendSuccess}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 22,
                padding: '0.7rem 0',
                fontSize: 17,
                fontWeight: 500,
                width: '100%',
                maxWidth: 220,
                margin: '0 auto 14px auto',
                display: 'block',
                cursor: resendLoading || resendSuccess ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(0,123,255,0.08)',
                transition: 'background 0.18s',
                outline: 'none',
              }}
            >
              {resendLoading ? 'Sending...' : resendSuccess ? 'Sent' : 'Resend Email'}
            </button>
            <button
              onClick={() => setShowVerifyModal(false)}
              style={{
                background: 'none',
                color: '#007bff',
                border: 'none',
                fontSize: 16,
                marginTop: 2,
                cursor: 'pointer',
                textDecoration: 'underline',
                width: '100%',
                maxWidth: 220,
                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto',
                padding: 0,
              }}
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Simple captcha modal */}
      <SimpleCaptchaModal
        isOpen={showCaptchaModal}
        onClose={()=>setShowCaptchaModal(false)}
        onSuccess={()=>{}}
      />
    </div>
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  errors: state.errors,
});

export default connect(
  mapStateToProps,
  { loginUser }
)(Login);
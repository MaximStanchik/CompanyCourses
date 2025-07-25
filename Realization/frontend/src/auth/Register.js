// Register.js
import React, { useState, useRef, useEffect } from "react";
import "./style.css";
import classnames from "classnames";
import NavBar from "../components/NavBar";
import { Link, useHistory } from "react-router-dom";
import { connect } from "react-redux";
import { registerUser } from "../actions/authActions";
import SocialButtons from '../components/SocialButtons';
import ConsentModal from '../components/ConsentModal';
import axios from 'axios';
import { Spinner } from 'reactstrap';
// import { useTranslation } from 'react-i18next';

const Register = (props) => {
  // const { t } = useTranslation();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSocialProvider, setSelectedSocialProvider] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const passwordInputRef = useRef(null);
  const popupTimeout = useRef(null);
  const history = useHistory();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
    city: '',
    address: '',
    postalCode: '',
    dateOfBirth: '',
    gender: ''
  });
  const [isChecked, setIsChecked] = useState(false);
  const [touched, setTouched] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState('');

  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (!pwd) return "";
    
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[@$!%*?&#^()_+\-=\\[\\]{};':"\\|,.<>\/?]/.test(pwd)) score++;
    
    if (score <= 2) return "Weak";
    if (score === 3) return "Moderate";
    return "Strong";
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "password") {
      setPassword(value);
      setPasswordStrength(getPasswordStrength(value));
    } else if (name === "username") {
      setUsername(value);
    } else if (name === "email") {
      setEmail(value);
    } else if (name === "confirmPassword") {
      setConfirmPassword(value);
    } else if (name === "name") {
      setName(value);
    } else if (name === "firstName") {
      setFormData({ ...formData, firstName: value });
    } else if (name === "lastName") {
      setFormData({ ...formData, lastName: value });
    } else if (name === "phone") {
      setFormData({ ...formData, phone: value });
    } else if (name === "country") {
      setFormData({ ...formData, country: value });
    } else if (name === "city") {
      setFormData({ ...formData, city: value });
    } else if (name === "address") {
      setFormData({ ...formData, address: value });
    } else if (name === "postalCode") {
      setFormData({ ...formData, postalCode: value });
    } else if (name === "dateOfBirth") {
      setFormData({ ...formData, dateOfBirth: value });
    } else if (name === "gender") {
      setFormData({ ...formData, gender: value });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if(isSubmitting) return;
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords must match" });
      return;
    }
    setIsSubmitting(true);
    const newUser = {
      email: email,
      password: password,
      confirmPassword: confirmPassword,
      username: username,
      name: name,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      country: formData.country,
      city: formData.city,
      address: formData.address,
      postalCode: formData.postalCode,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender
    };
    await props.registerUser(newUser, history);
    setIsSubmitting(false);
  };

  // Обработчик для клика по кнопкам социальных сетей
  const handleSocialButtonClick = (provider) => {
    setSelectedSocialProvider(provider);
    setIsModalOpen(true);
  };

  // Логика регистрации/входа через соцсеть после согласия
  const handleSocialLogin = async () => {
    setIsModalOpen(false); // Закрыть модальное окно
    setErrors({}); // Очистить предыдущие ошибки

    try {
      // Здесь будет логика для вашего бэкенда для социальной аутентификации
      // Предполагаем, что ваш бэкенд имеет эндпоинт для каждого провайдера
      let response;
      switch (selectedSocialProvider) {
        case 'google':
          response = await axios.get('/auth/social/google'); // Пример
          break;
        case 'github':
          response = await axios.get('/auth/social/github'); // Пример
          break;
        // Добавьте другие провайдеры по необходимости
        default:
          setErrors({ social: 'Неизвестный провайдер социальной сети' });
          return;
      }
      
      // Обработка успешного ответа от бэкенда
      console.log('Успешный вход через социальную сеть:', response.data);
      history.push('/dashboard'); // Перенаправить на dashboard

    } catch (err) {
      setErrors({ social: 'Ошибка входа через социальную сеть: ' + (err.response?.data?.message || err.message) });
      console.error('Ошибка входа через социальную сеть:', err.response?.data || err.message);
    }
  };

  const handlePasswordFocus = () => {
    clearTimeout(popupTimeout.current);
    setShowPasswordPopup(true);
  };
  const handlePasswordBlur = () => {
    // Delay hiding to allow click inside popup if needed
    popupTimeout.current = setTimeout(() => setShowPasswordPopup(false), 120);
  };
  // Hide popup on click outside
  useEffect(() => {
    if (!showPasswordPopup) return;
    function handleClickOutside(e) {
      if (
        passwordInputRef.current &&
        !passwordInputRef.current.contains(e.target)
      ) {
        setShowPasswordPopup(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPasswordPopup]);

  useEffect(() => {
    if (props.errors) {
      setErrors(props.errors);
    }
  }, [props.errors]);

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };

  return (
    <div>
      <NavBar />
      <div className="auth-wrapper" style={{position:'relative'}}>
        <div className="auth-contentcontainer">
          <div className="card">
            <div className="row align-items-center">
              <div className="col-md-12">
                <div className="card-body">
                  <h4 className="mb-3 f-w-400">Signup into your account</h4>

                  <form onSubmit={onSubmit}>
                    {/* Username */}
                    <div className="input-group mb-2">
                      <div className="input-group-prepend">
                        <span className="input-group-text">☺</span>
                      </div>
                      <input
                        type="text"
                        name="username"
                        className={classnames("form-control", { "is-invalid": errors.username })}
                        placeholder="Username"
                        value={username}
                        onChange={onChange}
                      />
                      {errors.username && (
                        <div className="invalid-feedback">{errors.username}</div>
                      )}
                    </div>
                    
                    {/* Email */}
                    <div className="input-group mb-2">
                      <div className="input-group-prepend">
                        <span className="input-group-text">✉</span>
                      </div>
                      <input
                        type="email"
                        name="email"
                        className={classnames("form-control", {
                          "is-invalid": errors.email,
                        })}
                        placeholder="Email address"
                        value={email}
                        onChange={onChange}
                      />
                      {errors.email && (
                        <div className="invalid-feedback">{errors.email}</div>
                      )}
                    </div>
                    
                    {/* Password */}
                    <div className="input-group mb-2">
                      <div className="input-group-prepend">
                        <span className="input-group-text">✔</span>
                      </div>
                      <input
                        type="password"
                        name="password"
                        className={classnames("form-control", {
                          "is-invalid": errors.password,
                        })}
                        placeholder="Password"
                        value={password}
                        onChange={onChange}
                      />
                      {errors.password && (
                        <div className="invalid-feedback">{errors.password}</div>
                      )}
                    </div>
                    
                    {/* Password strength */}
                    {password && (
                      <div className="mb-2">
                        <div
                          className={classnames("password-strength-bar", {
                            weak: passwordStrength === "Weak",
                            fair: passwordStrength === "Moderate",
                            good: passwordStrength === "Strong",
                            strong: passwordStrength === "Strong",
                          })}
                        />
                        <small className="text-muted">
                          {passwordStrength === "Weak" && "Weak - Your password is too easy to guess."}
                          {passwordStrength === "Moderate" && "Moderate - Almost there."}
                          {passwordStrength === "Strong" && "Strong - you did it!"}
                          {!passwordStrength && "* at least 8 characters, including a number"}
                        </small>
                      </div>
                    )}
                    
                    {/* Confirm password */}
                    <div className="input-group mb-3">
                      <div className="input-group-prepend">
                        <span className="input-group-text">☑</span>
                      </div>
                      <input
                        type="password"
                        name="confirmPassword"
                        className={classnames("form-control", {
                          "is-invalid": errors.confirmPassword,
                        })}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={onChange}
                      />
                      {errors.confirmPassword && (
                        <div className="invalid-feedback">{errors.confirmPassword}</div>
                      )}
                    </div>
                    
                    <div className="auth-buttons mb-4">
                      <button type="submit" className="btn btn-primary shadow-2 w-100 mb-2">
                        Sign Up
                      </button>
                      <a href={`${process.env.PUBLIC_URL}/login/`} className="btn btn-outline-primary w-100">
                        Login
                      </a>
                    </div>
                  </form>
                  
                  <div className="divider-with-text my-4">
                    <span>Other methods of authorization</span>
                  </div>

                  {/* Social buttons */}
                  <div className="social-buttons">
                    <SocialButtons onSocialClick={handleSocialButtonClick} />
                  </div>
                  
                  <p className="mt-3 text-muted text-center small">
                    By registering, you accept the{' '}
                    <Link to="/terms-of-service" className="text-primary">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy-policy" className="text-primary">Privacy Policy</Link>
                    {' '}of CompanyCourses LLC. You also agree to comply with our{' '}
                    <Link to="/license-agreement" className="text-primary">License Agreement</Link>
                    {' '}which governs the use of our educational platform and its content.
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

      {isSubmitting && (
        <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'rgba(255,255,255,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <Spinner style={{width:'3rem',height:'3rem'}} color="primary" />
        </div>
      )}
    </div>
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  errors: state.errors,
});

export default connect(mapStateToProps, { registerUser })(Register);
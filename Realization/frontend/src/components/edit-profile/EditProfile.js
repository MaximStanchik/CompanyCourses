import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import _ from 'lodash'; 
import TextFieldGroup from '../common/TextFieldGroup';
import SelectListGroup from '../common/SelectListGroup';
import { GET_ERRORS } from "../../actions/types";
import { createProfile, getCurrentProfile, clearCurrentProfile, deleteAccount } from '../../actions/profileActions';
import Cropper from 'react-easy-crop';
import { FaUpload } from 'react-icons/fa';
import Footer from '../Footer';
import NavBar from '../NavBar';
import i18n from '../../i18n';
import useTheme from '../../hooks/useTheme';
const t = i18n.t.bind(i18n);

async function sendExternalIpToBackend(ip) {
  const token = localStorage.getItem('jwtToken');
  await fetch('/profile/update-ip', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ip }),
  });
}

class EditProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displaySocialInputs: false,
      username: "",
      name: "",
      surname: "",
      additionalName: "",
      skills: "",
      githubusername: "",
      bio: "",
      jobTitle: "",
      city: "",
      country: "",
      goal: "",
      company: "",
      position: "",
      status: "",
      errors: {},
      showAvatarModal: false,
      avatarSrc: null,
      crop: { x: 0, y: 0 },
      zoom: 2,
      croppedAreaPixels: null,
      activeTab: 'profile',
      showPasswordModal: false,
      passwordFields: {
        current: '',
        new: '',
        repeat: ''
      },
      passwordError: '',
      currentError: '',
      newError: '',
      repeatError: '',
      lastActivity: null,
      avatar: null,
      passwordStrength: '',
      isAuthenticated: false,
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.onAvatarClick = this.onAvatarClick.bind(this);
    this.onAvatarClose = this.onAvatarClose.bind(this);
    this.onCropChange = this.onCropChange.bind(this);
    this.onZoomChange = this.onZoomChange.bind(this);
    this.onCropComplete = this.onCropComplete.bind(this);
    this.onChooseImage = this.onChooseImage.bind(this);
    this.onSaveCropped = this.onSaveCropped.bind(this);
    this.avatarModalRef = React.createRef();
    this.handleModalClick = this.handleModalClick.bind(this);
    this.handleTabChange = this.handleTabChange.bind(this);
    this.openPasswordModal = this.openPasswordModal.bind(this);
    this.closePasswordModal = this.closePasswordModal.bind(this);
    this.handlePasswordField = this.handlePasswordField.bind(this);
    this.handleToggleAccount = this.handleToggleAccount.bind(this);
    this.handleSavePassword = this.handleSavePassword.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }

  async componentDidMount() {
    // Проверяем авторизацию
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      // Если пользователь не авторизован, показываем сообщение о необходимости входа
      this.setState({
        isAuthenticated: false
      });
      return;
    }

    this.setState({
      isAuthenticated: true
    });

    this.props.getCurrentProfile();
    // Очистка ошибок при монтировании
    this.props.dispatch({ type: GET_ERRORS, payload: {} });
    if (this.props.location.state && this.props.location.state.username) {
      this.setState({ username: this.props.location.state.username });
    }
    // Получаем внешний IP и отправляем на backend
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      if (data && data.ip) {
        await sendExternalIpToBackend(data.ip);
      }
    } catch (e) {
      // ignore
    }
    this.setState({ zoom: 2 });
  }

  componentWillUnmount() {
    this.props.clearCurrentProfile();
    this.props.clearErrors && this.props.clearErrors(); 
  }

  componentDidUpdate(prevProps) {
    if (prevProps.errors !== this.props.errors && this.props.errors) {
      this.setState({ errors: this.props.errors });
    }

    if (prevProps.profile.profile !== this.props.profile.profile && this.props.profile.profile) {
      const profile = this.props.profile.profile;
      const skillsCSV = Array.isArray(profile.skills) ? profile.skills.join(",") : "";
      // lastActivity из user
      const user = profile.user || {};
      const lastActivity = user.lastActivityTime ? {
        device: user.lastDevice,
        os: user.lastOS,
        ip: user.lastIP,
        country: user.lastCountry,
        browser: user.lastBrowser,
        time: getTimeAgo(user.lastActivityTime),
        deviceType: user.lastDevice,
        osType: user.lastOS,
        browserType: user.lastBrowser,
      } : null;
      this.setState({
        handle: profile.handle || "",
        username: user.username || "",
        name: profile.name || "",
        surname: profile.surname || "",
        additionalName: profile.additionalName || "",
        skills: skillsCSV,
        githubusername: profile.githubusername || "",
        bio: profile.bio || "",
        jobTitle: profile.jobTitle || "",
        city: profile.city || "",
        country: profile.country || "",
        goal: profile.goal || "",
        company: profile.company || "",
        position: profile.position || "",
        status: profile.status || "",
        lastActivity,
        avatar: typeof user.avatar === 'string' ? user.avatar : null,
      });
    }
  }

  async checkUsernameAvailability(username) {
    if (username.length < 3) return;

    try {
      const token = localStorage.getItem("jwtToken");
      const res = await axios.get(`/profile/check-username/${username}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.exists) {
        this.setState({
          errors: { ...this.state.errors, username: "Username is already taken (last saved valid username selected)" },
        });
      } else {
        this.setState({
          errors: { ...this.state.errors, username: "" },
        });
      }
    } catch (err) {
      console.error("Error checking username:", err);
    }
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value }, () => {
      if (e.target.name === "username") {
        this.checkUsernameAvailability(e.target.value);
      }
    });
  }

  onSubmit(e) {
    e.preventDefault();

    if (!this.state.username) {
      this.setState({ errors: { username: "Username is required" } });
      return;
    }

    const profileData = {
      username: this.state.username,
      name: this.state.name,
      surname: this.state.surname,
      additionalName: this.state.additionalName,
      skills: this.state.skills,
      githubusername: this.state.githubusername,
      bio: this.state.bio,
      jobTitle: this.state.jobTitle,
      city: this.state.city,
      country: this.state.country,
      goal: this.state.goal,
      company: this.state.company,
      position: this.state.position,
      status: this.state.status,
    };

    this.props.createProfile(profileData, this.props.history);
  }

  handleDelete() {
    this.props.deleteAccount();
  }

  onAvatarClick() {
    this.setState({ showAvatarModal: true });
  }

  onAvatarClose() {
    this.setState({ showAvatarModal: false, avatarSrc: null, crop: { x: 0, y: 0 }, zoom: 1 });
  }

  onCropChange(crop) {
    this.setState({ crop });
  }

  onZoomChange(zoom) {
    this.setState({ zoom });
  }

  onCropComplete(_, croppedAreaPixels) {
    this.setState({ croppedAreaPixels });
  }

  onChooseImage(e) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 5MB');
        return;
      }
      
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        return;
      }
      
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (typeof reader.result === 'string') {
          this.setState({ avatarSrc: reader.result, crop: { x: 0, y: 0 }, zoom: 1 });
        } else {
          this.setState({ avatarSrc: null });
        }
      });
      reader.readAsDataURL(file);
    } else {
      this.setState({ avatarSrc: null });
    }
  }

  handleModalClick(e) {
    if (this.avatarModalRef.current && !this.avatarModalRef.current.contains(e.target)) {
      this.setState({ showAvatarModal: false });
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 5MB');
        return;
      }
      
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        return;
      }
      
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (typeof reader.result === 'string') {
          this.setState({ avatarSrc: reader.result, crop: { x: 0, y: 0 }, zoom: 1 });
        } else {
          this.setState({ avatarSrc: null });
        }
      });
      reader.readAsDataURL(file);
    }
  }

  async onSaveCropped() {
    if (!this.state.avatarSrc) {
      alert('Сначала выберите изображение');
      return;
    }

    try {
      // Создаем blob из base64 изображения
      const response = await fetch(this.state.avatarSrc);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');
      
      const token = localStorage.getItem('jwtToken');
      const res = await fetch('/profile/avatar-user', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      const data = await res.json();
      if (data.avatar && typeof data.avatar === 'string') {
        this.setState({ avatar: data.avatar, showAvatarModal: false, avatarSrc: null });
        alert('Аватарка успешно загружена!');
      } else {
        alert('Ошибка при загрузке аватарки');
      }
    } catch (error) {
      console.error('Ошибка при сохранении аватарки:', error);
      alert('Ошибка при сохранении аватарки');
    }
  }

  handleTabChange(tab) {
    this.setState({ activeTab: tab });
  }

  openPasswordModal() {
    this.setState({ showPasswordModal: true, passwordFields: { current: '', new: '', repeat: '' }, passwordError: '' });
  }
  closePasswordModal() {
    this.setState({ showPasswordModal: false, passwordError: '' });
  }
  handlePasswordField(e) {
    const { name, value } = e.target;
    this.setState(prev => {
      let passwordError = prev.passwordError;
      let passwordFields = { ...prev.passwordFields, [name]: value };
      let update = { passwordFields };
      // Шкала сложности для нового пароля
      if (name === 'new') {
        update.passwordStrength = this.getPasswordStrength(value);
      }
      // Сброс ошибки текущего пароля при изменении
      if (name === 'current') update.currentError = '';
      return update;
    });
  }
  async handleSavePassword(e) {
    e.preventDefault();
    const { current, new: newPassword, repeat } = this.state.passwordFields;
    let currentError = '', newError = '', repeatError = '', passwordError = '';
    // 1. Проверка: введён ли текущий пароль
    if (!current) {
      this.setState({ currentError: t('profile.enter_current_password'), newError: '', repeatError: '', passwordError: '' });
      return;
    }
    // 2. Проверка: правильный ли текущий пароль (отправляем только current)
    try {
      const token = localStorage.getItem('jwtToken');
      await axios.post('/profile/change-password', {
        currentPassword: current,
        newPassword: '___dummy___' // dummy, не используется
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      const msg = err.response?.data?.error || t('profile.error_changing_password');
      // Если ошибка именно про неверный текущий пароль, выводим под полем current
      if (msg === t('profile.current_password_wrong') || /пароль неверный|password is incorrect|current password is wrong/i.test(msg)) {
        this.setState({ currentError: msg, newError: '', repeatError: '', passwordError: '' });
      } else {
        this.setState({ passwordError: msg });
      }
      return;
    }
    // 3. Проверка: введён ли новый пароль
    if (!newPassword) {
      this.setState({ currentError: '', newError: t('profile.enter_new_password'), repeatError: '', passwordError: '' });
      return;
    }
    // 4. Проверка: соответствует ли новый пароль требованиям
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[a-z]/.test(newPassword)) score++;
    if (/\d/.test(newPassword)) score++;
    if (/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) score++;
    if (score < 3) {
      this.setState({ currentError: '', newError: t('profile.password_too_simple'), repeatError: '', passwordError: '' });   
      return;
    }
    // 5. Проверка: введён ли повторный пароль
    if (!repeat) {
      this.setState({ currentError: '', newError: '', repeatError: t('profile.repeat_new_password'), passwordError: '' });
      return;
    }
    // 6. Проверка: совпадают ли пароли
    if (newPassword !== repeat) {
      this.setState({ currentError: '', newError: '', repeatError: t('profile.passwords_do_not_match'), passwordError: '' });
      return;
    }
    // Всё ок — меняем пароль
    try {
      const token = localStorage.getItem('jwtToken');
      const res = await axios.post('/profile/change-password', {
        currentPassword: current,
        newPassword: newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        this.setState({ showPasswordModal: false, passwordError: '', passwordFields: { current: '', new: '', repeat: '' }, currentError: '', newError: '', repeatError: '', passwordStrength: '' });
        alert(t('profile.success_password_changed'));
      }
    } catch (err) {
      const msg = err.response?.data?.error || t('profile.error_changing_password');
      this.setState({ passwordError: msg });
    }
  }
  handleToggleAccount(name) {
    this.setState(prev => ({ connectedAccounts: { ...prev.connectedAccounts, [name]: !prev.connectedAccounts[name] } }));
  }



  renderProfileForm(errors, jobOptions, goalOptions) {
    // Проверка на наличие ошибок о ненормативной лексике
    const profanityFields = [
      'username', 'name', 'surname', 'additionalName', 'bio', 'city', 'country', 'company', 'position', 'status', 'githubusername', 'skills'
    ];
    const hasProfanity = profanityFields.some(f => errors[f] && errors[f].toLowerCase().includes('недопустим') || errors[f] && errors[f].toLowerCase().includes('profan'));
    return (
      <>
        {hasProfanity && (
          <div className="alert alert-danger" style={{ fontWeight: 500, fontSize: 15, marginBottom: 18 }}>
            {t('profile.profanity_warning')}
          </div>
        )}
        <div className="d-flex flex-column align-items-center mb-4">
          <div style={{ 
            width: 100, 
            height: 100, 
            borderRadius: '50%', 
            background: '#d3dbe6', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: 16, 
            cursor: 'pointer', 
            overflow: 'hidden', 
            position: 'relative',
            border: '3px solid #fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s ease'
          }} 
          onClick={this.onAvatarClick}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          onDragOver={this.handleDragOver}
          onDrop={this.handleDrop}
          >
            {(() => {
              const isValidImg = v => typeof v === 'string' && (v.startsWith('data:image') || v.startsWith('http') || v.startsWith('/'));
              const avatar = this.state.avatar;
              const avatarSrc = this.state.avatarSrc;
              
              if (isValidImg(avatar)) {
                return (
                  <img
                    src={avatar}
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                );
              } else if (isValidImg(avatarSrc)) {
                return (
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                );
              } else {
                return (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
                    {t('profile.no_image')}
                  </div>
                );
              }
            })()}
            <div style={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0,
              right: 0,
              background: 'rgba(0,0,0,0.7)', 
              color: '#fff', 
              fontSize: 12, 
              textAlign: 'center',
              padding: '4px 0',
              fontWeight: '500'
            }}>
              {this.state.avatar ? 'Изменить' : 'Добавить'}
            </div>
          </div>
          <h4 className="mb-0" style={{ fontWeight: 600 }}>{this.state.username || 'Anonymous'}</h4>
          <small className="text-muted">{t('profile.profile_settings')}</small>
        </div>
        <form onSubmit={this.onSubmit}>
          <div className="row">
            <div className="col-12 mb-3">
              <TextFieldGroup
                placeholder={"* Username"}
                name="username"
                value={this.state.username || ""}
                onChange={this.onChange}
                error={errors.username}
                info={t('profile.ed_unique_username')}
              />
            </div>
            <div className="col-6 mb-3">
              <TextFieldGroup
                placeholder={t('profile.ed_first_name')}
                name="name"
                value={this.state.name}
                onChange={this.onChange}
                error={errors.name}
                info={t('profile.ed_first_name')}
              />
            </div>
            <div className="col-6 mb-3">
              <TextFieldGroup
                placeholder={t('profile.ed_last_name')}
                name="surname"
                value={this.state.surname}
                onChange={this.onChange}
                error={errors.surname}
                info={t('profile.ed_last_name')}
              />
            </div>
            <div className="col-12 mb-3">
              <TextFieldGroup
                placeholder={t('profile.ed_additional_names')}
                name="additionalName"
                value={this.state.additionalName}
                onChange={this.onChange}
                error={errors.additionalName}
                info={t('profile.ed_additional_names')}
              />
            </div>
            <div className="col-12 mb-3">
              <TextFieldGroup
                placeholder={t('profile.ed_skills_info')}
                name="skills"
                value={this.state.skills}
                onChange={this.onChange}
                error={errors.skills}
                info={t('profile.ed_skills_info')}
              />
            </div>
            <div className="col-12 mb-3">
              <TextFieldGroup
                placeholder={t('profile.ed_github_username')}
                name="githubusername"
                value={this.state.githubusername}
                onChange={this.onChange}
                error={errors.githubusername}
                info={t('profile.ed_github_username')}
              />
            </div>
            <div className="col-12 mb-3">
              <TextFieldGroup
                placeholder={t('profile.ed_bio')}
                name="bio"
                value={this.state.bio}
                onChange={this.onChange}
                error={errors.bio}
                info={t('profile.ed_bio')}
              />
            </div>
            <div className="col-12 mb-3">
              <SelectListGroup
                name="jobTitle"
                value={this.state.jobTitle}
                onChange={this.onChange}
                options={jobOptions}
                error={errors.jobTitle}
                info={t('profile.ed_job_title')}
              />
            </div>
            <div className="col-12 mb-3">
              <SelectListGroup
                name="goal"
                value={this.state.goal}
                onChange={this.onChange}
                options={goalOptions}
                error={errors.goal}
                info={t('profile.ed_goal')}
              />
            </div>
            <div className="col-6 mb-3">
              <TextFieldGroup
                placeholder={t('profile.ed_city')}
                name="city"
                value={this.state.city}
                onChange={this.onChange}
                error={errors.city}
                info={t('profile.ed_city')}
              />
            </div>
            <div className="col-6 mb-3">
              <TextFieldGroup
                placeholder={t('profile.ed_country')}
                name="country"
                value={this.state.country}
                onChange={this.onChange}
                error={errors.country}
                info={t('profile.ed_country')}
              />
            </div>
            <div className="col-6 mb-3">
              <TextFieldGroup
                placeholder={t('profile.ed_company')}
                name="company"
                value={this.state.company}
                onChange={this.onChange}
                error={errors.company}
                info={t('profile.ed_company')}
              />
            </div>
            <div className="col-6 mb-3">
              <TextFieldGroup
                placeholder={t('profile.ed_position')}
                name="position"
                value={this.state.position}
                onChange={this.onChange}
                error={errors.position}
                info={t('profile.ed_position')}
              />
            </div>
            <div className="col-12 mb-3">
              <TextFieldGroup
                placeholder={t('profile.ed_status')}
                name="status"
                value={this.state.status}
                onChange={this.onChange}
                error={errors.status}
                info={t('profile.ed_status')}
              />
            </div>
          </div>
          <div className="d-flex flex-column flex-md-row justify-content-center align-items-center mt-4 action-btns" style={{ flexWrap: 'wrap', gap: 16, width: '100%', alignItems: 'center' }}>
            <input type="submit" value={t('profile.save_changes')} className="btn btn-primary btn-lg action-btn" style={{ minWidth: 160, height: 48, margin: 0 }} />
            <button type="button" className="btn btn-danger btn-lg action-btn" style={{ minWidth: 160, height: 48, margin: 0 }} onClick={this.handleDelete}>
              {t('profile.delete_profile')}
            </button>
          </div>
        </form>
      </>
    );
  }

  renderSecurityForms() {
    const { showPasswordModal, passwordFields, connectedAccounts, passwordError } = this.state;
    const isPasswordValid = passwordFields.new && passwordFields.new.length >= 6 && passwordFields.new === passwordFields.repeat && !passwordError;
    let lastActivity = this.state.lastActivity;
    let isOnline = false;
    let time = lastActivity.time;
    if (this.state.lastActivity && this.props.profile && this.props.profile.profile && this.props.profile.profile.user && this.props.profile.profile.user.lastActivityTime) {
      const last = new Date(this.props.profile.profile.user.lastActivityTime);
      const now = new Date();
      if ((now - last) < 2 * 60 * 1000) {
        isOnline = true;
        time = t('profile.just_now');
      } else {
        isOnline = false;
        time = getTimeAgo(this.props.profile.profile.user.lastActivityTime);
      }
    }
    if (lastActivity) {
      lastActivity = { ...lastActivity, isOnline, time };
    }
    return (
      <>
        <div className="card shadow p-4 mb-4" style={{ borderRadius: 18, background: '#f8fafc', marginBottom: 32 }}>
          <h5 className="mb-4">{t('profile.security')}</h5>
          <div className="row mb-3 align-items-center">
            <div className="col-4">
              <label>{t('profile.email')}</label>
            </div>
            <div className="col-8 d-flex align-items-center">
              <input type="email" className="form-control-plaintext" value={this.props.profile?.profile?.user?.email || ''} disabled style={{ fontWeight: 500, color: '#222' }} />
              <span style={{ color: 'rgb(0, 123, 255)', cursor: 'not-allowed', fontWeight: 500, opacity: 0.7, whiteSpace: 'nowrap', zIndex: 20, position: 'relative', marginLeft: 10 }}>{t('profile.change')}</span>
            </div>
          </div>
          <div className="row mb-3 align-items-center">
            <div className="col-4">
              <label>{t('profile.password')}</label>
            </div>
            <div className="col-8 d-flex align-items-center">
              <input type="password" className="form-control-plaintext" value={"••••••••"} disabled style={{ fontWeight: 500, letterSpacing: 2, color: '#222' }} />
              <span style={{ color: 'rgb(0, 123, 255)', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap', zIndex: 20, position: 'relative', marginLeft: 10 }} onClick={this.openPasswordModal}>{t('profile.change')}</span>
            </div>
          </div>
        </div>
        {lastActivity && (
          <div className="card shadow p-4" style={{ borderRadius: 18, background: '#f8fafc', marginBottom: 0 }}>
            <h5 className="mb-4">{t('profile.last_activity')}</h5>
            <div>
              <div style={{ fontWeight: 500 }}>{lastActivity.os} · {lastActivity.ip} {lastActivity.country}</div>
              <div style={{ color: '#888', fontSize: 15 }}>
                {lastActivity.browser} · {lastActivity.isOnline ? t('profile.just_now') : lastActivity.time}
              </div>
            </div>
          </div>
        )}
        {showPasswordModal && (
          <>
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 99998,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{
                background: '#fff',
                borderRadius: 18,
                padding: 32,
                minWidth: 300,
                maxWidth: 400,
                width: '100%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                position: 'relative',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'auto',
                margin: 0,
              }}>
                <h5 className="mb-4">{t('profile.change_password')}</h5>
                <form onSubmit={this.handleSavePassword} autoComplete="off" style={{ width: '100%' }}>
                  <div className="mb-3">
                    <label className="form-label">{t('profile.current_password')}</label>
                    <input type="password" className="form-control" name="current" value={passwordFields.current} onChange={this.handlePasswordField} autoFocus />
                    {this.state.currentError && <div className="text-danger mt-1" style={{ fontSize: 13 }}>{this.state.currentError}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t('profile.new_password')}</label>
                    <input type="password" className="form-control" name="new" value={passwordFields.new} onChange={this.handlePasswordField} />
                    {/* Шкала сложности пароля */}
                    {passwordFields.new && (
                      <div className="mb-2">
                        <div
                          className={
                            'password-strength-bar ' +
                            (this.state.passwordStrength === 'Weak' ? 'weak' : this.state.passwordStrength === 'Moderate' ? 'moderate' : this.state.passwordStrength === 'Strong' ? 'strong' : '')
                          }
                          style={{ height: 6, borderRadius: 4, marginTop: 4, marginBottom: 2, background: '#eee', width: '100%' }}
                        >
                          <div style={{
                            width: this.state.passwordStrength === 'Weak' ? '33%' : this.state.passwordStrength === 'Moderate' ? '66%' : this.state.passwordStrength === 'Strong' ? '100%' : '0%',
                            height: '100%',
                            background: this.state.passwordStrength === 'Weak' ? '#e57373' : this.state.passwordStrength === 'Moderate' ? '#ffd54f' : this.state.passwordStrength === 'Strong' ? '#81c784' : 'transparent',
                            borderRadius: 4,
                            transition: 'width 0.3s'
                          }} />
                        </div>
                        <small className="text-muted">
                          {this.state.passwordStrength === 'Weak' && t('profile.password_strength_weak')}
                          {this.state.passwordStrength === 'Moderate' && t('profile.password_strength_moderate')}
                          {this.state.passwordStrength === 'Strong' && t('profile.password_strength_strong')}
                          {!this.state.passwordStrength && `* ${t('profile.password_minimum')}`}
                        </small>
                      </div>
                    )}
                    {this.state.newError && <div className="text-danger mt-1" style={{ fontSize: 13 }}>{this.state.newError}</div>}
                  </div>
                  <div className="mb-4">
                    <label className="form-label">{t('profile.repeat_new_password')}</label>
                    <input type="password" className="form-control" name="repeat" value={passwordFields.repeat} onChange={this.handlePasswordField} />
                    {this.state.repeatError && <div className="text-danger mt-1" style={{ fontSize: 13 }}>{this.state.repeatError}</div>}
                  </div>
                  {this.state.passwordError &&
                    !/пароль неверный|password is incorrect|current password is wrong/i.test(this.state.passwordError) && (
                      <div className="alert alert-danger py-2 mb-3">{this.state.passwordError}</div>
                    )}
                  <div className="d-flex justify-content-center gap-3 mt-3" style={{ width: '100%' }}>
                    <button
                      type="button"
                      className="btn btn-outline-secondary modal-btn"
                      style={{ minWidth: 160, maxWidth: 220, height: 44, fontSize: 16, flex: 1, borderRadius: 24, padding: 0, textAlign: 'center', margin: 0 }}
                      onClick={this.closePasswordModal}
                    >
                      {t('profile.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary modal-btn"
                      style={{ minWidth: 160, maxWidth: 220, height: 44, fontSize: 16, flex: 1, borderRadius: 24, padding: 0, textAlign: 'center', margin: 0 }}
                    >
                      {t('profile.save_changes')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  render() {
    const { errors } = this.state;
    
    // Проверяем авторизацию
    if (!this.state.isAuthenticated) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          background: '#f8f9fa',
          color: '#333333'
        }}>
          <NavBar />
          
          <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto', 
            padding: '40px 20px',
            minHeight: 'calc(100vh - 200px)'
          }}>
            {/* Заголовок */}
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '40px' 
            }}>
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: '700', 
                marginBottom: '10px',
                color: '#333333'
              }}>
                Редактирование профиля
              </h1>
              <p style={{ 
                fontSize: '1.1rem', 
                color: '#666666'
              }}>
                Войдите в систему, чтобы редактировать профиль
              </p>
            </div>

            {/* Карточка для входа */}
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{ 
                fontSize: '1.3rem', 
                fontWeight: '600', 
                marginBottom: '10px',
                color: '#333333'
              }}>
                Войдите в систему
              </h3>
              <p style={{ 
                color: '#666666',
                marginBottom: '30px'
              }}>
                Чтобы редактировать свой профиль, необходимо войти в систему или зарегистрироваться
              </p>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '15px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => window.location.href = '/login'}
                  style={{
                    padding: '12px 24px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#0056b3'}
                  onMouseOut={(e) => e.target.style.background = '#007bff'}
                >
                  Войти
                </button>
                <button
                  onClick={() => window.location.href = '/register'}
                  style={{
                    padding: '12px 24px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#218838'}
                  onMouseOut={(e) => e.target.style.background = '#28a745'}
                >
                  Зарегистрироваться
                </button>
              </div>
            </div>
          </div>

          <Footer />
        </div>
      );
    }
    
    // Получаем текущую тему
    const darkTheme = document.body.classList.contains('dark-theme') || 
                     localStorage.getItem('theme') === 'dark' ||
                     (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    const theme = darkTheme ? 'dark' : 'light';
    const pageBg = theme === 'dark' ? '#1a1a1a' : '#f8f9fa';
    const cardBg = theme === 'dark' ? '#2d2d2d' : '#ffffff';
    const textColor = theme === 'dark' ? '#ffffff' : '#333333';
    const secondaryTextColor = theme === 'dark' ? '#cccccc' : '#666666';
    const borderColor = theme === 'dark' ? '#404040' : '#e9ecef';

    const jobTitles = [
      { key: 'back_end', value: 'Back End Developer/Engineer' },
      { key: 'data_scientist', value: 'Data Scientist' },
      { key: 'technology_consultant', value: 'Technology Consultant' },
      { key: 'machine_learning_engineer', value: 'Machine Learning Engineer' },
      { key: 'product_manager', value: 'Product Manager' },
      { key: 'business_management_analyst', value: 'Business/Management Analyst' },
      { key: 'data_warehouse_developer', value: 'Data Warehouse Developer' },
      { key: 'cyber_security_engineer', value: 'Cyber Security Engineer' },
      { key: 'video_game_developer', value: 'Video Game Developer' },
      { key: 'data_architect', value: 'Data Architect' },
      { key: 'marketing_analytics_specialist', value: 'Marketing Analytics Specialist' },
      { key: 'logistics_supply_chain_analyst', value: 'Logistics/Supply Chain Analyst' },
      { key: 'it_project_manager', value: 'IT Project Manager' },
      { key: 'business_intelligence_analyst', value: 'Business Intelligence Analyst' },
      { key: 'data_analyst', value: 'Data Analyst' },
      { key: 'statistician', value: 'Statistician' },
      { key: 'mainframe_developer', value: 'Mainframe Developer' },
      { key: 'project_manager', value: 'Project Manager' },
      { key: 'business_analyst_general', value: 'Business Analyst (general)' },
      { key: 'tax_analyst_specialist', value: 'Tax Analyst/Specialist' },
      { key: 'automation_engineer', value: 'Automation Engineer' },
      { key: 'cyber_information_security_engineer_analyst', value: 'Cyber/Information Security Engineer/Analyst' },
      { key: 'real_estate_agent', value: 'Real Estate Agent' },
      { key: 'technical_support_engineer_analyst', value: 'Technical Support Engineer/Analyst' },
      { key: 'social_media_strategist_specialist', value: 'Social Media Strategist/Specialist' },
      { key: 'ui_ux_manager', value: 'UI/UX Manager' },
      { key: 'data_engineer', value: 'Data Engineer' },
      { key: 'ios_developer_engineer', value: 'iOS Developer/Engineer' },
      { key: 'cloud_architect', value: 'Cloud Architect' },
      { key: 'sales_representative', value: 'Sales Representative' },
      { key: 'human_resources_specialist', value: 'Human Resources Specialist' },
      { key: 'scrum_master', value: 'Scrum Master' },
      { key: 'full_stack_developer', value: 'Full Stack Developer' },
      { key: 'sales_development_representative', value: 'Sales Development Representative' },
      { key: 'digital_marketing_specialist', value: 'Digital Marketing Specialist' },
      { key: 'bookkeeper_accounting_clerk', value: 'Bookkeeper / Accounting Clerk' },
      { key: 'solutions_application_architect', value: 'Solutions/Application Architect' },
      { key: 'network_systems_administrator', value: 'Network/Systems Administrator' },
      { key: 'customer_service_representative', value: 'Customer Service Representative' },
      { key: 'front_end_developer', value: 'Front End Developer' },
      { key: 'application_developer_engineer', value: 'Application Developer/Engineer' },
      { key: 'network_engineer_architect', value: 'Network Engineer/Architect' },
      { key: 'cyber_security_specialist_technician', value: 'Cyber Security Specialist/Technician' },
      { key: 'actuary', value: 'Actuary' },
      { key: 'devops_engineer', value: 'DevOps Engineer' },
      { key: 'sales_operations_specialist', value: 'Sales Operations Specialist' },
      { key: 'android_developer_engineer', value: 'Android Developer/Engineer' },
      { key: 'risk_consultant', value: 'Risk Consultant' },
      { key: 'computer_support_specialist', value: 'Computer Support Specialist' },
      { key: 'business_intelligence_architect_developer', value: 'Business Intelligence Architect/Developer' },
      { key: 'chief_data_officer', value: 'Chief Data Officer' },
      { key: 'career_counselor', value: 'Career Counselor' },
      { key: 'computer_scientist', value: 'Computer Scientist' },
      { key: 'analytics_manager', value: 'Analytics Manager' },
      { key: 'risk_analyst', value: 'Risk Analyst' },
      { key: 'market_research_analyst', value: 'Market Research Analyst' },
      { key: 'strategic_planner_analyst', value: 'Strategic Planner/Analyst' },
      { key: 'business_management_consultant', value: 'Business/Management Consultant' },
      { key: 'dei_specialist', value: 'Diversity, Equity, and Inclusion Specialist' },
      { key: 'aerospace_engineer', value: 'Aerospace Engineer' },
      { key: 'fraud_examiner_analyst', value: 'Fraud Examiner/Analyst' },
      { key: 'corporate_development_analyst', value: 'Corporate Development Analyst' },
      { key: 'data_data_mining_analyst', value: 'Data/Data Mining Analyst' },
      { key: 'advertising_promotions_manager', value: 'Advertising/Promotions Manager' },
      { key: 'business_program_analyst', value: 'Business Program Analyst' },
      { key: 'program_manager', value: 'Program Manager' },
      { key: 'pricing_analyst', value: 'Pricing Analyst' },
      { key: 'researcher_research_associate', value: 'Researcher/Research Associate' },
      { key: 'marketing_analyst', value: 'Marketing Analyst' },
      { key: 'data_manager', value: 'Data Manager' },
      { key: 'biologist', value: 'Biologist' },
      { key: 'talent_acquisition_recruiting_manager', value: 'Talent Acquisition/Recruiting Manager' },
      { key: 'business_development_manager', value: 'Business Development Manager' },
      { key: 'business_analysis_manager', value: 'Business Analysis Manager' },
      { key: 'sustainability_specialist', value: 'Sustainability Specialist' },
      { key: 'supply_chain_analyst', value: 'Supply Chain Analyst' },
      { key: 'hr_consultant', value: 'Human Resources Consultant' },
      { key: 'e_commerce_analyst', value: 'E-commerce Analyst' },
      { key: 'compensation_benefits_analyst', value: 'Compensation/Benefits Analyst' },
      { key: 'financial_quantitative_analyst', value: 'Financial Quantitative Analyst' },
      { key: 'human_resources_analyst', value: 'Human Resources Analyst' },
      { key: 'project_management_analyst', value: 'Project Management Analyst' },
      { key: 'writer', value: 'Writer' },
      { key: 'director_of_project_management', value: 'Director of Project Management' },
      { key: 'product_development_manager', value: 'Product Development Manager' },
      { key: 'chemical_process_engineer', value: 'Chemical/Process Engineer' },
      { key: 'systems_integration_engineer_specialist', value: 'Systems Integration Engineer/Specialist' },
    ];
    // Для label используем t('jobTitles.'+key) || value
    const jobTitleOptions = jobTitles.map(j => ({ label: t('jobTitles.'+j.key) || j.value, value: j.value }));

    // --- Цели пользователя (goalOptions) ---
    const goalList = [
      { key: 'select', value: 'What is your goal?' },
      { key: 'start_career', value: 'Start a career' },
      { key: 'change_careers', value: 'Change careers' },
      { key: 'improve_current_role', value: 'Improve within your current role' },
      { key: 'explore_unrelated', value: 'Explore topics unrelated to work' },
    ];
    const goalOptions = goalList.map(g => ({ label: t('goals.'+g.key) || g.value, value: g.value }));

    return (
      <div className="edit-profile" style={{ background: (document.body.getAttribute('data-theme')==='dark' || localStorage.getItem('theme')==='dark') ? '#18191c' : '#fff', minHeight: 'calc(100vh - 80px)', paddingTop: 0 }}>
        <NavBar />
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '80vh', flexDirection: 'column', paddingTop: 0, marginTop: 0 }}>
          <div className="d-flex mb-4 tab-btns" style={{ gap: 32, width: 'auto', minWidth: 400, maxWidth: '100%', justifyContent: 'center', alignItems: 'center', marginTop: 21, minHeight: 60, zIndex: 10 }}>
            <button className={`btn tab-btn ${this.state.activeTab === 'profile' ? 'tab-btn-active' : ''}`} onClick={() => this.handleTabChange('profile')}>{t('profile.personal_data')}</button>
            <button className={`btn tab-btn ${this.state.activeTab === 'security' ? 'tab-btn-active' : ''}`} onClick={() => this.handleTabChange('security')}>{t('profile.security_and_login')}</button>
          </div>
          <div className="form-anim-wrapper" key={this.state.activeTab} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <div className="card shadow p-4 form-anim" style={{ maxWidth: 420, width: '100%', borderRadius: 16, margin: '0 auto', background: (document.body.getAttribute('data-theme')==='dark' || localStorage.getItem('theme')==='dark') ? '#2d2d2d' : '#fff', color: (document.body.getAttribute('data-theme')==='dark' || localStorage.getItem('theme')==='dark') ? '#fff' : '#000', border: (document.body.getAttribute('data-theme')==='dark' || localStorage.getItem('theme')==='dark') ? '1px solid #404040' : '1px solid #e9ecef' }}>
              {this.state.activeTab === 'profile'
                ? this.renderProfileForm(errors, jobTitleOptions, goalOptions)
                : this.renderSecurityForms()}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 24 }} />
        <Footer />
        
        {/* Модальное окно для загрузки аватарки */}
        {this.state.showAvatarModal && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={this.handleModalClick}
          >
            <div 
              ref={this.avatarModalRef}
              style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative'
              }}
            >
              <h3 style={{ marginBottom: '24px', textAlign: 'center', fontWeight: '600' }}>
                Настройка аватарки
              </h3>
              
              {!this.state.avatarSrc ? (
                // Экран выбора файла
                <div style={{ textAlign: 'center' }}>
                  <div 
                    style={{ 
                      border: '2px dashed #ddd', 
                      borderRadius: '12px', 
                      padding: '40px 20px',
                      marginBottom: '24px',
                      background: '#f8f9fa',
                      transition: 'all 0.2s ease'
                    }}
                    onDragOver={this.handleDragOver}
                    onDrop={this.handleDrop}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = '#007bff';
                      e.currentTarget.style.background = '#e3f2fd';
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = '#ddd';
                      e.currentTarget.style.background = '#f8f9fa';
                    }}
                  >
                    <div style={{ fontSize: '48px', color: '#666', marginBottom: '16px' }}>📷</div>
                    <p style={{ marginBottom: '16px', color: '#666' }}>
                      Перетащите изображение сюда или нажмите для выбора
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={this.onChooseImage}
                      style={{ display: 'none' }}
                      id="avatar-input"
                    />
                    <label 
                      htmlFor="avatar-input"
                      style={{
                        background: '#007bff',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-block',
                        fontWeight: '500'
                      }}
                    >
                      Выбрать изображение
                    </label>
                  </div>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Поддерживаемые форматы: JPG, PNG, GIF. Максимальный размер: 5MB
                  </p>
                </div>
              ) : (
                // Экран настройки и кропа
                <div>
                  <div style={{ 
                    position: 'relative', 
                    height: '300px', 
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {this.state.avatarSrc && (
                      <img
                        src={this.state.avatarSrc}
                        alt="Preview"
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%', 
                          objectFit: 'contain'
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Контролы зума - временно отключены */}
                  
                  {/* Предпросмотр */}
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h5 style={{ marginBottom: '12px' }}>Предпросмотр</h5>
                    <div style={{ 
                      display: 'inline-block',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid #ddd',
                      background: '#f8f9fa'
                    }}>
                      {this.state.avatarSrc && (
                        <img
                          src={this.state.avatarSrc}
                          alt="Preview"
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover'
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Кнопки */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={this.onAvatarClose}
                  style={{
                    padding: '12px 24px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Отмена
                </button>
                
                {this.state.avatarSrc && (
                  <>
                    <button
                      onClick={() => {
                        this.setState({ avatarSrc: null, crop: { x: 0, y: 0 }, zoom: 1 });
                        const input = document.getElementById('avatar-input');
                        if (input) {
                          input.value = '';
                        }
                      }}
                      style={{
                        padding: '12px 24px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Выбрать другое
                    </button>
                    
                    <button
                      onClick={this.onSaveCropped}
                      style={{
                        padding: '12px 24px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Сохранить аватарку
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        <style>{`
  body[data-theme="light"], body:not([data-theme]) { background: #fff !important; }
  .edit-profile { background: #e9ecf3; }
  [data-theme="dark"] .edit-profile { background: #18191c; }
  [data-theme="dark"] .form-anim h4.mb-0 { color: #fff !important; }
  [data-theme="dark"] .form-anim small, [data-theme="dark"] .form-anim .form-text { color: #eaf4fd !important; }

  body {
    overflow-y: scroll;
  }

  .tab-btns {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 32px !important;
    width: 400px;
    max-width: 100%;
    margin: 21px auto 32px auto;
  }

  .tab-btn {
    min-width: 180px;
    width: 180px;
    max-width: 180px;
    border-radius: 24px;
    font-weight: 600;
    font-size: 17px;
    padding: 12px 0;
    margin-right: 0;
    border: 2px solid ${theme === 'dark' ? '#4485ed' : '#3976A8'};
    background: ${theme === 'dark' ? '#2d2d2d' : '#fff'};
    color: ${theme === 'dark' ? '#4485ed' : '#3976A8'};
    box-shadow: none;
    outline: none;
    border-bottom: none;
    text-decoration: none;
    transition: background 0.22s cubic-bezier(0.4,0,0.2,1), color 0.22s, border 0.18s, box-shadow 0.22s, transform 0.22s;
    will-change: background, color, box-shadow, transform;
  }

  .tab-btn.tab-btn-active {
    background: ${theme === 'dark' ? '#4485ed' : '#3976A8'};
    color: #fff;
    border: 2px solid ${theme === 'dark' ? '#4485ed' : '#3976A8'};
    transition: none;
    box-shadow: none;
    transform: none;
    z-index: 1;
  }

  .tab-btn:not(.tab-btn-active):hover,
  .tab-btn:not(.tab-btn-active):focus {
    background: #f3f4f6;
    color: #23272f;
    border: 2px solid #3976A8;
    box-shadow: 0 4px 16px rgba(52,60,77,0.10);
    transform: translateY(-2px) scale(1.03);
    z-index: 2;
  }

  .tab-btn.tab-btn-active:hover,
  .tab-btn.tab-btn-active:focus {
    background: #3976A8;
    color: #fff;
    box-shadow: none;
    transform: none;
    transition: none;
    z-index: 1;
  }

  input[type="range"] {
    accent-color: #3976a8 !important;
    height: 6px !important;
    border-radius: 3px !important;
  }

  .btn,
  .btn:focus,
  .btn:active,
  .btn:visited,
  .btn:focus-visible,
  .btn:hover,
  .btn::after,
  .btn::before,
  .modal-btn,
  .modal-btn:focus,
  .modal-btn:active,
  .modal-btn:visited,
  .modal-btn:focus-visible,
  .modal-btn:hover,
  .modal-btn::after,
  .modal-btn::before,
  .action-btn,
  .action-btn:focus,
  .action-btn:active,
  .action-btn:visited,
  .action-btn:focus-visible,
  .action-btn:hover,
  .action-btn::after,
  .action-btn::before {
    border: none !important;
    border-bottom: none !important;
    text-decoration: none !important;
    box-shadow: none !important;
    outline: none !important;
    background-image: none !important;
    filter: none !important;
    transition: none !important;
    background: #3976A8 !important;
    color: #fff !important;
  }

  .btn.btn-outline-secondary,
  .btn.modal-btn.btn-outline-secondary {
    background: #f0f2f8 !important;
    color: #3976A8 !important;
    border: 1.5px solid #e0e0e0 !important;
  }

  .btn.btn-outline-secondary:hover,
  .btn.modal-btn.btn-outline-secondary:hover {
    background: #e0e0e0 !important;
    color: #3976A8 !important;
    border: 1.5px solid #e0e0e0 !important;
  }

  .btn::after,
  .btn::before,
  .modal-btn::after,
  .modal-btn::before,
  .action-btn::after,
  .action-btn::before {
    display: none !important;
    border: none !important;
    background: none !important;
    content: none !important;
    box-shadow: none !important;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
  }

  .switch input {
    display: none;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #d1d5db;
    transition: 0.4s;
    border-radius: 24px;
  }

  .slider:before {
    position: absolute;
    content: '';
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background: #fff;
    transition: 0.4s;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  input:checked + .slider {
    background: #3976A8;
  }

  input:checked + .slider:before {
    transform: translateX(20px);
  }

  .form-anim-wrapper {
    position: relative;
    width: 100%;
    min-height: 420px;
  }

  .form-anim {
    animation: fadeInSlide 0.45s cubic-bezier(0.4, 0, 0.2, 1);
    transition: opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1), transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes fadeInSlide {
    0% {
      opacity: 0;
      transform: translateY(30px) scale(0.98);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .avatar-modal-btn {
    min-width: 160px !important;
    max-width: 220px !important;
    width: 100% !important;
    height: 44px !important;
    font-size: 16px !important;
    border-radius: 24px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    padding: 0 !important;
    text-align: center !important;
    box-shadow: none !important;
    border: none !important;
  }

  .password-strength-bar { background: #eee; width: 100%; height: 6px; border-radius: 4px; margin-bottom: 2px; }
  .password-strength-bar.weak > div { background: #e57373; }
  .password-strength-bar.moderate > div { background: #ffd54f; }
  .password-strength-bar.strong > div { background: #81c784; }
`}</style>

      </div>
    );
  }

  // Функция для оценки сложности пароля
  getPasswordStrength(pwd) {
    let score = 0;
    if (!pwd) return '';
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score++;
    if (score <= 2) return 'Weak';
    if (score === 3) return 'Moderate';
    return 'Strong';
  }
}

EditProfile.propTypes = {
  createProfile: PropTypes.func.isRequired,
  getCurrentProfile: PropTypes.func.isRequired,
  profile: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  deleteAccount: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  profile: state.profile,
  errors: state.errors,
});

const mapDispatchToProps = dispatch => ({
  createProfile: (data, history) => dispatch(createProfile(data, history)),
  getCurrentProfile: () => dispatch(getCurrentProfile()),
  clearCurrentProfile: () => dispatch(clearCurrentProfile()),
  deleteAccount: () => dispatch(deleteAccount()),
  dispatch,
});

export default connect(mapStateToProps, mapDispatchToProps )(withRouter(EditProfile));



// --- Вспомогательные функции ---
function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return t('profile.just_now');
  if (diff < 3600) return t('profile.minutes_ago', { count: Math.floor(diff/60) });
  if (diff < 86400) return t('profile.hours_ago', { count: Math.floor(diff/3600) });
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}
// --- END ---
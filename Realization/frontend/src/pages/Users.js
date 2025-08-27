import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import axios from '../utils/axios';
import jwt_decode from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const langOptions = [
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
  { value: 'de', label: 'DE' },
  { value: 'es', label: 'ES' },
  { value: 'pt', label: 'PT' },
  { value: 'uk', label: 'UK' },
  { value: 'zh', label: 'ZH' },
  { value: 'be', label: 'BE' },
];

function usePrefersDark() {
  const [dark, setDark] = useState(() => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => setDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return dark;
}

function Users() {
  const { t } = useLanguage();
  
  const sortOptions = [
    { value: 'name', label: t('users.sort_by_name') },
    { value: 'role', label: t('users.sort_by_role') },
  ];
  
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('name');
  const [lang, setLang] = useState(localStorage.getItem('language') || 'ru');
  const [theme, setTheme] = useState(null); 
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prefersDark = usePrefersDark();
  const dark = theme ? theme === 'dark' : prefersDark;
  const history = useHistory();
  const location = useLocation();
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editProfile, setEditProfile] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const decoded = jwt_decode(token);
        setCurrentUserRole(decoded.roles ? decoded.roles[0] : null);
      } catch (e) {
        setCurrentUserRole(null);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('jwtToken');
        const res = await axios.get('/auth/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data || []);
        
        if (location.search) {
          const urlParams = new URLSearchParams(location.search);
          const searchQuery = urlParams.get('search');
          const editUserId = urlParams.get('editUserId');
          const openEditModal = urlParams.get('openEditModal');
          
          if (searchQuery) {
            setQuery(searchQuery);
          }
          
          if (openEditModal === 'true' && editUserId) {
            const userToEdit = res.data.find(user => user.id === parseInt(editUserId));
            if (userToEdit) {
              setTimeout(() => {
                openEdit(userToEdit);
                history.replace(location.pathname, {});
              }, 100);
            }
          }
        }
        else if (location.state?.openEditModal && location.state?.editUserId) {
          const userToEdit = res.data.find(user => user.id === location.state.editUserId);
          if (userToEdit) {
            setTimeout(() => {
              openEdit(userToEdit);
              history.replace(location.pathname, {});
            }, 100);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || t('users.load_error'));
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [location.state, location.search, history, location.pathname]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
    const handleThemeChange = () => {
      const th = localStorage.getItem('theme');
      if (th) setTheme(th);
    };
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  useEffect(() => {
    if (theme) {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const formBg = dark ? '#26272b' : '#fff';
  const pageBg = dark ? '#18191c' : '#f6f7fa';
  const fieldBg = dark ? '#213747' : '#f9fafd';
  const fieldColor = dark ? '#ddd' : '#222';
  const borderColor = dark ? '#36607e' : '#e0e0e0';

  const filteredUsers = users
    .filter(u => {
      if (!u) return false;
      return true;
    })
    .filter(u => {
      const q = query.toLowerCase();
      return (
        (u.name?.toLowerCase().includes(q) || '') ||
        (u.username?.toLowerCase().includes(q) || '') ||
        (u.email?.toLowerCase().includes(q) || '') ||
        (u.role?.toLowerCase().includes(q) || '') ||
        (u.surname?.toLowerCase().includes(q) || '')
      );
    })
    .sort((a, b) => {
      if (sort === 'name') return (a.name || a.username || '').localeCompare(b.name || b.username || '');
      if (sort === 'role') return (a.role || '').localeCompare(b.role || '');
      return 0;
    });
  useEffect(() => {
    if (selected && selected.id) {
      const token = localStorage.getItem('jwtToken');
      axios.get(`/profile/user/${selected.id}`, {
        headers: { Authorization: {Authorization: `Bearer ${token}`} },
      })
        .then(res => setSelectedProfile(res.data))
        .catch(() => setSelectedProfile(null));
    } else {
      setSelectedProfile(null);
    }
  }, [selected]);

  function renderProfileFields(profile) {
    if (!profile) return null;
    const fields = [
      { label: t('profile.first_name') + ':', value: profile.name },
      { label: t('profile.last_name') + ':', value: profile.surname },
      { label: t('profile.additional_names') + ':', value: profile.additionalName },
      { label: 'BIO:', value: profile.bio },
      { label: t('profile.github_username') + ':', value: profile.githubusername },
      { label: t('profile.skills_info') + ':', value: profile.skills && profile.skills.length ? profile.skills.join(', ') : null },
      { label: t('profile.job_title') + ':', value: profile.jobTitle },
      { label: t('profile.goal') + ':', value: profile.goal },
      { label: t('profile.city') + ':', value: profile.city },
      { label: t('profile.country') + ':', value: profile.country },
      { label: t('profile.company') + ':', value: profile.company },
      { label: t('profile.position') + ':', value: profile.position },
      { label: t('profile.status') + ':', value: profile.status },
      { label: t('profile.aboutMe') + ':', value: profile.aboutMe },
    ];

    const maxLen = 220;
    function truncate(val) {
      if (!val) return '';
      return String(val).length > maxLen ? String(val).slice(0, maxLen - 1) + '…' : val;
    }
    return (
      <div style={{ marginTop: 12, width: '100%' }}>
        {fields.filter(f => f.value && String(f.value).trim() !== '').map(f => (
          <div key={f.label} style={{ marginBottom: 8, color: fieldColor, fontSize: 16, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
            <strong>{f.label}</strong> {truncate(f.value)}
          </div>
        ))}
      </div>
    );
  }

  const openEdit = async (u) => {
    console.log('openEdit called with user:', u);
    setEditUser(u);
    setEditOpen(true);
    setAvatarFile(null);
    setAvatarPreview(null);
    console.log('editOpen set to true');
    
    try {
      const token = localStorage.getItem('jwtToken');
      const res = await axios.get(`/profile/user/${u.id}`, { headers: { Authorization: `Bearer ${token}` } });
      console.log('Profile data loaded:', res.data);
      
      setEditProfile({
        username: u.username || '',
        name: res.data?.name || '',
        surname: res.data?.surname || '',
        additionalName: res.data?.additionalName || '',
        email: u.email || '',
        bio: res.data?.bio || '',
        jobTitle: res.data?.jobTitle || '',
        position: res.data?.position || '',
        company: res.data?.company || '',
        city: res.data?.city || '',
        country: res.data?.country || '',
        goal: res.data?.goal || '',
        status: res.data?.status || '',
        skills: Array.isArray(res.data?.skills) ? res.data.skills.join(', ') : (res.data?.skills || ''),
        aboutMe: res.data?.aboutMe || '',
        githubusername: res.data?.githubusername || '',
        role: u.role || 'USER' 
      });
      console.log('editProfile set');
    } catch (error) {
      console.error('Error loading profile:', error);
      setEditProfile({ username: u.username || '', email: u.email || '' });
    }
  };

  const saveEdit = async () => {
    try {
      setSavingEdit(true);
      const token = localStorage.getItem('jwtToken');
      
      console.log('Отправляем данные для обновления:', { userId: editUser.id, ...editProfile });
      
      // Создаем FormData для отправки всех данных
      const formData = new FormData();
      formData.append('userId', editUser.id.toString());
      
      // Добавляем все поля профиля
      Object.keys(editProfile).forEach(key => {
        formData.append(key, editProfile[key]);
      });
      
      // Добавляем файл аватарки, если он выбран
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      
      await axios.post(`/profile/admin/update`, formData, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        } 
      }).catch(async (err) => { throw err; });
      
      const res = await axios.get('/auth/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data || []);
      setEditOpen(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success(t('users.changes_saved'));
    } catch (e) {
      const msg = e?.response?.data?.username || e?.response?.data?.error || e?.response?.data?.message || t('users.save_error');
      toast.error(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ background: pageBg, minHeight: '100vh', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: 900, margin: '0 auto' }}>
        <ToastContainer position="top-center" theme={dark ? 'dark' : 'light'} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, justifyContent: 'flex-end' }}>
          <select
            aria-label="Select language"
            style={{ padding: '0.4rem 1rem', borderRadius: 20, border: `1px solid ${borderColor}`, background: fieldBg, color: dark ? '#eaf4fd' : '#3976a8', fontWeight: 'bold', cursor: 'pointer', marginRight: 0, fontSize: '1rem' }}
            value={lang}
            onChange={e => { setLang(e.target.value); localStorage.setItem('language', e.target.value); window.location.reload(); }}
          >
            {langOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: dark ? '#ffe082' : '#222', marginLeft: 0, transition: 'all 0.1s ease', fontFamily: 'Nunito' }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {dark ? '☀️' : '🌙'}
          </button>
          <button
            style={{ padding: '0.5rem 1.5rem', backgroundColor: '#3976a8', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: '1rem', transition: '0.3s', transform: 'translateY(0px)', boxShadow: 'none' }}
            onClick={() => history.goBack()}
          >
            {t('reviews.back')}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          <input
            type="search"
            placeholder={t('users.search_placeholder')}
            className="form-control"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 18, flex: 1, background: fieldBg, boxShadow: 'none', color: fieldColor, borderRadius: 12, padding: '0 18px', height: 48, maxWidth: 340 }}
          />
          <button type="button" aria-label="Search" className="button button--search button--sm" style={{ background: '#3976a8', border: 'none', cursor: 'pointer', padding: '0 18px', color: '#fff', borderRadius: 12, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg aria-hidden="true" className="icon icon--common-search" width="22" height="22" viewBox="0 0 22 22"><circle cx="10" cy="10" r="7" stroke="#fff" strokeWidth="2" fill="none"/><line x1="15.5" y1="15.5" x2="20" y2="20" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <select
            aria-label="Sort users"
            style={{ padding: '0.4rem 1rem', borderRadius: 20, border: `1px solid ${borderColor}`, background: fieldBg, color: dark ? '#eaf4fd' : '#3976a8', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', minWidth: 180 }}
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div style={{ color: '#888', fontSize: 18, textAlign: 'center', padding: 40 }}>{t('users.loading')}</div>
        ) : error ? (
          <div style={{ color: 'red', fontSize: 18, textAlign: 'center', padding: 40 }}>{error}</div>
        ) : (
          <>
            <style>{`
              @media (max-width: 600px) {
                .user-card {
                  min-width: 98vw !important;
                  max-width: 98vw !important;
                  width: 98vw !important;
                  padding: 10px !important;
                  min-height: 180px !important;
                  height: auto !important;
                  margin: 0 auto !important;
                }
              }
            `}</style>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              alignItems: 'flex-start',
            }}>
              {filteredUsers.map(u => (
                <div
                  key={u.id}
                  className="user-card"
                  style={{
                    background: formBg,
                    borderRadius: 18,
                    boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                    padding: 24,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.18s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: 220,
                    maxWidth: 240,
                    minHeight: 320,
                    height: 320,
                    justifyContent: 'flex-start',
                  }}
                  onClick={() => setSelected(u)}
                >
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#d3dbe6', marginBottom: 16, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {u.avatar && typeof u.avatar === 'string' ? (
                      <img src={u.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#aaa', fontSize: 32 }}>{u.name?.[0] || u.username?.[0] || '?'}</span>
                    )}
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, color: dark ? '#eaf4fd' : '#3976a8', textAlign: 'center' }}>{u.name || u.username}</h3>
                  <div style={{ color: fieldColor, fontSize: 15, marginBottom: 6, textAlign: 'center' }}>{u.email}</div>
                  <div style={{ fontSize: 14, color: '#888', marginBottom: 6, textAlign: 'center' }}>{t('profile.role')}: {u.role || 'USER'}</div>
                  <div style={{ color: dark ? '#b6d4fe' : '#888', fontSize: 16, marginBottom: 12, textAlign: 'center', minHeight: 32, maxHeight: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', display: 'block', lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {(() => {
                      const bio = u.Profile && u.Profile.bio && String(u.Profile.bio).trim() ? String(u.Profile.bio) : '';
                      if (!bio) return '—';
                      return bio;
                    })()}
                  </div>
                  {currentUserRole === 'ADMIN' && (u.role === 'USER' || !u.role) && (
                    <button type="button" onClick={(e)=>{ e.stopPropagation(); openEdit(u); }} style={{
                      background: '#4485ed', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 700, cursor: 'pointer'
                    }}>{t('users.edit')}</button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        {selected && (
          <>
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.45)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
              onClick={() => setSelected(null)}
            />
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: dark
                ? 'linear-gradient(135deg, #232526 0%, #414345 100%)'
                : 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
              borderRadius: 24,
              boxShadow: dark
                ? '0 8px 32px rgba(0,0,0,0.38)'
                : '0 8px 32px rgba(0,0,0,0.14)',
              padding: 44,
              minWidth: 340,
              maxWidth: 440,
              width: '92vw',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'fadeInModal 0.25s',
              color: dark ? '#eaf4fd' : '#1a2a3a',
              border: dark ? '1.5px solid #36607e' : '1.5px solid #b6d4fe',
              position: 'relative',
            }}>
              <button
                onClick={() => setSelected(null)}
                style={{ position: 'absolute', top: 18, right: 18, background: 'transparent', border: 'none', color: dark ? '#eaf4fd' : '#3976a8', fontSize: 28, cursor: 'pointer', zIndex: 1002 }}
                aria-label={t('common.close')}
              >×</button>
              <div style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                background: dark ? 'linear-gradient(135deg, #232526 0%, #414345 100%)' : 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
                marginBottom: 18,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                border: dark ? '3px solid #3976a8' : '3px solid #b6d4fe',
              }}>
                {selected.avatar && typeof selected.avatar === 'string' ? (
                  <img src={selected.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#aaa', fontSize: 48, fontWeight: 700 }}>{selected.name?.[0] || selected.username?.[0] || '?'}</span>
                )}
              </div>
              <h2 style={{ fontWeight: 800, fontSize: 26, marginBottom: 4, color: dark ? '#eaf4fd' : '#3976a8', textAlign: 'center', letterSpacing: 1 }}>{selected.name || selected.username}</h2>
              <div style={{ color: dark ? '#b6d4fe' : '#3976a8', fontSize: 15, marginBottom: 10, textAlign: 'center', fontWeight: 500, wordBreak: 'break-all' }}>
                <i className="fa fa-envelope" style={{ marginRight: 6, color: '#888' }} />{selected.email}
              </div>
                <div style={{ fontSize: 15, color: '#888', marginBottom: 10, textAlign: 'center', fontWeight: 500 }}>
                <i className="fa fa-user-shield" style={{ marginRight: 6, color: '#888' }} />{t('profile.role')}: {selected.role || 'USER'}
                </div>
              {/* BIO */}
              {selectedProfile?.bio && (
                <div style={{
                  background: dark ? '#213747' : '#f4f8fb',
                  color: dark ? '#eaf4fd' : '#1a2a3a',
                  borderRadius: 12,
                  padding: '12px 18px',
                  margin: '10px 0 14px 0',
                  fontSize: 16,
                  fontStyle: 'italic',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  width: '100%',
                  textAlign: 'center',
                }}>
                  <i className="fa fa-quote-left" style={{ marginRight: 8, color: '#3976a8', opacity: 0.7 }} />
                  {selectedProfile.bio}
                </div>
              )}
              {/* Skills */}
              {selectedProfile?.skills && selectedProfile.skills.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 14,
                  justifyContent: 'center',
                }}>
                  {selectedProfile.skills.map((skill, idx) => (
                    <span key={idx} style={{
                      background: dark ? '#36607e' : '#e0eafc',
                      color: dark ? '#eaf4fd' : '#3976a8',
                      borderRadius: 8,
                      padding: '4px 12px',
                      fontSize: 14,
                      fontWeight: 600,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}>{skill}</span>
                  ))}
                </div>
              )}
              {/* Остальные поля профиля */}
              <div style={{ width: '100%', marginBottom: 18 }}>
                {selectedProfile?.githubusername && (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', color: fieldColor, fontSize: 16 }}>
                    <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" style={{ width: 20, height: 20, marginRight: 8, borderRadius: '50%', background: '#fff', border: dark ? '1px solid #b6d4fe' : '1px solid #3976a8' }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: dark ? '#b6d4fe' : '#3976a8', marginRight: 6, minWidth: 90, display: 'inline-block' }}>GitHub:</span>
                    <a href={selectedProfile.githubusername} target="_blank" rel="noopener noreferrer" style={{ color: dark ? '#b6d4fe' : '#3976a8', textDecoration: 'underline' }}>{selectedProfile.githubusername}</a>
                  </div>
                )}
                {selectedProfile?.city && (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', color: fieldColor, fontSize: 16 }}>
                    <i className="fa fa-map-marker-alt" style={{ marginRight: 8, color: '#e57373' }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: dark ? '#b6d4fe' : '#3976a8', marginRight: 6, minWidth: 90, display: 'inline-block' }}>City:</span>
                    {selectedProfile.city}
                  </div>
                )}
                {selectedProfile?.country && (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', color: fieldColor, fontSize: 16 }}>
                    <i className="fa fa-flag" style={{ marginRight: 8, color: '#81c784' }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: dark ? '#b6d4fe' : '#3976a8', marginRight: 6, minWidth: 90, display: 'inline-block' }}>Country:</span>
                    {selectedProfile.country}
                  </div>
                )}
                {selectedProfile?.company && (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', color: fieldColor, fontSize: 16 }}>
                    <i className="fa fa-building" style={{ marginRight: 8, color: '#ffd54f' }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: dark ? '#b6d4fe' : '#3976a8', marginRight: 6, minWidth: 90, display: 'inline-block' }}>Company:</span>
                    {selectedProfile.company}
                  </div>
                )}
                {selectedProfile?.position && (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', color: fieldColor, fontSize: 16 }}>
                    <i className="fa fa-briefcase" style={{ marginRight: 8, color: '#64b5f6' }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: dark ? '#b6d4fe' : '#3976a8', marginRight: 6, minWidth: 90, display: 'inline-block' }}>Position:</span>
                    {selectedProfile.position}
                  </div>
                )}
                {selectedProfile?.jobTitle && (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', color: fieldColor, fontSize: 16 }}>
                    <i className="fa fa-user-tie" style={{ marginRight: 8, color: '#ba68c8' }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: dark ? '#b6d4fe' : '#3976a8', marginRight: 6, minWidth: 90, display: 'inline-block' }}>Job:</span>
                    {selectedProfile.jobTitle}
                  </div>
                )}
                {selectedProfile?.goal && (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', color: fieldColor, fontSize: 16 }}>
                    <i className="fa fa-bullseye" style={{ marginRight: 8, color: '#ff8a65' }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: dark ? '#b6d4fe' : '#3976a8', marginRight: 6, minWidth: 90, display: 'inline-block' }}>Goal:</span>
                    {selectedProfile.goal}
                  </div>
                )}
                {selectedProfile?.status && (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', color: fieldColor, fontSize: 16 }}>
                    <i className="fa fa-info-circle" style={{ marginRight: 8, color: '#4dd0e1' }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: dark ? '#b6d4fe' : '#3976a8', marginRight: 6, minWidth: 90, display: 'inline-block' }}>Status:</span>
                    {selectedProfile.status}
                  </div>
                )}
                {selectedProfile?.aboutMe && (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', color: fieldColor, fontSize: 16 }}>
                    <i className="fa fa-user" style={{ marginRight: 8, color: '#f06292' }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: dark ? '#b6d4fe' : '#3976a8', marginRight: 6, minWidth: 90, display: 'inline-block' }}>About me:</span>
                    {selectedProfile.aboutMe}
                  </div>
                )}
              </div>
              <button type="button" style={{
                background: dark ? 'linear-gradient(90deg, #3976a8 0%, #36607e 100%)' : 'linear-gradient(90deg, #3976a8 0%, #b6d4fe 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                padding: '12px 38px',
                fontWeight: 700,
                fontSize: 17,
                marginTop: 8,
                alignSelf: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                cursor: 'pointer',
                letterSpacing: 1,
                transition: 'background 0.2s',
              }} onClick={() => setSelected(null)}>{t('reviews.back')}</button>
            </div>
            <style>{`
              @keyframes fadeInModal {
                0% { opacity: 0; transform: translate(-50%, -40%) scale(0.98); }
                100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
              }
              .fa { display: inline-block; }
            `}</style>
          </>
        )}
        {editOpen && editUser && (
          <>
            <div onClick={()=>setEditOpen(false)} style={{ position:'fixed', inset:0, background:'#0007', zIndex:1000 }} />
            <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background: formBg, color: fieldColor, border:`1px solid ${borderColor}`, borderRadius:16, padding:24, width:560, maxWidth:'95vw', zIndex:1001 }}>
              <h3 style={{ marginTop:0, marginBottom:12 }}>{t('users.edit_profile')}: {editUser.username || editUser.email}</h3>
                              <div style={{ fontSize: 14, color: '#888', marginBottom: 12 }}>{t('profile.role')}: {editUser.role || 'USER'}</div>
              
              {/* Загрузка аватарки */}
              <div style={{ marginBottom: 16, textAlign: 'center' }}>
                <div style={{ 
                  width: 100, 
                  height: 100, 
                  borderRadius: '50%', 
                  border: `2px solid ${borderColor}`,
                  margin: '0 auto 12px',
                  overflow: 'hidden',
                  background: fieldBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : editUser.avatar ? (
                    <img 
                      src={editUser.avatar} 
                      alt="Current avatar" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ fontSize: 24, color: '#ccc' }}>👤</div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  style={{
                    padding: '8px 16px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#0056b3'}
                  onMouseOut={(e) => e.target.style.background = '#007bff'}
                >
                  {avatarFile ? t('users.change_avatar') : t('users.upload_avatar')}
                </label>
                {avatarFile && (
                                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {t('users.selected_file')}: {avatarFile.name}
                    </div>
                )}
              </div>
              
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <input placeholder="Username" value={editProfile.username||''} onChange={e=>setEditProfile(p=>({...p, username:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
                <input placeholder="Email" value={editProfile.email||''} onChange={e=>setEditProfile(p=>({...p, email:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
                <input placeholder={t('profile.first_name')} value={editProfile.name||''} onChange={e=>setEditProfile(p=>({...p, name:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
                <input placeholder={t('profile.last_name')} value={editProfile.surname||''} onChange={e=>setEditProfile(p=>({...p, surname:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
                <input placeholder={t('profile.additional_names')} value={editProfile.additionalName||''} onChange={e=>setEditProfile(p=>({...p, additionalName:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
                <select value={editProfile.role||'USER'} onChange={e=>setEditProfile(p=>({...p, role:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }}>
                  <option value="USER">{t('users.user')}</option>
                  <option value="ADMIN">{t('users.admin')}</option>
                </select>
                <input placeholder={t('profile.job_title')} value={editProfile.jobTitle||''} onChange={e=>setEditProfile(p=>({...p, jobTitle:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
                <input placeholder={t('profile.position')} value={editProfile.position||''} onChange={e=>setEditProfile(p=>({...p, position:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
                <input placeholder={t('profile.company')} value={editProfile.company||''} onChange={e=>setEditProfile(p=>({...p, company:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
                <input placeholder={t('profile.city')} value={editProfile.city||''} onChange={e=>setEditProfile(p=>({...p, city:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
                <input placeholder={t('profile.country')} value={editProfile.country||''} onChange={e=>setEditProfile(p=>({...p, country:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
              </div>
                              <textarea placeholder={t('profile.bio')} value={editProfile.bio||''} onChange={e=>setEditProfile(p=>({...p, bio:e.target.value}))} style={{ marginTop:12, width:'100%', minHeight:80, padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
                              <input placeholder={t('profile.skills_placeholder')} value={editProfile.skills||''} onChange={e=>setEditProfile(p=>({...p, skills:e.target.value}))} style={{ marginTop:12, width:'100%', padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
                <input placeholder={t('profile.goal')} value={editProfile.goal||''} onChange={e=>setEditProfile(p=>({...p, goal:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
                <input placeholder={t('profile.status')} value={editProfile.status||''} onChange={e=>setEditProfile(p=>({...p, status:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
              </div>
              <input placeholder={t('profile.github_username')} value={editProfile.githubusername||''} onChange={e=>setEditProfile(p=>({...p, githubusername:e.target.value}))} style={{ marginTop:12, width:'100%', padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
              <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:16 }}>
                <button type="button" onClick={()=>setEditOpen(false)} style={{ background:'#6c757d', color:'#fff', border:'none', borderRadius:10, padding:'10px 16px', fontWeight:700, cursor:'pointer' }}>{t('common.cancel')}</button>
                <button type="button" disabled={savingEdit} onClick={saveEdit} style={{ background: savingEdit ? '#6c757d' : '#28a745', color:'#fff', border:'none', borderRadius:10, padding:'10px 16px', fontWeight:700, cursor: savingEdit ? 'not-allowed' : 'pointer' }}>{savingEdit ? t('users.saving') : t('users.save')}</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Users; 
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import i18n from '../i18n';
import axios from '../utils/axios';
import jwt_decode from 'jwt-decode';

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

const t = i18n.t.bind(i18n);

const sortOptions = [
  { value: 'name', label: t('users.sort_by_name', 'По имени') },
  { value: 'date', label: t('users.sort_by_date', 'По дате регистрации') },
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
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('name');
  const [lang, setLang] = useState(localStorage.getItem('language') || 'ru');
  const [theme, setTheme] = useState(null); // null=auto, 'dark', 'light'
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prefersDark = usePrefersDark();
  const dark = theme ? theme === 'dark' : prefersDark;
  const history = useHistory();
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    // Determine current user role from token
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
      } catch (err) {
        setError(err.response?.data?.message || 'Ошибка загрузки пользователей');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
    // Listen for theme changes dispatched globally
    const handleThemeChange = () => {
      const th = localStorage.getItem('theme');
      if (th) setTheme(th);
    };
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  // Persist theme selection changes
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

  // Filter users by role
  const filtered = users
    .filter(u => {
      if (currentUserRole === 'ADMIN') return true;
      if (currentUserRole === 'USER') return u.role === 'USER';
      return false;
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
      if (sort === 'date') return new Date(b.createdAt || b.registered) - new Date(a.createdAt || a.registered);
      if (sort === 'role') return (a.role || '').localeCompare(b.role || '');
      return 0;
    });

  // Fetch profile by user id when selected
  useEffect(() => {
    if (selected && selected.id) {
      const token = localStorage.getItem('jwtToken');
      axios.get(`/profile/user/${selected.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => setSelectedProfile(res.data))
        .catch(() => setSelectedProfile(null));
    } else {
      setSelectedProfile(null);
    }
  }, [selected]);

  // Helper to render only filled fields in pretty format
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
    // Truncate long values (like bio) with ellipsis
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

  return (
    <div style={{ background: pageBg, minHeight: '100vh', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: 900, margin: '0 auto' }}>
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
            {t('reviews.back') || 'Назад'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          <input
            type="search"
            placeholder={t('users.search_placeholder', 'Поиск по имени, email...')}
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
          <div style={{ color: '#888', fontSize: 18, textAlign: 'center', padding: 40 }}>Загрузка...</div>
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
              {filtered.map(u => (
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
                  {currentUserRole === 'ADMIN' && (
                    <div style={{ fontSize: 14, color: '#888', marginBottom: 6, textAlign: 'center' }}>{t('profile.role')}: {u.role}</div>
                  )}
                  <div style={{ color: dark ? '#b6d4fe' : '#888', fontSize: 16, marginBottom: 12, textAlign: 'center', minHeight: 32, maxHeight: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', display: 'block', lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {(() => {
                      const bio = u.Profile && u.Profile.bio && String(u.Profile.bio).trim() ? String(u.Profile.bio) : '';
                      if (!bio) return '—';
                      return bio;
                    })()}
                  </div>
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
                aria-label="Закрыть"
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
              {currentUserRole === 'ADMIN' && selected.role && (
                <div style={{ fontSize: 15, color: '#888', marginBottom: 10, textAlign: 'center', fontWeight: 500 }}>
                  <i className="fa fa-user-shield" style={{ marginRight: 6, color: '#888' }} />{t('profile.role')}: {selected.role}
                </div>
              )}
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
              }} onClick={() => setSelected(null)}>{t('reviews.back') || 'Назад'}</button>
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
      </div>
    </div>
  );
}

export default Users; 
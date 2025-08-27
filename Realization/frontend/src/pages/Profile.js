import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEnvelope, 
  faCalendarAlt,
  faMapMarkerAlt,
  faPhone,
  faGlobe,
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import axios from '../utils/axios';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import useTheme from '../hooks/useTheme';
import '../admin/admin.css';

const Profile = () => {
  const { handle } = useParams();
  const { t, currentLanguage } = useLanguage();
  const { theme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadProfile();
    loadCurrentUser();
  }, [handle]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/profile/handle/${handle}`);
      setProfile(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
      if (error.response?.status === 404) {
        setError(t('profile.not_found'));
      } else {
        setError(t('profile.load_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = () => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(decoded);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--teach-bg)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--text-color)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>{t('profile.loading')}</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--teach-bg)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--text-color)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>{error || t('profile.not_found')}</div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === profile.user?.id;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      
      <main style={{ flex: 1, padding: '48px 0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          {/* Заголовок профиля */}
          <div style={{ 
            background: 'var(--teach-tile-bg)', 
            borderRadius: 16, 
            border: '1px solid var(--border-color)',
            padding: 32,
            marginBottom: 32,
            textAlign: 'center'
          }}>
            <div style={{ 
              width: 120, 
              height: 120, 
              borderRadius: '50%', 
              background: 'var(--accent-color, #4485ed)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 24px',
              color: 'white',
              fontSize: 48,
              fontWeight: 'bold'
            }}>
              {(profile.user?.username || profile.user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            
            <h1 style={{ 
              fontSize: 32, 
              fontWeight: 700, 
              marginBottom: 8,
              color: 'var(--text-color)'
            }}>
              {profile.user?.username || profile.user?.email || 'Пользователь'}
            </h1>
            
            {profile.status && (
              <p style={{ 
                fontSize: 18, 
                color: 'var(--text-secondary, #666)',
                marginBottom: 24
              }}>
                {profile.status}
              </p>
            )}

            {isOwnProfile && (
              <a
                href="/edit-profile"
                style={{
                  background: 'var(--accent-color, #4485ed)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                <FontAwesomeIcon icon={faEdit} />
                {t('profile.edit_profile')}
              </a>
            )}
          </div>

          {/* Информация о пользователе */}
          <div style={{ 
            background: 'var(--teach-tile-bg)', 
            borderRadius: 16, 
            border: '1px solid var(--border-color)',
            padding: 32,
            marginBottom: 32
          }}>
            <h2 style={{ 
              fontSize: 24, 
              fontWeight: 600, 
              marginBottom: 24,
              color: 'var(--text-color)',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <FontAwesomeIcon icon={faUser} style={{ color: 'var(--accent-color, #4485ed)' }} />
              {t('profile.user_information')}
            </h2>

            <div style={{ display: 'grid', gap: 16 }}>
              {profile.user?.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FontAwesomeIcon 
                    icon={faEnvelope} 
                    style={{ color: 'var(--text-secondary, #666)', width: 20 }}
                  />
                  <span style={{ color: 'var(--text-color)' }}>{profile.user.email}</span>
                </div>
              )}

              {profile.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FontAwesomeIcon 
                    icon={faMapMarkerAlt} 
                    style={{ color: 'var(--text-secondary, #666)', width: 20 }}
                  />
                  <span style={{ color: 'var(--text-color)' }}>{profile.location}</span>
                </div>
              )}

              {profile.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FontAwesomeIcon 
                    icon={faPhone} 
                    style={{ color: 'var(--text-secondary, #666)', width: 20 }}
                  />
                  <span style={{ color: 'var(--text-color)' }}>{profile.phone}</span>
                </div>
              )}

              {profile.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FontAwesomeIcon 
                    icon={faGlobe} 
                    style={{ color: 'var(--text-secondary, #666)', width: 20 }}
                  />
                  <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-color, #4485ed)', textDecoration: 'none' }}
                  >
                    {profile.website}
                  </a>
                </div>
              )}

              {profile.user?.createdAt && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FontAwesomeIcon 
                    icon={faCalendarAlt} 
                    style={{ color: 'var(--text-secondary, #666)', width: 20 }}
                  />
                  <span style={{ color: 'var(--text-color)' }}>
                    {t('profile.registered')}: {new Date(profile.user.createdAt).toLocaleDateString(currentLanguage === 'ru' ? 'ru-RU' : 
                                                                                                    currentLanguage === 'de' ? 'de-DE' :
                                                                                                    currentLanguage === 'es' ? 'es-ES' :
                                                                                                    currentLanguage === 'pt' ? 'pt-BR' :
                                                                                                    currentLanguage === 'uk' ? 'uk-UA' :
                                                                                                    currentLanguage === 'zh' ? 'zh-CN' :
                                                                                                    'en-US')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* О пользователе */}
          {profile.bio && (
            <div style={{ 
              background: 'var(--teach-tile-bg)', 
              borderRadius: 16, 
              border: '1px solid var(--border-color)',
              padding: 32
            }}>
              <h2 style={{ 
                fontSize: 24, 
                fontWeight: 600, 
                marginBottom: 24,
                color: 'var(--text-color)'
              }}>
                {t('profile.about_user')}
              </h2>
              <p style={{ 
                fontSize: 16, 
                lineHeight: 1.6,
                color: 'var(--text-color)'
              }}>
                {profile.bio}
              </p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile; 
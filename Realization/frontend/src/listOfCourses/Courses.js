import React, { useState, useEffect } from "react";
import axios from "../utils/axios";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { useLanguage } from "../hooks/useLanguage";
import "../App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faGraduationCap, 
  faCode, 
  faUsers, 
  faRocket, 
  faCheckCircle,
  faArrowRight,
  faPlay,
  faBookOpen,
  faLaptopCode,
  faCertificate
} from "@fortawesome/free-solid-svg-icons";
import jwt_decode from "jwt-decode";

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

const Services = () => {
  const [userRole, setUserRole] = useState('');
  const [theme, setTheme] = useState(null); // null=auto, 'dark', 'light'
  const prefersDark = usePrefersDark();
  const dark = theme ? theme === 'dark' : prefersDark;
  const { t, currentLanguage } = useLanguage();

  useEffect(() => {
    try {
      const token = localStorage.getItem("jwtToken");
      if (token) {
        const decoded = jwt_decode(token);
        const roles = decoded.roles || [];
        setUserRole(Array.isArray(roles) ? roles[0] : roles);
      }
    } catch {}

    if (userRole === 'ADMIN') {
      window.location.href = '/teach';
    }
  }, [userRole]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);
  useEffect(() => {
    if (theme) localStorage.setItem('theme', theme);
  }, [theme]);

  const pageBg = dark ? '#18191c' : '#f6f7fa';
  const cardBg = dark ? '#26272b' : '#ffffff';
  const textColor = dark ? '#eaf4fd' : '#333333';
  const secondaryTextColor = dark ? '#cccccc' : '#666666';
  const accentColor = '#4485ed';

  const features = [
    {
      icon: faCode,
      title: t('home.feature1_title') ,
      description: t('home.feature1_desc') 
    },
    {
      icon: faUsers,
      title: t('home.feature2_title') ,
      description: t('home.feature2_desc') 
    },
    {
      icon: faRocket,
      title: t('home.feature3_title') ,
      description: t('home.feature3_desc') 
    }
  ];

  const benefits = [
    t('home.benefit1'),
    t('home.benefit2'),
    t('home.benefit3') ,
    t('home.benefit4') ,
    t('home.benefit5'),
    t('home.benefit6') 
  ];

  return (
    <div style={{ background: pageBg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      
      {/* Hero Section */}
      <div style={{ 
        background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)`,
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <FontAwesomeIcon 
            icon={faGraduationCap} 
            style={{ 
              fontSize: '4rem', 
              color: accentColor, 
              marginBottom: '20px' 
            }} 
          />
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            color: textColor, 
            marginBottom: '20px',
            lineHeight: '1.2'
          }}>
            {t('home.hero_title') }
          </h1>
          <p style={{ 
            fontSize: '1.3rem', 
            color: secondaryTextColor, 
            marginBottom: '40px',
            maxWidth: '600px',
            margin: '0 auto 40px auto',
            lineHeight: '1.6'
          }}>
            {t('home.hero_subtitle')}
          </p>
          
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {userRole === 'USER' ? (
              <>
                <button
                  onClick={() => window.location.href = '/course-catalog'}
                  style={{
                    padding: '15px 30px',
                    background: accentColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#3371d6'}
                  onMouseOut={(e) => e.target.style.background = accentColor}
                >
                  <FontAwesomeIcon icon={faPlay} />
                  {t('home.start_learning') }
                </button>
                <button
                  onClick={() => window.location.href = '/my-training'}
                  style={{
                    padding: '15px 30px',
                    background: 'transparent',
                    color: accentColor,
                    border: `2px solid ${accentColor}`,
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = accentColor;
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = accentColor;
                  }}
                >
                  <FontAwesomeIcon icon={faBookOpen} />
                  {t('home.my_courses')}
                </button>
              </>
            ) : (
              <button
                onClick={() => window.location.href = '/login'}
                style={{
                  padding: '15px 30px',
                  background: accentColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
                onMouseOver={(e) => e.target.style.background = '#3371d6'}
                onMouseOut={(e) => e.target.style.background = accentColor}
              >
                <FontAwesomeIcon icon={faRocket} />
                {t('home.get_started')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ padding: '80px 20px' }}>
        <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: textColor, 
            textAlign: 'center',
            marginBottom: '60px'
          }}>
            {t('home.why_choose')}
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '30px' 
          }}>
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  background: cardBg,
                  padding: '30px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  boxShadow: dark ? '0 4px 12px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <FontAwesomeIcon 
                  icon={feature.icon} 
                  style={{ 
                    fontSize: '2.5rem', 
                    color: accentColor, 
                    marginBottom: '20px' 
                  }} 
                />
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: '600', 
                  color: textColor, 
                  marginBottom: '15px' 
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  color: secondaryTextColor, 
                  lineHeight: '1.6' 
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div style={{ 
        background: cardBg, 
        padding: '80px 20px' 
      }}>
        <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '60px',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ 
                fontSize: '2.5rem', 
                fontWeight: '700', 
                color: textColor, 
                marginBottom: '30px' 
              }}>
                {t('home.what_you_get')}
              </h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '20px' 
              }}>
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px'
                    }}
                  >
                    <FontAwesomeIcon 
                      icon={faCheckCircle} 
                      style={{ 
                        color: accentColor, 
                        fontSize: '1.2rem' 
                      }} 
                    />
                    <span style={{ 
                      color: secondaryTextColor, 
                      fontSize: '1.1rem' 
                    }}>
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <FontAwesomeIcon 
                icon={faLaptopCode} 
                style={{ 
                  fontSize: '8rem', 
                  color: accentColor,
                  opacity: 0.8
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ 
        background: `linear-gradient(135deg, ${accentColor}, #3371d6)`,
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: 'white', 
            marginBottom: '20px' 
          }}>
            {t('home.ready_to_start') }
          </h2>
          <p style={{ 
            fontSize: '1.2rem', 
            color: 'rgba(255,255,255,0.9)', 
            marginBottom: '40px' 
          }}>
            {t('home.cta_text') }
          </p>
          
          <button
            onClick={() => window.location.href = userRole === 'USER' ? '/course-catalog' : '/login'}
            style={{
              padding: '18px 40px',
              background: 'white',
              color: accentColor,
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.2rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <FontAwesomeIcon icon={faArrowRight} />
            {userRole === 'USER' 
              ? (t('home.browse_courses'))
              : (t('home.create_account') )
            }
          </button>
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}><Footer /></div>
    </div>
  );
};

export default Services;


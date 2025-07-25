import React, { useState, useEffect } from "react";
import axios from "../utils/axios";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import i18n from "../i18n";
import "../App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as faSolidStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as faRegularStar } from "@fortawesome/free-regular-svg-icons";
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
  const [data, setData] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [theme, setTheme] = useState(null); // null=auto, 'dark', 'light'
  const [lang, setLang] = useState(localStorage.getItem('language') || 'ru');
  const prefersDark = usePrefersDark();
  const dark = theme ? theme === 'dark' : prefersDark;

  const t = i18n.t.bind(i18n);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/courses", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          },
        });
        setData(response.data);
      } catch (error) {
        if (
          (error.response && error.response.status === 401) ||
          (error.response && error.response.status === 403)
        ) {
          window.location.href = "/login";
        } else {
          console.log(error);
        }
      }
    };
    fetchData();

    // определяем роль пользователя из токена
    try {
      const token = localStorage.getItem("jwtToken");
      if (token) {
        const decoded = jwt_decode(token);
        const roles = decoded.roles || [];
        setUserRole(Array.isArray(roles) ? roles[0] : roles);
      }
    } catch {}

    // подгружаем избранное
    axios
      .get("/favorites", {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken")}` },
      })
      .then((res) => setFavorites(res.data.map((c) => c.id)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);
  useEffect(() => {
    if (theme) localStorage.setItem('theme', theme);
  }, [theme]);

  const formBg = dark ? '#26272b' : '#fff';
  const pageBg = dark ? '#18191c' : '#f6f7fa';
  const fieldBg = dark ? '#213747' : '#f9fafd';
  const fieldColor = dark ? '#ddd' : '#222';
  const borderColor = dark ? '#36607e' : '#e0e0e0';

  const toggleFavorite = async (courseId, e) => {
    e.stopPropagation();
    e.preventDefault();
    const isFav = favorites.includes(courseId);
    try {
      if (isFav) {
        await axios.delete(`/favorites/${courseId}`, { headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken")}` } });
        setFavorites((prev) => prev.filter((id) => id !== courseId));
      } else {
        await axios.post(`/favorites/add/${courseId}`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken")}` } });
        setFavorites((prev) => [...prev, courseId]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ background: pageBg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <div className="container" style={{ maxWidth: 900, margin: '0 auto', flex: 1, paddingTop: 48, paddingBottom: 48, marginTop: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
          {data.map((val, i) => (
            <div
              key={i}
              className="course-card"
              style={{
                background: formBg,
                borderRadius: 16,
                boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 220,
                transition: 'transform 0.18s cubic-bezier(.4,0,.2,1), box-shadow 0.25s cubic-bezier(.4,0,.2,1)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.04)';
                e.currentTarget.style.boxShadow = dark
                  ? '0 8px 32px rgba(68,133,237,0.18)'
                  : '0 8px 32px rgba(68,133,237,0.13)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = dark
                  ? '0 2px 8px rgba(0,0,0,0.12)'
                  : '0 2px 8px rgba(0,0,0,0.04)';
              }}
            >
              {/* изображение */}
              {val.logoUrl ? (
                <img src={val.logoUrl} alt={val.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }} />
              ) : (
                <div style={{ width: '100%', height: 160, background: '#e0e0e0', borderRadius: 12, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: '#8c8c8c' }}>?</div>
              )}

              {/* значок избранного — только для USER */}
              {userRole === 'USER' && (
                <button
                  onClick={(e) => toggleFavorite(val.id, e)}
                  title={favorites.includes(val.id) ? "Убрать из избранного" : "В избранное"}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    alignSelf: "flex-end",
                    marginBottom: 8,
                    color: favorites.includes(val.id) ? "#f5c518" : dark ? "#ddd" : "#666",
                    fontSize: 22,
                  }}
                >
                  <FontAwesomeIcon icon={favorites.includes(val.id) ? faSolidStar : faRegularStar} />
                </button>
              )}
              <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 12, color: dark ? '#eaf4fd' : '#3976a8' }}>{val.name}</h3>
              <p style={{ color: fieldColor, fontSize: 16, marginBottom: 18 }}>{val.description}</p>
              <a href={`${process.env.PUBLIC_URL}/blog-details-left-sidebar/${val.id}`} style={{ color: '#fff', background: '#3976a8', borderRadius: 12, padding: '10px 24px', fontWeight: 600, fontSize: 16, textAlign: 'center', textDecoration: 'none', marginTop: 'auto', alignSelf: 'flex-start', transition: 'background 0.18s' }}>{t('footer.articles') || 'Подробнее'}</a>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 'auto' }}><Footer /></div>
    </div>
  );
};

export default Services;

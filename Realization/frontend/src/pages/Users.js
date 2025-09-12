import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import axios from '../utils/axios';
import jwt_decode from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  FaMapMarkerAlt, 
  FaFlag, 
  FaBuilding, 
  FaBriefcase, 
  FaIdBadge, 
  FaBullseye, 
  FaInfoCircle, 
  FaEnvelope, 
  FaQuoteLeft, 
  FaUserTie,
  FaTimes
} from 'react-icons/fa';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import useTheme from '../hooks/useTheme';
import { getAvatarUrl } from '../utils/minioUtils';

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

function Users() {
  const { t } = useLanguage();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // Компонент модального окна профиля пользователя (как в чате)
  function UserProfileModal({ user, profile, onClose, dark, theme, borderColor, fieldColor }) {
    if (!user) return null;
    
    // Отладочная информация
    console.log('UserProfileModal render:', { 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        avatar: user.avatar,
        name: user.name,
        role: user.role
      }, 
      profile: { 
        avatar: profile?.avatar,
        bio: profile?.bio,
        skills: profile?.skills,
        city: profile?.city,
        country: profile?.country,
        company: profile?.company,
        position: profile?.position,
        jobTitle: profile?.jobTitle,
        goal: profile?.goal,
        status: profile?.status
      } 
    });
    
    const primaryColor = dark ? '#1e88e5' : '#3976a8';
    const iconMap = {
      city: <FaMapMarkerAlt />, 
      country: <FaFlag />, 
      company: <FaBuilding />, 
      position: <FaBriefcase />, 
      jobTitle: <FaIdBadge />, 
      goal: <FaBullseye />, 
      status: <FaInfoCircle />,
      companyRole: <FaUserTie />
    };
    const iconColors = {
      city: 'rgb(229, 115, 115)',
      country: 'rgb(129, 199, 132)',
      company: 'rgb(255, 213, 79)',
      position: 'rgb(100, 181, 246)',
      jobTitle: 'rgb(186, 104, 200)',
      goal: 'rgb(255, 138, 101)',
      status: 'rgb(77, 208, 225)',
      companyRole: 'rgb(76, 175, 80)'
    };
    
    const rows = [
      { key: 'city', label: t('profile.city'), value: profile?.city },
      { key: 'country', label: t('profile.country'), value: profile?.country },
      { key: 'company', label: t('profile.company'), value: profile?.company },
      { key: 'companyRole', label: t('profile.position'), value: profile?.companyRole },
      { key: 'position', label: t('profile.position'), value: translateValue('position', profile?.position) },
      { key: 'jobTitle', label: t('profile.job_title'), value: translateValue('jobTitle', profile?.jobTitle) },
      { key: 'goal', label: t('profile.goal'), value: translateValue('goal', profile?.goal) },
      { key: 'status', label: t('profile.status'), value: profile?.status },
    ].filter(r => r.value && String(r.value).trim() !== '');
    
    const skills = profile?.skills || [];
    const lightGradient = 'linear-gradient(135deg,#e0eafc 0%, #cfdef3 100%)';
    const modalStyle = {
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      background: dark ? 'linear-gradient(135deg,#232526 0%,#414345 100%)' : lightGradient,
      borderRadius: 24,
      boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.38)' : '0 8px 32px rgba(0,0,0,0.14)',
      padding: 44, minWidth: 340, maxWidth: 440, width: '92vw', zIndex: 10001,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      border: `1.5px solid ${dark ? borderColor : '#b6d4fe'}`,
      color: dark ? '#eaf4fd' : '#1a2a3a',
      animation: 'fadeInModal .25s ease'
    };
    
    return (
      <>
        {/* Backdrop */}
        <div 
          onClick={onClose} 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#0008',
            zIndex: 10000
          }}
        />
        {/* Modal */}
        <div style={modalStyle}>
          {/* close x */}
          <FaTimes onClick={onClose} style={{position:'absolute',top:18,right:22,cursor:'pointer',fontSize:18,color:dark?'#eaf4fd':'#666'}}/>
          {/* avatar */}
          <div style={{ width: 120, height: 120, borderRadius: '50%', border: `3px solid ${primaryColor}`, overflow: 'hidden', marginBottom: 16 }}>
            {console.log('Avatar debug:', { profileAvatar: profile?.avatar, userAvatar: user.avatar, finalAvatar: profile?.avatar || user.avatar })}
            {(profile?.avatar || user.avatar) ? (
              <img 
                src={(() => {
                  const avatarUrl = getAvatarUrl(profile?.avatar || user.avatar);
                  console.log('Avatar URL generated:', avatarUrl);
                  return avatarUrl;
                })()}
                alt="Avatar" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  console.log('Avatar failed to load, showing fallback');
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div style={{ 
              width: '100%', 
              height: '100%', 
              background: '#f0f0f0', 
              display: (profile?.avatar || user.avatar) ? 'none' : 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: 48, 
              color: '#ccc' 
            }}>
              {user.username?.[0]?.toUpperCase() || '👤'}
            </div>
          </div>
          {/* name */}
          <h2 style={{margin:0,fontSize:24,fontWeight:800,textAlign:'center',color:dark?'#eaf4fd':'#1d1d25'}}>{user.username}</h2>
          {/* email */}
          { (profile?.email || user.email) && (
            <div style={{marginTop:6,display:'flex',alignItems:'center',gap:6,fontSize:15,color:primaryColor}}>
              <FaEnvelope/> {(profile?.email || user.email)}
            </div>
          ) }
          {/* bio */}
          {profile?.bio && <div style={{marginTop:18,background:dark?'#102027':'#0d47a1',color:'#eaf4fd',borderRadius:10,padding:'10px 14px',maxWidth:'100%',fontStyle:'italic',fontSize:15,display:'flex',alignItems:'center',gap:6}}><FaQuoteLeft/> {profile.bio}</div>}
          {/* skills */}
          {Array.isArray(skills)&&skills.length>0 && (
            <div style={{marginTop:18,display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center'}}>
              {skills.map((s,i)=>(<span key={i} style={{background:primaryColor,color:'#fff',padding:'4px 10px',borderRadius:6,fontSize:13,fontWeight:700,minWidth:'fit-content',maxWidth:'200px',wordBreak:'break-word'}}>{s}</span>))}
            </div>
          )}
          {/* info rows */}
          <div style={{marginTop:24,width:'100%'}}>
            {rows.map(r=> (
              r.key === 'goal' ? (
                // Специальное отображение для цели
                <div key={r.key} style={{marginBottom:12,fontSize:15}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                    <span style={{fontSize:18,color:iconColors[r.key]||primaryColor}}>{iconMap[r.key]}</span>
                    <span style={{fontWeight:700}}>{r.label}</span>
                  </div>
                  <div style={{marginLeft:28,color:dark?'#cfd8dc':'#666',fontSize:14,lineHeight:'1.4'}}>
                    {r.value}
                  </div>
                </div>
              ) : (
                // Обычное отображение для остальных полей
                <div key={r.key} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,fontSize:15}}>
                  <span style={{fontSize:18,color:iconColors[r.key]||primaryColor}}>{iconMap[r.key]}</span>
                  <span style={{fontWeight:700,minWidth:90}}>{r.label}</span>
                  <span style={{flex:1}}>{r.value}</span>
                </div>
              )
            ))}
          </div>
          <button onClick={onClose} style={{background: dark? 'linear-gradient(90deg,#3976a8 0%, #36607e 100%)':'linear-gradient(90deg,#3976a8 0%, #b6d4fe 100%)',color:'#fff',border:'none',borderRadius:14,padding:'12px 38px',fontWeight:700,fontSize:17,marginTop:8,alignSelf:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.1)',cursor:'pointer',letterSpacing:1,transition:'background 0.2s'}}>{t('common.back')}</button>
        </div>
      </>
    );
  }
  
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
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
    });
  useEffect(() => {
    if (selected && selected.id) {
      const token = localStorage.getItem('jwtToken');
      axios.get(`/profile/user/${selected.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          console.log('Profile loaded:', res.data);
          setSelectedProfile(res.data);
        })
        .catch((error) => {
          console.error('Error loading profile:', error);
          setSelectedProfile(null);
        });
    } else {
      setSelectedProfile(null);
    }
  }, [selected]);

  function renderProfileFields(profile, user) {
    if (!profile && !user) return null;
    
    // Используем данные профиля, если они есть, иначе данные пользователя
    const data = profile || user;
    const fields = [
      { label: t('profile.first_name') + ':', value: data.name || data.firstName },
      { label: t('profile.last_name') + ':', value: data.surname || data.lastName },
      { label: t('profile.additional_names') + ':', value: data.additionalName },
      { label: t('profile.bio') + ':', value: data.bio },
      { label: t('profile.github_username') + ':', value: data.githubusername },
      { label: t('profile.skills_info') + ':', value: data.skills && data.skills.length ? data.skills.join(', ') : null },
      // Скрываем поле "Работа" если выбрано "Выбрать должность"
      ...(data.jobTitle && data.jobTitle !== 'Выбрать должность' ? [{ label: t('profile.job_title') + ':', value: translateValue('jobTitle', data.jobTitle) }] : []),
      { label: t('profile.goal') + ':', value: translateValue('goal', data.goal) },
      { label: t('profile.city') + ':', value: data.city },
      { label: t('profile.country') + ':', value: data.country },
      { label: t('profile.company') + ':', value: data.company },
      { label: t('profile.position') + ':', value: translateValue('position', data.position) },
      { label: t('profile.status') + ':', value: data.status },
      { label: t('profile.aboutMe') + ':', value: data.aboutMe },
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
        companyRole: res.data?.companyRole || '',
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

  // Функция для перевода английских значений на русский
  const translateValue = (key, value) => {
    if (!value) return '';
    
    const translations = {
      'goal': {
        'Start a career': t('goals.start_career'),
        'Change careers': t('goals.change_careers'),
        'Improve within your current role': t('goals.improve_current_role'),
        'Explore topics unrelated to work': t('goals.explore_unrelated')
      },
      'jobTitle': {
        'Выбрать должность': t('jobTitles.select_job'),
        'Data Scientist': t('jobTitles.data_scientist'),
        'Back End Developer/Engineer': t('jobTitles.back_end'),
        'Technology Consultant': t('jobTitles.technology_consultant'),
        'Machine Learning Engineer': t('jobTitles.machine_learning_engineer'),
        'Product Manager': t('jobTitles.product_manager'),
        'Business/Management Analyst': t('jobTitles.business_management_analyst'),
        'Data Warehouse Developer': t('jobTitles.data_warehouse_developer'),
        'Cyber Security Engineer': t('jobTitles.cyber_security_engineer'),
        'Video Game Developer': t('jobTitles.video_game_developer'),
        'Data Architect': t('jobTitles.data_architect'),
        'Marketing Analytics Specialist': t('jobTitles.marketing_analytics_specialist'),
        'Logistics/Supply Chain Analyst': t('jobTitles.logistics_supply_chain_analyst'),
        'IT Project Manager': t('jobTitles.it_project_manager'),
        'Business Intelligence Analyst': t('jobTitles.business_intelligence_analyst'),
        'Data Analyst': t('jobTitles.data_analyst'),
        'Statistician': t('jobTitles.statistician'),
        'Mainframe Developer': t('jobTitles.mainframe_developer'),
        'Project Manager': t('jobTitles.project_manager'),
        'Business Analyst (general)': t('jobTitles.business_analyst_general'),
        'Tax Analyst/Specialist': t('jobTitles.tax_analyst_specialist'),
        'Automation Engineer': t('jobTitles.automation_engineer'),
        'Cyber/Information Security Engineer/Analyst': t('jobTitles.cyber_information_security_engineer_analyst'),
        'Real Estate Agent': t('jobTitles.real_estate_agent'),
        'Technical Support Engineer/Analyst': t('jobTitles.technical_support_engineer_analyst'),
        'Social Media Strategist/Specialist': t('jobTitles.social_media_strategist_specialist'),
        'UI/UX Manager': t('jobTitles.ui_ux_manager'),
        'Data Engineer': t('jobTitles.data_engineer'),
        'iOS Developer/Engineer': t('jobTitles.ios_developer_engineer'),
        'Cloud Architect': t('jobTitles.cloud_architect'),
        'Sales Representative': t('jobTitles.sales_representative'),
        'Human Resources Specialist': t('jobTitles.human_resources_specialist'),
        'Scrum Master': t('jobTitles.scrum_master'),
        'Full Stack Developer': t('jobTitles.full_stack_developer'),
        'Sales Development Representative': t('jobTitles.sales_development_representative'),
        'Digital Marketing Specialist': t('jobTitles.digital_marketing_specialist'),
        'Bookkeeper / Accounting Clerk': t('jobTitles.bookkeeper_accounting_clerk'),
        'Solutions/Application Architect': t('jobTitles.solutions_application_architect'),
        'Network/Systems Administrator': t('jobTitles.network_systems_administrator'),
        'Customer Service Representative': t('jobTitles.customer_service_representative'),
        'Front End Developer': t('jobTitles.front_end_developer'),
        'Application Developer/Engineer': t('jobTitles.application_developer_engineer'),
        'Network Engineer/Architect': t('jobTitles.network_engineer_architect'),
        'Cyber Security Specialist/Technician': t('jobTitles.cyber_security_specialist_technician'),
        'Actuary': t('jobTitles.actuary'),
        'DevOps Engineer': t('jobTitles.devops_engineer'),
        'Sales Operations Specialist': t('jobTitles.sales_operations_specialist'),
        'Android Developer/Engineer': t('jobTitles.android_developer_engineer'),
        'Risk Consultant': t('jobTitles.risk_consultant'),
        'Computer Support Specialist': t('jobTitles.computer_support_specialist'),
        'Business Intelligence Architect/Developer': t('jobTitles.business_intelligence_architect_developer'),
        'Chief Data Officer': t('jobTitles.chief_data_officer'),
        'Career Counselor': t('jobTitles.career_counselor'),
        'Computer Scientist': t('jobTitles.computer_scientist'),
        'Analytics Manager': t('jobTitles.analytics_manager'),
        'Risk Analyst': t('jobTitles.risk_analyst'),
        'Market Research Analyst': t('jobTitles.market_research_analyst'),
        'Strategic Planner/Analyst': t('jobTitles.strategic_planner_analyst'),
        'Business/Management Consultant': t('jobTitles.business_management_consultant'),
        'Diversity, Equity, and Inclusion Specialist': t('jobTitles.dei_specialist'),
        'Aerospace Engineer': t('jobTitles.aerospace_engineer'),
        'Fraud Examiner/Analyst': t('jobTitles.fraud_examiner_analyst'),
        'Corporate Development Analyst': t('jobTitles.corporate_development_analyst'),
        'Data/Data Mining Analyst': t('jobTitles.data_data_mining_analyst'),
        'Advertising/Promotions Manager': t('jobTitles.advertising_promotions_manager'),
        'Business Program Analyst': t('jobTitles.business_program_analyst'),
        'Program Manager': t('jobTitles.program_manager'),
        'Pricing Analyst': t('jobTitles.pricing_analyst'),
        'Researcher/Research Associate': t('jobTitles.researcher_research_associate'),
        'Marketing Analyst': t('jobTitles.marketing_analyst'),
        'Data Manager': t('jobTitles.data_manager'),
        'Biologist': t('jobTitles.biologist'),
        'Talent Acquisition/Recruiting Manager': t('jobTitles.talent_acquisition_recruiting_manager'),
        'Business Development Manager': t('jobTitles.business_development_manager'),
        'Business Analysis Manager': t('jobTitles.business_analysis_manager'),
        'Sustainability Specialist': t('jobTitles.sustainability_specialist'),
        'Supply Chain Analyst': t('jobTitles.supply_chain_analyst'),
        'Human Resources Consultant': t('jobTitles.hr_consultant'),
        'E-commerce Analyst': t('jobTitles.e_commerce_analyst'),
        'Compensation/Benefits Analyst': t('jobTitles.compensation_benefits_analyst'),
        'Financial Quantitative Analyst': t('jobTitles.financial_quantitative_analyst'),
        'Human Resources Analyst': t('jobTitles.human_resources_analyst'),
        'Project Management Analyst': t('jobTitles.project_management_analyst'),
        'Writer': t('jobTitles.writer'),
        'Director of Project Management': t('jobTitles.director_of_project_management'),
        'Product Development Manager': t('jobTitles.product_development_manager'),
        'Chemical/Process Engineer': t('jobTitles.chemical_process_engineer'),
        'Systems Integration Engineer/Specialist': t('jobTitles.systems_integration_engineer_specialist')
      }
    };
    
    return translations[key]?.[value] || value;
  };

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: dark ? '#1a1a1a' : '#f8f9fa',
        color: dark ? '#ffffff' : '#333333'
      }}>
        <NavBar />
        
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '40px 20px',
          minHeight: 'calc(100vh - 200px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Заголовок страницы */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '40px' 
          }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              marginBottom: '10px',
              color: dark ? '#ffffff' : '#333333'
            }}>
              {t('users.title')}
            </h1>
          </div>

          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            background: dark ? '#2d2d2d' : '#ffffff',
            borderRadius: '12px',
            border: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
            maxWidth: '500px'
          }}>
            <FontAwesomeIcon 
              icon={faUsers} 
              style={{ 
                fontSize: '3rem', 
                color: '#6c757d', 
                marginBottom: '20px' 
              }} 
            />
            <h3 style={{ 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              marginBottom: '10px',
              color: dark ? '#ffffff' : '#333333'
            }}>
              {t('auth.login_required')}
            </h3>
            <p style={{ 
              color: dark ? '#cccccc' : '#666666',
              marginBottom: '30px',
              fontSize: '1rem',
              lineHeight: '1.6',
              maxWidth: '400px'
            }}>
              {t('users.login_to_view_description')}
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '15px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => history.push('/login')}
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
                {t('auth.login')}
              </button>
              <button
                onClick={() => history.push('/register')}
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
                {t('auth.register')}
              </button>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

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
                      <img src={getAvatarUrl(u.avatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
          <UserProfileModal 
            user={selected}
            profile={selectedProfile}
            onClose={() => setSelected(null)}
            dark={dark}
            theme={theme}
            borderColor={borderColor}
            fieldColor={fieldColor}
          />
        )}
        {editOpen && editUser && (
          <>
            <div onClick={()=>setEditOpen(false)} style={{ position:'fixed', inset:0, background:'#0007', zIndex:1000 }} />
            <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background: formBg, color: fieldColor, border:`1px solid ${borderColor}`, borderRadius:16, padding:24, width:560, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto', zIndex:1001 }}>
              <h3 style={{ marginTop:0, marginBottom:12, color: theme === 'dark' ? '#ffffff' : '#333333' }}>{t('users.edit_profile')}: {editUser.username || editUser.email}</h3>
              
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
                    src={getAvatarUrl(editUser.avatar)} 
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
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'dark' ? '#ffffff' : '#333333' }}>{t('profile.username')}</label>
                  <input placeholder="Username" value={editProfile.username||''} onChange={e=>setEditProfile(p=>({...p, username:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor, width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'dark' ? '#ffffff' : '#333333' }}>{t('profile.email')}</label>
                  <input placeholder="Email" value={editProfile.email||''} onChange={e=>setEditProfile(p=>({...p, email:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor, width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'dark' ? '#ffffff' : '#333333' }}>{t('profile.first_name')}</label>
                  <input placeholder={t('profile.first_name')} value={editProfile.name||''} onChange={e=>setEditProfile(p=>({...p, name:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor, width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'dark' ? '#ffffff' : '#333333' }}>{t('profile.last_name')}</label>
                  <input placeholder={t('profile.last_name')} value={editProfile.surname||''} onChange={e=>setEditProfile(p=>({...p, surname:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor, width: '100%' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'dark' ? '#ffffff' : '#333333' }}>{t('profile.additional_names')}</label>
                  <input placeholder={t('profile.additional_names')} value={editProfile.additionalName||''} onChange={e=>setEditProfile(p=>({...p, additionalName:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor, width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'dark' ? '#ffffff' : '#333333' }}>{t('profile.role')}</label>
                  <select value={editProfile.role||'USER'} onChange={e=>setEditProfile(p=>({...p, role:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor, width: '100%' }}>
                  <option value="USER">{t('users.user')}</option>
                  <option value="ADMIN">{t('users.admin')}</option>
                </select>
              </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'dark' ? '#ffffff' : '#333333' }}>{t('profile.job_title')}</label>
                  <select value={editProfile.jobTitle||''} onChange={e=>setEditProfile(p=>({...p, jobTitle:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor, width: '100%' }}>
                    <option value="">{t('profile.select_job_title')}</option>
                  <option value="Back End Developer/Engineer">{t('jobTitles.back_end')}</option>
                  <option value="Data Scientist">{t('jobTitles.data_scientist')}</option>
                  <option value="Technology Consultant">{t('jobTitles.technology_consultant')}</option>
                  <option value="Machine Learning Engineer">{t('jobTitles.machine_learning_engineer')}</option>
                  <option value="Product Manager">{t('jobTitles.product_manager')}</option>
                  <option value="Business/Management Analyst">{t('jobTitles.business_management_analyst')}</option>
                  <option value="Data Warehouse Developer">{t('jobTitles.data_warehouse_developer')}</option>
                  <option value="Cyber Security Engineer">{t('jobTitles.cyber_security_engineer')}</option>
                  <option value="Video Game Developer">{t('jobTitles.video_game_developer')}</option>
                  <option value="Data Architect">{t('jobTitles.data_architect')}</option>
                  <option value="Marketing Analytics Specialist">{t('jobTitles.marketing_analytics_specialist')}</option>
                  <option value="Logistics/Supply Chain Analyst">{t('jobTitles.logistics_supply_chain_analyst')}</option>
                  <option value="IT Project Manager">{t('jobTitles.it_project_manager')}</option>
                  <option value="Business Intelligence Analyst">{t('jobTitles.business_intelligence_analyst')}</option>
                  <option value="Data Analyst">{t('jobTitles.data_analyst')}</option>
                  <option value="Statistician">{t('jobTitles.statistician')}</option>
                  <option value="Mainframe Developer">{t('jobTitles.mainframe_developer')}</option>
                  <option value="Project Manager">{t('jobTitles.project_manager')}</option>
                  <option value="Business Analyst (general)">{t('jobTitles.business_analyst_general')}</option>
                  <option value="Back End Developer/Engineer">{t('jobTitles.back_end') || 'Back End Developer/Engineer'}</option>
                  <option value="Data Scientist">{t('jobTitles.data_scientist') || 'Data Scientist'}</option>
                  <option value="Technology Consultant">{t('jobTitles.technology_consultant') || 'Technology Consultant'}</option>
                  <option value="Machine Learning Engineer">{t('jobTitles.machine_learning_engineer') || 'Machine Learning Engineer'}</option>
                  <option value="Product Manager">{t('jobTitles.product_manager') || 'Product Manager'}</option>
                  <option value="Business/Management Analyst">{t('jobTitles.business_management_analyst') || 'Business/Management Analyst'}</option>
                  <option value="Data Warehouse Developer">{t('jobTitles.data_warehouse_developer') || 'Data Warehouse Developer'}</option>
                  <option value="Cyber Security Engineer">{t('jobTitles.cyber_security_engineer') || 'Cyber Security Engineer'}</option>
                  <option value="Video Game Developer">{t('jobTitles.video_game_developer') || 'Video Game Developer'}</option>
                  <option value="Data Architect">{t('jobTitles.data_architect') || 'Data Architect'}</option>
                  <option value="Marketing Analytics Specialist">{t('jobTitles.marketing_analytics_specialist') || 'Marketing Analytics Specialist'}</option>
                  <option value="Logistics/Supply Chain Analyst">{t('jobTitles.logistics_supply_chain_analyst') || 'Logistics/Supply Chain Analyst'}</option>
                  <option value="IT Project Manager">{t('jobTitles.it_project_manager') || 'IT Project Manager'}</option>
                  <option value="Business Intelligence Analyst">{t('jobTitles.business_intelligence_analyst') || 'Business Intelligence Analyst'}</option>
                  <option value="Data Analyst">{t('jobTitles.data_analyst') || 'Data Analyst'}</option>
                  <option value="Statistician">{t('jobTitles.statistician') || 'Statistician'}</option>
                  <option value="Mainframe Developer">{t('jobTitles.mainframe_developer') || 'Mainframe Developer'}</option>
                  <option value="Project Manager">{t('jobTitles.project_manager') || 'Project Manager'}</option>
                  <option value="Business Analyst (general)">{t('jobTitles.business_analyst_general') || 'Business Analyst (general)'}</option>
                  <option value="Tax Analyst/Specialist">{t('jobTitles.tax_analyst_specialist') || 'Tax Analyst/Specialist'}</option>
                  <option value="Automation Engineer">{t('jobTitles.automation_engineer') || 'Automation Engineer'}</option>
                  <option value="Cyber/Information Security Engineer/Analyst">{t('jobTitles.cyber_information_security_engineer_analyst') || 'Cyber/Information Security Engineer/Analyst'}</option>
                  <option value="Real Estate Agent">{t('jobTitles.real_estate_agent') || 'Real Estate Agent'}</option>
                  <option value="Technical Support Engineer/Analyst">{t('jobTitles.technical_support_engineer_analyst') || 'Technical Support Engineer/Analyst'}</option>
                  <option value="Social Media Strategist/Specialist">{t('jobTitles.social_media_strategist_specialist') || 'Social Media Strategist/Specialist'}</option>
                  <option value="UI/UX Manager">{t('jobTitles.ui_ux_manager') || 'UI/UX Manager'}</option>
                  <option value="Data Engineer">{t('jobTitles.data_engineer') || 'Data Engineer'}</option>
                  <option value="iOS Developer/Engineer">{t('jobTitles.ios_developer_engineer') || 'iOS Developer/Engineer'}</option>
                  <option value="Cloud Architect">{t('jobTitles.cloud_architect') || 'Cloud Architect'}</option>
                  <option value="Sales Representative">{t('jobTitles.sales_representative') || 'Sales Representative'}</option>
                  <option value="Human Resources Specialist">{t('jobTitles.human_resources_specialist') || 'Human Resources Specialist'}</option>
                  <option value="Scrum Master">{t('jobTitles.scrum_master') || 'Scrum Master'}</option>
                  <option value="Full Stack Developer">{t('jobTitles.full_stack_developer') || 'Full Stack Developer'}</option>
                  <option value="Sales Development Representative">{t('jobTitles.sales_development_representative') || 'Sales Development Representative'}</option>
                  <option value="Digital Marketing Specialist">{t('jobTitles.digital_marketing_specialist') || 'Digital Marketing Specialist'}</option>
                  <option value="Bookkeeper / Accounting Clerk">{t('jobTitles.bookkeeper_accounting_clerk') || 'Bookkeeper / Accounting Clerk'}</option>
                  <option value="Solutions/Application Architect">{t('jobTitles.solutions_application_architect') || 'Solutions/Application Architect'}</option>
                  <option value="Network/Systems Administrator">{t('jobTitles.network_systems_administrator') || 'Network/Systems Administrator'}</option>
                  <option value="Customer Service Representative">{t('jobTitles.customer_service_representative') || 'Customer Service Representative'}</option>
                  <option value="Front End Developer">{t('jobTitles.front_end_developer') || 'Front End Developer'}</option>
                  <option value="Application Developer/Engineer">{t('jobTitles.application_developer_engineer') || 'Application Developer/Engineer'}</option>
                  <option value="Network Engineer/Architect">{t('jobTitles.network_engineer_architect') || 'Network Engineer/Architect'}</option>
                  <option value="Cyber Security Specialist/Technician">{t('jobTitles.cyber_security_specialist_technician') || 'Cyber Security Specialist/Technician'}</option>
                  <option value="Actuary">{t('jobTitles.actuary') || 'Actuary'}</option>
                  <option value="DevOps Engineer">{t('jobTitles.devops_engineer') || 'DevOps Engineer'}</option>
                  <option value="Sales Operations Specialist">{t('jobTitles.sales_operations_specialist') || 'Sales Operations Specialist'}</option>
                  <option value="Android Developer/Engineer">{t('jobTitles.android_developer_engineer') || 'Android Developer/Engineer'}</option>
                  <option value="Risk Consultant">{t('jobTitles.risk_consultant') || 'Risk Consultant'}</option>
                  <option value="Computer Support Specialist">{t('jobTitles.computer_support_specialist') || 'Computer Support Specialist'}</option>
                  <option value="Business Intelligence Architect/Developer">{t('jobTitles.business_intelligence_architect_developer') || 'Business Intelligence Architect/Developer'}</option>
                  <option value="Chief Data Officer">{t('jobTitles.chief_data_officer') || 'Chief Data Officer'}</option>
                  <option value="Career Counselor">{t('jobTitles.career_counselor') || 'Career Counselor'}</option>
                  <option value="Computer Scientist">{t('jobTitles.computer_scientist') || 'Computer Scientist'}</option>
                  <option value="Analytics Manager">{t('jobTitles.analytics_manager') || 'Analytics Manager'}</option>
                  <option value="Risk Analyst">{t('jobTitles.risk_analyst') || 'Risk Analyst'}</option>
                  <option value="Market Research Analyst">{t('jobTitles.market_research_analyst') || 'Market Research Analyst'}</option>
                  <option value="Strategic Planner/Analyst">{t('jobTitles.strategic_planner_analyst') || 'Strategic Planner/Analyst'}</option>
                  <option value="Business/Management Consultant">{t('jobTitles.business_management_consultant') || 'Business/Management Consultant'}</option>
                  <option value="Diversity, Equity, and Inclusion Specialist">{t('jobTitles.dei_specialist') || 'Diversity, Equity, and Inclusion Specialist'}</option>
                  <option value="Aerospace Engineer">{t('jobTitles.aerospace_engineer') || 'Aerospace Engineer'}</option>
                  <option value="Fraud Examiner/Analyst">{t('jobTitles.fraud_examiner_analyst') || 'Fraud Examiner/Analyst'}</option>
                  <option value="Corporate Development Analyst">{t('jobTitles.corporate_development_analyst') || 'Corporate Development Analyst'}</option>
                  <option value="Data/Data Mining Analyst">{t('jobTitles.data_data_mining_analyst') || 'Data/Data Mining Analyst'}</option>
                  <option value="Advertising/Promotions Manager">{t('jobTitles.advertising_promotions_manager') || 'Advertising/Promotions Manager'}</option>
                  <option value="Business Program Analyst">{t('jobTitles.business_program_analyst') || 'Business Program Analyst'}</option>
                  <option value="Program Manager">{t('jobTitles.program_manager') || 'Program Manager'}</option>
                  <option value="Pricing Analyst">{t('jobTitles.pricing_analyst') || 'Pricing Analyst'}</option>
                  <option value="Researcher/Research Associate">{t('jobTitles.researcher_research_associate') || 'Researcher/Research Associate'}</option>
                  <option value="Marketing Analyst">{t('jobTitles.marketing_analyst') || 'Marketing Analyst'}</option>
                  <option value="Data Manager">{t('jobTitles.data_manager') || 'Data Manager'}</option>
                  <option value="Biologist">{t('jobTitles.biologist') || 'Biologist'}</option>
                  <option value="Talent Acquisition/Recruiting Manager">{t('jobTitles.talent_acquisition_recruiting_manager') || 'Talent Acquisition/Recruiting Manager'}</option>
                  <option value="Business Development Manager">{t('jobTitles.business_development_manager') || 'Business Development Manager'}</option>
                  <option value="Business Analysis Manager">{t('jobTitles.business_analysis_manager') || 'Business Analysis Manager'}</option>
                  <option value="Sustainability Specialist">{t('jobTitles.sustainability_specialist') || 'Sustainability Specialist'}</option>
                  <option value="Supply Chain Analyst">{t('jobTitles.supply_chain_analyst') || 'Supply Chain Analyst'}</option>
                  <option value="Human Resources Consultant">{t('jobTitles.hr_consultant') || 'Human Resources Consultant'}</option>
                  <option value="E-commerce Analyst">{t('jobTitles.e_commerce_analyst') || 'E-commerce Analyst'}</option>
                  <option value="Compensation/Benefits Analyst">{t('jobTitles.compensation_benefits_analyst') || 'Compensation/Benefits Analyst'}</option>
                  <option value="Financial Quantitative Analyst">{t('jobTitles.financial_quantitative_analyst') || 'Financial Quantitative Analyst'}</option>
                  <option value="Human Resources Analyst">{t('jobTitles.human_resources_analyst') || 'Human Resources Analyst'}</option>
                  <option value="Project Management Analyst">{t('jobTitles.project_management_analyst') || 'Project Management Analyst'}</option>
                  <option value="Writer">{t('jobTitles.writer') || 'Writer'}</option>
                  <option value="Director of Project Management">{t('jobTitles.director_of_project_management') || 'Director of Project Management'}</option>
                  <option value="Product Development Manager">{t('jobTitles.product_development_manager') || 'Product Development Manager'}</option>
                  <option value="Chemical/Process Engineer">{t('jobTitles.chemical_process_engineer') || 'Chemical/Process Engineer'}</option>
                  <option value="Systems Integration Engineer/Specialist">{t('jobTitles.systems_integration_engineer_specialist') || 'Systems Integration Engineer/Specialist'}</option>
                </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'dark' ? '#ffffff' : '#333333' }}>{t('profile.position')}</label>
                  <input placeholder={t('profile.position')} value={editProfile.position||''} onChange={e=>setEditProfile(p=>({...p, position:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor, width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'dark' ? '#ffffff' : '#333333' }}>{t('profile.company')}</label>
                  <input placeholder={t('profile.company')} value={editProfile.company||''} onChange={e=>setEditProfile(p=>({...p, company:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor, width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'dark' ? '#ffffff' : '#333333' }}>{t('profile.city')}</label>
                  <input placeholder={t('profile.city')} value={editProfile.city||''} onChange={e=>setEditProfile(p=>({...p, city:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor, width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'dark' ? '#ffffff' : '#333333' }}>{t('profile.country')}</label>
                  <input placeholder={t('profile.country')} value={editProfile.country||''} onChange={e=>setEditProfile(p=>({...p, country:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor, width: '100%' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'dark' ? '#ffffff' : '#333333' }}>{t('profile.bio')}</label>
                <textarea placeholder={t('profile.bio')} value={editProfile.bio||''} onChange={e=>setEditProfile(p=>({...p, bio:e.target.value}))} style={{ marginTop:0, width:'100%', minHeight:80, padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'dark' ? '#ffffff' : '#333333' }}>{t('profile.skills')}</label>
                <input placeholder={t('profile.ed_skills_info')} value={editProfile.skills||''} onChange={e=>setEditProfile(p=>({...p, skills:e.target.value}))} style={{ marginTop:0, width:'100%', padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'dark' ? '#ffffff' : '#333333' }}>{t('profile.goal')}</label>
                  <select value={editProfile.goal||''} onChange={e=>setEditProfile(p=>({...p, goal:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor, width: '100%' }}>
                    <option value="">{t('goals.select')}</option>
                    <option value="Start a career">{t('goals.start_career')}</option>
                    <option value="Change careers">{t('goals.change_careers')}</option>
                    <option value="Improve within your current role">{t('goals.improve_current_role')}</option>
                    <option value="Explore topics unrelated to work">{t('goals.explore_unrelated')}</option>
                  </select>
              </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'dark' ? '#ffffff' : '#333333' }}>{t('profile.status')}</label>
                  <input placeholder={t('profile.status')} value={editProfile.status||''} onChange={e=>setEditProfile(p=>({...p, status:e.target.value}))} style={{ padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor, width: '100%' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'dark' ? '#ffffff' : '#333333' }}>{t('profile.github_username')}</label>
                <input placeholder={t('profile.github_username')} value={editProfile.githubusername||''} onChange={e=>setEditProfile(p=>({...p, githubusername:e.target.value}))} style={{ marginTop:0, width:'100%', padding:10, border:`1px solid ${borderColor}`, borderRadius:8, background: fieldBg, color: fieldColor }} />
              </div>
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

export default Users; 
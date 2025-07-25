import React, { useEffect, useRef, useState, useMemo } from 'react';
import io from 'socket.io-client';
import i18n from '../i18n';
import { useHistory } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaUser, FaGlobe, FaCode, FaBuilding, FaStar, FaRegStar, FaUserTie, FaDatabase, FaChartBar, FaProjectDiagram, FaShieldAlt, FaGamepad, FaNetworkWired, FaCloud, FaMobileAlt, FaUsers, FaCogs, FaBug, FaRobot, FaUserSecret, FaUserCog, FaUserGraduate, FaUserEdit, FaUserMd, FaUserNurse, FaUserCheck, FaUserClock, FaUserFriends, FaUserPlus, FaUserTimes, FaUserMinus, FaUserCircle, FaUserAlt, FaUserAltSlash, FaUserLock, FaUserShield, FaUserTag, FaUserSlash, FaUserAstronaut, FaUserNinja, FaUserInjured, FaUserMdChat, FaLeaf, FaJava, FaPython, FaJs, FaNodeJs, FaPhp, FaGem, FaApple, FaAndroid, FaDocker, FaCube, FaVial, FaPaintBrush, FaHeadset, FaReact, FaLinux, FaWindows, FaGitAlt, FaCodeBranch, FaLink, FaFileAlt, FaImage, FaSignOutAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileArchive, FaFileVideo, FaFileAudio, FaFileImage, FaVideo, FaMusic, FaMapMarkerAlt, FaFlag, FaBriefcase, FaIdBadge, FaBullseye, FaInfoCircle, FaEnvelope, FaQuoteLeft, FaTimes } from 'react-icons/fa';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import axios from 'axios';
import Linkify from 'react-linkify';
// import 'emoji-mart/css/emoji-mart.css'; // Удалено для emoji-mart v5+

const t = i18n.t.bind(i18n);
const SOCKET_URL = 'https://localhost:9000';
const SERVER_URL = 'https://localhost:9000';

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

// 1. Emoji validation helper:
function isValidEmoji(str) {
  // Проверяем, что строка не пустая и содержит хотя бы один emoji-символ
  // (простая проверка: длина > 0 и не только пробелы, и содержит emoji)
  return typeof str === 'string' && str.trim().length > 0 && /\p{Emoji}/u.test(str);
}

// 1.1. Aggregate reactions helper: преобразует массив реакций в объект {emoji: {count, users}}
function aggregateReactions(arr) {
  if (!Array.isArray(arr)) return {};
  return arr.reduce((acc, r) => {
    if (!r || !r.emoji) return acc;
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, users: [] };
    acc[r.emoji].count += 1;
    if (r.user) acc[r.emoji].users.push(r.user);
    return acc;
  }, {});
}

// Функция для рендера текста с ссылками
function renderMessageText(text) {
  return (
    <Linkify
      componentDecorator={(decoratedHref, decoratedText, key) => (
        <a href={decoratedHref} target="_blank" rel="noopener noreferrer" key={key} style={{ color: '#3976a8', textDecoration: 'underline', wordBreak: 'break-all' }}>{decoratedText}</a>
      )}
    >
      {text}
    </Linkify>
  );
}

// --- Modal confirm helper ---
function ConfirmModal({ open, onConfirm, onCancel, text }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onCancel} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:9998}}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:340,background:'#fff',borderRadius:12,zIndex:9999,padding:24,boxShadow:'0 4px 16px rgba(0,0,0,0.18)',display:'flex',flexDirection:'column',alignItems:'center'}}>
        <div style={{fontSize:18,fontWeight:700,marginBottom:18}}>{text}</div>
        <div style={{display:'flex',gap:12}}>
          <button onClick={onCancel} style={{background:'#eee',color:'#333',border:'none',borderRadius:8,padding:'8px 18px',fontWeight:700,fontSize:15,cursor:'pointer'}}>Отмена</button>
          <button onClick={onConfirm} style={{background:'#d32f2f',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontWeight:700,fontSize:15,cursor:'pointer'}}>Выйти</button>
        </div>
      </div>
    </>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('');
  const [theme, setTheme] = useState(null);
  const prefersDark = usePrefersDark();
  const dark = theme ? theme === 'dark' : prefersDark;
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const history = useHistory();
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // --- sidebarWidth объявляем сразу после хуков ---
  const sidebarWidth = 270;

  // --- jobTitles массив с ключами и значениями ---
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
  const specializations = jobTitles.map(j => ({ ...j, label: t('jobTitles.'+j.key) || j.value }));
  // --- Избранное ---
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('chatFavorites') || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });
  // --- Sidebar dropdowns ---
  const [openDropdown, setOpenDropdown] = useState('my');
  const randomChats = [
    'Random-AR','Random-AZ','Random-DE','Random-ES','Random-FA','Random-FR','Random-HE','Random-ID','Random-IT','Random-JA','Random-JV','Random-KK','Random-KO','Random-KY','Random-MS','Random-PL','Random-PT','Random-SD','Random-TG','Random-TH','Random-TK','Random-TL','Random-TW','Random-UR','Random-UZ','Random-VI','Random-ZH'
  ];
  // --- Генерация объектов чатов ---
  const chatObj = (id, label, icon) => ({ id, label, icon });
  const [myChatIds, setMyChatIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('myChats') || '["global"]'); } catch { return ['global']; }
  });

  const addToMyChats = (id) => {
    setMyChatIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem('myChats', JSON.stringify(updated));
      return updated;
    });
    // если раньше чат был в leftChats, убираем его
    setLeftChats(prev => {
      if(!prev.includes(id)) return prev;
      const arr = prev.filter(c=>c!==id);
      localStorage.setItem('leftChats', JSON.stringify(arr));
      return arr;
    });
  };

  const commonChats = [chatObj('global', t('chat.global') || 'Общий чат', <FaGlobe />), ...randomChats.map(name => chatObj(name, name, <FaGlobe />))];

  const allChatsArray = [...commonChats]; // will expand later after tech/company/spec defined
  // --- Left chats (localStorage) ---
  const [leftChats, setLeftChats] = useState(() => {
    try { return JSON.parse(localStorage.getItem('leftChats')||'[]'); } catch { return []; }
  });
  const visibleMyChats = myChatIds.map(id => allChatsArray.find(c => c.id === id) || chatObj(id, id, <FaGlobe />)).filter(c=>!leftChats.includes(c.id));
  // --- Технологии ---
  const techList = [
    { id: 'android', label: 'Android', icon: <FaMobileAlt /> },
    { id: 'freelancer', label: 'Freelancer', icon: <FaUserTie /> },
    { id: 'frontend', label: 'Frontend', icon: <FaCode /> },
    { id: 'immigrant', label: 'Immigrant', icon: <FaUserAlt /> },
    { id: 'java_dev', label: 'Java Developer', icon: <FaJava /> },
    { id: 'java_projects', label: 'Java-проекты', icon: <FaProjectDiagram /> },
    { id: 'qa_automation', label: 'QA Automation', icon: <FaBug /> },
    { id: 'python', label: 'Python', icon: <FaPython /> },
    { id: 'javascript', label: 'JavaScript', icon: <FaJs /> },
    { id: 'typescript', label: 'TypeScript', icon: <FaCode /> },
    { id: 'react', label: 'React', icon: <FaReact /> },
    { id: 'nodejs', label: 'Node.js', icon: <FaNodeJs /> },
    { id: 'csharp', label: 'C#', icon: <FaCode /> },
    { id: 'cpp', label: 'C++', icon: <FaCode /> },
    { id: 'php', label: 'PHP', icon: <FaPhp /> },
    { id: 'go', label: 'Go', icon: <FaCode /> },
    { id: 'ruby', label: 'Ruby', icon: <FaGem /> },
    { id: 'swift', label: 'Swift', icon: <FaApple /> },
    { id: 'kotlin', label: 'Kotlin', icon: <FaAndroid /> },
    { id: 'docker', label: 'Docker', icon: <FaDocker /> },
    { id: 'aws', label: 'AWS', icon: <FaCloud /> },
    { id: 'azure', label: 'Azure', icon: <FaCloud /> },
    { id: 'gcp', label: 'GCP', icon: <FaCloud /> },
    { id: 'linux', label: 'Linux', icon: <FaLinux /> },
    { id: 'windows', label: 'Windows', icon: <FaWindows /> },
    { id: 'git', label: 'Git', icon: <FaGitAlt /> },
    { id: 'sql', label: 'SQL', icon: <FaDatabase /> },
    { id: 'mongodb', label: 'MongoDB', icon: <FaDatabase /> },
    { id: 'graphql', label: 'GraphQL', icon: <FaCodeBranch /> },
    { id: 'devops', label: 'DevOps', icon: <FaCogs /> },
    { id: 'security', label: 'Security', icon: <FaShieldAlt /> },
    { id: 'blockchain', label: 'Blockchain', icon: <FaCube /> },
    { id: 'ai', label: 'AI', icon: <FaRobot /> },
    { id: 'ml', label: 'ML', icon: <FaRobot /> },
    { id: 'testing', label: 'Testing', icon: <FaVial /> },
    { id: 'design', label: 'Design', icon: <FaPaintBrush /> },
    { id: 'mobile', label: 'Mobile', icon: <FaMobileAlt /> },
    { id: 'cloud', label: 'Cloud', icon: <FaCloud /> },
    { id: 'support', label: 'Support', icon: <FaHeadset /> },
  ];
  const techChats = techList.map(t => chatObj(t.id, t.label, t.icon));
  // --- Компании ---
  const companyChats = [chatObj('mindforge', 'MindForge', <FaBuilding />)];
  const specializationIcons = {
    'Back End Developer/Engineer': <FaDatabase />, 'Data Scientist': <FaChartBar />, 'Technology Consultant': <FaUserTie />, 'Machine Learning Engineer': <FaRobot />, 'Product Manager': <FaProjectDiagram />, 'Business/Management Analyst': <FaChartBar />, 'Data Warehouse Developer': <FaDatabase />, 'Cyber Security Engineer': <FaShieldAlt />, 'Video Game Developer': <FaGamepad />, 'Data Architect': <FaNetworkWired />, 'Marketing Analytics Specialist': <FaChartBar />, 'Logistics/Supply Chain Analyst': <FaProjectDiagram />, 'IT Project Manager': <FaProjectDiagram />, 'Business Intelligence Analyst': <FaChartBar />, 'Data Analyst': <FaChartBar />, 'Statistician': <FaChartBar />, 'Mainframe Developer': <FaDatabase />, 'Project Manager': <FaProjectDiagram />, 'Business Analyst (general)': <FaChartBar />, 'Tax Analyst/Specialist': <FaChartBar />, 'Automation Engineer': <FaCogs />, 'Cyber/Information Security Engineer/Analyst': <FaShieldAlt />, 'Real Estate Agent': <FaBuilding />, 'Technical Support Engineer/Analyst': <FaUserCog />, 'Social Media Strategist/Specialist': <FaUsers />, 'UI/UX Manager': <FaUserEdit />, 'Data Engineer': <FaDatabase />, 'iOS Developer/Engineer': <FaMobileAlt />, 'Cloud Architect': <FaCloud />, 'Sales Representative': <FaUserCheck />, 'Human Resources Specialist': <FaUserFriends />, 'Scrum Master': <FaUserClock />, 'Full Stack Developer': <FaCode />, 'Sales Development Representative': <FaUserPlus />, 'Digital Marketing Specialist': <FaChartBar />, 'Bookkeeper / Accounting Clerk': <FaUserTie />, 'Solutions/Application Architect': <FaNetworkWired />, 'Network/Systems Administrator': <FaNetworkWired />, 'Customer Service Representative': <FaUserCheck />, 'Front End Developer': <FaCode />, 'Application Developer/Engineer': <FaCode />, 'Network Engineer/Architect': <FaNetworkWired />, 'Cyber Security Specialist/Technician': <FaShieldAlt />, 'Actuary': <FaChartBar />, 'DevOps Engineer': <FaCogs />, 'Sales Operations Specialist': <FaUserCheck />, 'Android Developer/Engineer': <FaMobileAlt />, 'Risk Consultant': <FaUserSecret />, 'Computer Support Specialist': <FaUserCog />, 'Business Intelligence Architect/Developer': <FaNetworkWired />, 'Chief Data Officer': <FaUserTie />, 'Career Counselor': <FaUserGraduate />, 'Computer Scientist': <FaUserGraduate />, 'Analytics Manager': <FaChartBar />, 'Risk Analyst': <FaUserSecret />, 'Market Research Analyst': <FaChartBar />, 'Strategic Planner/Analyst': <FaProjectDiagram />, 'Business/Management Consultant': <FaUserTie />, 'Diversity, Equity, and Inclusion Specialist': <FaUsers />, 'Aerospace Engineer': <FaUserAstronaut />, 'Fraud Examiner/Analyst': <FaUserSecret />, 'Corporate Development Analyst': <FaUserTie />, 'Data/Data Mining Analyst': <FaDatabase />, 'Advertising/Promotions Manager': <FaChartBar />, 'Business Program Analyst': <FaProjectDiagram />, 'Program Manager': <FaProjectDiagram />, 'Pricing Analyst': <FaChartBar />, 'Researcher/Research Associate': <FaUserGraduate />, 'Marketing Analyst': <FaChartBar />, 'Data Manager': <FaDatabase />, 'Biologist': <FaUserNurse />, 'Talent Acquisition/Recruiting Manager': <FaUserPlus />, 'Business Development Manager': <FaUserTie />, 'Business Analysis Manager': <FaChartBar />, 'Sustainability Specialist': <FaLeaf />, 'Supply Chain Analyst': <FaProjectDiagram />, 'HR Consultant': <FaUserTie />, 'E-commerce Analyst': <FaChartBar />, 'Compensation/Benefits Analyst': <FaChartBar />, 'Financial Quantitative Analyst': <FaChartBar />, 'Human Resources Analyst': <FaUserFriends />, 'Project Management Analyst': <FaProjectDiagram />, 'Writer': <FaUserEdit />, 'Director of Project Management': <FaProjectDiagram />, 'Product Development Manager': <FaProjectDiagram />, 'Chemical/Process Engineer': <FaCogs />, 'Systems Integration Engineer/Specialist': <FaCogs />
  };
  const specChats = specializations.map(name => chatObj(name.key, name.label, specializationIcons[name.value] || <FaUserTie />));
  // --- Sidebar секции с переводами ---
  const dropdowns = [
    { key: 'favorites', title: t('chatSidebar.favorites'), icon: <FaStar style={{marginRight:8}} />, items: favorites.map(id => {
      const all = [...myChatIds.map(id => allChatsArray.find(c => c.id === id) || chatObj(id, id, <FaGlobe />)), ...commonChats, ...techChats, ...companyChats, ...specChats];
      const chat = all.find(c => c.id === id);
      return chat || { id, label: id, icon: <FaStar /> };
    }) },
    { key: 'my', title: t('chatSidebar.my'), icon: <FaUser style={{marginRight:8}} />, items: visibleMyChats },
    { key: 'common', title: t('chatSidebar.common'), icon: <FaGlobe style={{marginRight:8}} />, items: commonChats },
    { key: 'tech', title: t('chatSidebar.tech'), icon: <FaCode style={{marginRight:8}} />, items: techChats },
    { key: 'company', title: t('chatSidebar.company'), icon: <FaBuilding style={{marginRight:8}} />, items: companyChats },
    { key: 'spec', title: t('chatSidebar.spec'), icon: <FaUserTie style={{marginRight:8}} />, items: specChats },
  ];
  // --- Функция добавления/удаления из избранного ---
  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const newFavs = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('chatFavorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  // Состояние выбранного чата
  const [selectedChat, setSelectedChat] = useState(() => commonChats[0]);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // При первом открытии страницы автоматически выбирать общий чат
  useEffect(() => {
    setSelectedChat(myChatIds.map(id => allChatsArray.find(c => c.id === id) || chatObj(id, id, <FaGlobe />))[0]);
    // eslint-disable-next-line
  }, []);

  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
    // Получить имя пользователя и userId из localStorage или токена
    const token = localStorage.getItem('jwtToken');
    let name = '';
    let uid = null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        name = payload.username || payload.name || 'Anonymous';
        uid = payload.id || payload.userId || null;
      } catch {}
    }
    setUsername(name);
    setUserId(uid);
  }, []);

  useEffect(() => {
    if (theme) localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'], secure: true });
    socketRef.current.on('chat-history', msgs => {
      setMessages(Array.isArray(msgs) ? msgs : []);
      // Собираем реакции по messageId
      const reactMap = {};
      msgs.forEach(m => {
        if (Array.isArray(m.reactions)) reactMap[m.id] = aggregateReactions(m.reactions);
      });
      setReactions(reactMap);
    });
    socketRef.current.on('chat-message', msg => {
      setMessages(prev => [...prev, msg]);
      if (Array.isArray(msg.reactions)) setReactions(prev => ({ ...prev, [msg.id]: aggregateReactions(msg.reactions) }));
    });
    // Реал-тайм реакции
    socketRef.current.on('reaction-update', ({ messageId, reactions: r }) => {
      setReactions(prev => ({ ...prev, [messageId]: aggregateReactions(r) }));
    });
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef();

  const [caption, setCaption] = useState('');

  // Загрузка сообщений выбранного чата
  useEffect(() => {
    if (!selectedChat) return;
    setLoadingMessages(true);
    axios.get(`/api/chats/${selectedChat.id}/messages`).then(res => {
      setChatMessages(res.data || []);
      // Собираем реакции по messageId
      const reactMap = {};
      (res.data || []).forEach(m => {
        if (Array.isArray(m.reactions)) reactMap[m.id] = aggregateReactions(m.reactions);
      });
      setReactions(reactMap);
    }).catch(() => setChatMessages([])).finally(() => setLoadingMessages(false));
  }, [selectedChat]);

  // Обработка входящих сообщений по сокету
  useEffect(() => {
    if (!socketRef.current) return;
    const handler = msg => {
      if (msg.chatId === selectedChat.id) {
        setChatMessages(prev => [...prev, msg]);
        if (msg.reactions) setReactions(prev => ({ ...prev, [msg.id]: aggregateReactions(msg.reactions) }));
      }
    };
    socketRef.current.on('chat-message', handler);
    return () => socketRef.current.off('chat-message', handler);
  }, [selectedChat]);

  // Обработка реакций по сокету
  useEffect(() => {
    if (!socketRef.current) return;
    const handler = ({ messageId, reactions: r, chatId }) => {
      if (chatId === selectedChat.id) {
        setReactions(prev => ({ ...prev, [messageId]: aggregateReactions(r) }));
      }
    };
    socketRef.current.on('reaction-update', handler);
    return () => socketRef.current.off('reaction-update', handler);
  }, [selectedChat]);

  const handleSend = async e => {
    e.preventDefault();
    if (!input.trim() && !file) return;
    let msg = {
      userId: userId,
      text: input,
      time: new Date().toISOString(),
      caption: caption || '',
      chatId: selectedChat.id,
    };
    if (file) {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const res = await axios.post('/api/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          if (res.data && res.data.url) {
            msg.fileUrl = res.data.url;
            msg.fileType = res.data.type;
            msg.fileName = res.data.name;
          msg.fileSize = res.data.size;
          } else {
            setToast({ visible: true, text: 'Ошибка загрузки файла' });
            return;
          }
        } catch (err) {
          setToast({ visible: true, text: 'Ошибка загрузки файла' });
          return;
      }
    }
    socketRef.current.emit('chat-message', msg);
    setInput('');
    setCaption('');
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    // добавить в My Chats при первом сообщении
    addToMyChats(selectedChat.id);
  };

  const pageBg = dark ? '#18191c' : '#f6f7fa';
  const formBg = dark ? '#23272f' : '#fff';
  const fieldColor = dark ? '#eaf4fd' : '#23272f';
  const borderColor = dark ? '#36607e' : '#e0e0e0';

  // Новый стиль для header
  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px 0 12px',
    height: 68,
    background: dark ? 'linear-gradient(90deg,#23272f 0%,#36607e 100%)' : 'linear-gradient(90deg,#e0eafc 0%,#b6d4fe 100%)',
    borderBottom: `1.5px solid ${borderColor}`,
    position: 'fixed',
    top: 0,
    left: sidebarOpen ? sidebarWidth : 0,
    right: 0,
    zIndex: 100,
    boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.06)',
    width: sidebarOpen ? `calc(100% - ${sidebarWidth}px)` : '100%',
  };

  // Новый стиль для панели управления справа
  const controlsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  // Новый стиль для облачка сообщения
  const bubbleStyle = (isMe) => ({
    background: isMe ? (dark ? '#36607e' : '#e3f2fd') : (dark ? '#213747' : '#f9fafd'),
    color: fieldColor,
    borderRadius: isMe ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
    padding: '10px 18px',
    fontSize: 16,
    maxWidth: 360,
    wordBreak: 'break-word',
    display: 'inline-block',
    marginTop: 2,
    boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
    alignSelf: isMe ? 'flex-end' : 'flex-start',
    marginLeft: isMe ? 40 : 0,
    marginRight: isMe ? 0 : 40,
    position: 'relative',
    transition: 'background 0.2s',
  });

  // Новый стиль для аватара
  const avatarStyle = (isMe) => ({
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: isMe ? (dark ? '#3976a8' : '#b6d4fe') : '#d3dbe6',
    color: isMe ? '#fff' : '#888',
    fontWeight: 700,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: isMe ? 0 : 10,
    marginLeft: isMe ? 10 : 0,
    flexShrink: 0,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  });

  // Новый стиль для панели ввода
  const inputBarStyle = {
    position: 'fixed',
    left: sidebarOpen ? sidebarWidth : 0,
    right: showRightPanel ? 320 : 0,
    bottom: 0,
    background: dark ? '#23272f' : '#fff',
    borderTop: `1.5px solid ${borderColor}`,
    padding: '16px 0',
    zIndex: 101,
    boxShadow: dark ? '0 -2px 8px rgba(0,0,0,0.10)' : '0 -2px 8px rgba(0,0,0,0.04)',
    width: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'left 0.22s, right 0.22s',
  };

  // Новый стиль для контейнера сообщений (всё слева)
  const messagesContainerStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 0 24px 0',
    marginTop: 68,
    marginBottom: 90,
    minHeight: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    alignItems: 'flex-start',
    paddingBottom: 110,
  };

  // Новый стиль для имени пользователя
  const nameStyle = (isMe) => ({
    fontWeight: 800,
    color: isMe ? (dark ? '#ffe082' : '#3976a8') : (dark ? '#7ecbff' : '#1a237e'),
    fontSize: 15,
    marginBottom: 2,
    textAlign: 'left',
    background: isMe ? (dark ? 'rgba(54,96,126,0.18)' : 'rgba(54,96,126,0.10)') : (dark ? 'rgba(126,203,255,0.10)' : 'rgba(26,35,126,0.07)'),
    borderRadius: 7,
    padding: '2px 10px',
    display: 'inline-block',
    letterSpacing: 0.2,
    border: isMe ? (dark ? '1.5px solid #ffe082' : '1.5px solid #3976a8') : (dark ? '1.5px solid #7ecbff' : '1.5px solid #1a237e'),
    boxShadow: dark ? '0 1px 4px #0002' : '0 1px 4px #0001',
    marginLeft: 0,
  });

  // Новый стиль для времени
  const timeStyle = {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
    textAlign: 'left',
  };

  // Новый placeholder для пустого чата
  const emptyStyle = {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 80,
    fontSize: 18,
    opacity: 0.7,
  };

  // --- Sidebar ---
  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: sidebarOpen ? sidebarWidth : 36,
    background: dark ? '#23272f' : '#e0eafc',
    borderRight: `1.5px solid ${borderColor}`,
    zIndex: 120,
    transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
    overflow: 'hidden',
    boxShadow: dark ? '2px 0 8px rgba(0,0,0,0.10)' : '2px 0 8px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  };

  // --- Контекстное меню для сообщений ---
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, msgIdx: null, anim: '' });
  const [contextMenuTimeout, setContextMenuTimeout] = useState(null);
  const emojiList = ['👍','😂','😮','😢','👎'];
  // --- Toast уведомление ---
  const [toast, setToast] = useState({ visible: false, text: '' });
  // --- Emoji Picker ---
  const [emojiPicker, setEmojiPicker] = useState({ visible: false, x: 0, y: 0, msgIdx: null, anim: '' });
  const [emojiPickerTimeout, setEmojiPickerTimeout] = useState(null);
  const emojiPickerRef = useRef(null);
  // --- Реакции на сообщения ---
  const [reactions, setReactions] = useState({}); // { messageId: {emoji: { count, users: [] }} }

  // Копировать текст сообщения
  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setContextMenu({ ...contextMenu, anim: 'out' });
    if (contextMenuTimeout) clearTimeout(contextMenuTimeout);
    setContextMenuTimeout(setTimeout(() => setContextMenu({ visible: false, x: 0, y: 0, msgIdx: null, anim: '' }), 180));
    setToast({ visible: true, text: 'Текст скопирован!' });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 1800);
  };
  // Forward handler убран, пункт меню больше не отображается
  // const handleForward = (msg) => {
  //   alert('Forward: ' + msg.text);
  //   setContextMenu({ ...contextMenu, anim: 'out' });
  // };

  // --- Контекстное меню: логика открытия/закрытия по правому клику ---
  const handleContextMenu = (e, i) => {
    e.preventDefault();
    if (contextMenu.visible && contextMenu.msgIdx === i) {
      // Если уже открыто на этом сообщении — закрыть с анимацией
      setContextMenu(cm => ({ ...cm, anim: 'out' }));
      if (contextMenuTimeout) clearTimeout(contextMenuTimeout);
      setContextMenuTimeout(setTimeout(() => setContextMenu({ visible: false, x: 0, y: 0, msgIdx: null, anim: '' }), 180));
    } else {
      // Открыть на новом сообщении
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, msgIdx: i, anim: 'in' });
      if (contextMenuTimeout) clearTimeout(contextMenuTimeout);
    }
  };
  // --- Emoji Picker: анимация ---
  const openEmojiPicker = (x, y, msgIdx) => {
    setEmojiPicker({ visible: true, x, y, msgIdx, anim: 'in' });
    if (emojiPickerTimeout) clearTimeout(emojiPickerTimeout);
  };
  const closeEmojiPicker = () => {
    setEmojiPicker(ep => ({ ...ep, anim: 'out' }));
    if (emojiPickerTimeout) clearTimeout(emojiPickerTimeout);
    setEmojiPickerTimeout(setTimeout(() => setEmojiPicker({ visible: false, x: 0, y: 0, msgIdx: null, anim: '' }), 180));
  };
  // Emoji реакция (открыть emoji picker)
  const handleEmoji = (msg) => {
    setContextMenu(cm => ({ ...cm, anim: 'out' }));
    if (contextMenuTimeout) clearTimeout(contextMenuTimeout);
    setContextMenuTimeout(setTimeout(() => {
      setContextMenu({ visible: false, x: 0, y: 0, msgIdx: null, anim: '' });
      openEmojiPicker(contextMenu.x, contextMenu.y, contextMenu.msgIdx);
    }, 180));
  };
  // Клик по уже поставленной реакции (добавить/убрать)
  const handleReactionClick = (msgId, code) => {
    if (!userId) {
      setToast({ visible: true, text: 'Войдите, чтобы реагировать' });
      setTimeout(() => setToast(t => ({ ...t, visible: false })), 1800);
      return;
    }
    socketRef.current.emit('reaction-toggle', { messageId: msgId, emoji: code, userId, chatId: selectedChat.id });
  };
  // Выбор эмодзи из emoji-mart
  const handleSelectEmoji = (emojiObj) => {
    const idx = emojiPicker.msgIdx;
    const msg = chatMessages[idx];
    if (!msg) return;
    const code = emojiObj.native;
    handleReactionClick(msg.id, code);
    closeEmojiPicker();
  };
  // Скрыть меню при клике вне
  useEffect(() => {
    if (!contextMenu.visible) return;
    const hide = () => {
      setContextMenu(cm => ({ ...cm, anim: 'out' }));
      if (contextMenuTimeout) clearTimeout(contextMenuTimeout);
      setContextMenuTimeout(setTimeout(() => setContextMenu({ visible: false, x: 0, y: 0, msgIdx: null, anim: '' }), 180));
    };
    window.addEventListener('click', hide);
    return () => window.removeEventListener('click', hide);
    // eslint-disable-next-line
  }, [contextMenu.visible]);
  // Скрыть emoji picker при клике вне
  useEffect(() => {
    if (!emojiPicker.visible) return;
    const handleClick = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        closeEmojiPicker();
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
    // eslint-disable-next-line
  }, [emojiPicker.visible]);

  const handleFileChange = e => {
    const f = e.target.files[0];
    setFile(f);
    if (f) {
      if (f.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = ev => setFilePreview(ev.target.result);
        reader.readAsDataURL(f);
      } else {
        setFilePreview(null);
      }
    } else {
      setFilePreview(null);
    }
  };

  const resetFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Функция для форматирования даты (Сегодня/Вчера/Дата) ---
  function getDayLabel(date) {
    if (!date) return '';
    const now = new Date();
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = (today - msgDate) / (1000 * 60 * 60 * 24);
    if (diff === 0) return t('chat.today');
    if (diff === 1) return t('chat.yesterday');
    return date.toLocaleDateString();
  }

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  useEffect(()=>{
    if(selectedUser && selectedUser.id){
      const token=localStorage.getItem('jwtToken');
      axios.get(`/profile/user/${selectedUser.id}`,{headers:{Authorization:`Bearer ${token}`}})
        .then(res=>setSelectedProfile(res.data))
        .catch(()=>setSelectedProfile(null));
    } else {
      setSelectedProfile(null);
    }
  },[selectedUser]);

  // --- Derived data ---
  const participants = useMemo(() => {
    const map = {};
    chatMessages.forEach(m => {
      const u = m.user;
      if (!u) return;
      const username = typeof u === 'object' ? (u.username || u.name) : u;
      if (!username) return;
      if (!map[username]) {
        map[username] = { id: (typeof u === 'object' ? u.id : username), username };
      }
    });
    return Object.values(map);
  }, [chatMessages]);

  const sharedLinks = useMemo(() => {
    const regex = /(https?:\/\/[\w\-\.\/?#=&%]+)/g;
    const arr = [];
    chatMessages.forEach(m => {
      if (typeof m.text === 'string') {
        const matches = m.text.match(regex);
        if (matches) arr.push(...matches);
      }
    });
    return arr;
  }, [chatMessages]);

  const sharedFiles = useMemo(() => chatMessages.filter(m => m.fileUrl && (!m.fileType || (!m.fileType.startsWith('image/') && !m.fileType.startsWith('video/')))), [chatMessages]);
  const sharedPhotos = useMemo(() => chatMessages.filter(m => m.fileUrl && (/\.(png|jpe?g|gif|webp|svg)$/i.test(m.fileUrl) || (m.fileType && m.fileType.startsWith('image/')))), [chatMessages]);

  // --- Right panel tab state ---
  const [panelTab, setPanelTab] = useState('participants');

  // Клик по элементу чата в сайдбаре
  const handleSelectChat = chat => {
    setSelectedChat(chat);
  };

  const getDownloadUrl = (msg, cleanedName) => {
    const filename = msg.fileUrl.startsWith('/') ? msg.fileUrl.split('/').pop() : msg.fileUrl.split('/').pop();
    const encoded = encodeURIComponent(cleanedName);
    return `${SERVER_URL}/api/files/download/${filename}?name=${encoded}`;
  };

  const [modalTab, setModalTab] = useState(null); // potential future use
  const [photosModalOpen, setPhotosModalOpen] = useState(false);
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [linksModalOpen, setLinksModalOpen] = useState(false);

  // Модальные состояния для leave confirm и медиа
  const [videosModalOpen, setVideosModalOpen] = useState(false);
  const [audiosModalOpen, setAudiosModalOpen] = useState(false);
  const [gifsModalOpen, setGifsModalOpen] = useState(false);

  // --- Derived media arrays ---
  const sharedVideos = useMemo(() => chatMessages.filter(m => m.fileUrl && ((m.fileType && m.fileType.startsWith('video/')) || /\.(mp4|mov|avi|mkv|webm)$/i.test(m.fileUrl))), [chatMessages]);
  const sharedAudios = useMemo(() => chatMessages.filter(m => m.fileUrl && ((m.fileType && m.fileType.startsWith('audio/')) || /\.(mp3|wav|ogg|flac)$/i.test(m.fileUrl))), [chatMessages]);
  const sharedGifs = useMemo(() => chatMessages.filter(m => m.fileUrl && (/\.gif$/i.test(m.fileUrl) || (m.fileType && m.fileType==='image/gif'))), [chatMessages]);

  // Leave chat functionality removed per new requirements

  // Helper: choose icon by file extension
  function getFileIcon(name="") {
    const ext = name.split('.').pop().toLowerCase();
    if(['pdf'].includes(ext)) return <FaFilePdf />;
    if(['doc','docx','rtf'].includes(ext)) return <FaFileWord />;
    if(['xls','xlsx','csv'].includes(ext)) return <FaFileExcel />;
    if(['zip','rar','7z','tar','gz'].includes(ext)) return <FaFileArchive />;
    if(['mp4','mov','avi','mkv','webm'].includes(ext)) return <FaFileVideo />;
    if(['mp3','wav','ogg','flac'].includes(ext)) return <FaFileAudio />;
    if(['png','jpg','jpeg','gif','webp','svg'].includes(ext)) return <FaFileImage />;
    return <FaFileAlt />;
  }

  // Helper: group array items by Month-Year using provided date accessor
  function groupByMonth(arr, getDateCb) {
    return arr.reduce((acc,item)=>{
      const d = new Date(getDateCb(item));
      const key = d.toLocaleString('default',{month:'long', year:'numeric'});
      if(!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },{});
  }

  // Helper to render profile fields
  function renderProfileFields(profile){
    if(!profile) return null;
    const fields=[
      {label:t('profile.first_name')+':',value:profile.name},
      {label:t('profile.last_name')+':',value:profile.surname},
      {label:'BIO:',value:profile.bio},
      {label:t('profile.city')+':',value:profile.city},
      {label:t('profile.country')+':',value:profile.country},
      {label:t('profile.company')+':',value:profile.company},
    ];
    return (
      <div style={{marginTop:12}}>
        {fields.filter(f=>f.value&&String(f.value).trim()!=='').map(f=>(
          <div key={f.label} style={{marginBottom:6,fontSize:15,color:'#888'}}><strong>{f.label}</strong> {f.value}</div>
        ))}
      </div>
    );
  }

  function UserProfileModal(){
    if(!selectedUser) return null;
    const prof = selectedProfile || {};
    const primaryColor = dark? '#1e88e5':'#3976a8';
    const iconMap = {
      city: <FaMapMarkerAlt />, country: <FaFlag />, company:<FaBuilding />, position:<FaBriefcase />, jobTitle:<FaIdBadge />, goal:<FaBullseye />, status:<FaInfoCircle />
    };
    const iconColors = {
      city: 'rgb(229, 115, 115)',
      country: 'rgb(129, 199, 132)',
      company: 'rgb(255, 213, 79)',
      position: 'rgb(100, 181, 246)',
      jobTitle: 'rgb(186, 104, 200)',
      goal: 'rgb(255, 138, 101)',
      status: 'rgb(77, 208, 225)'
    };
    const rows = [
      {key:'city', label:t('profile.city')||'City', value:prof.city},
      {key:'country', label:t('profile.country')||'Country', value:prof.country},
      {key:'company', label:t('profile.company')||'Company', value:prof.company},
      {key:'position', label:t('profile.position')||'Position', value:prof.position},
      {key:'jobTitle', label:t('profile.job_title')||'Job', value:prof.jobTitle},
      {key:'goal', label:t('profile.goal')||'Goal', value:prof.goal},
      {key:'status', label:t('profile.status')||'Status', value:prof.status},
    ].filter(r=>r.value&&String(r.value).trim()!=='');
    const skills = prof.skills||[];
    const lightGradient = 'linear-gradient(135deg,#e0eafc 0%, #cfdef3 100%)';
    const modalStyle = {
      position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
      background: dark ? 'linear-gradient(135deg,#232526 0%,#414345 100%)' : lightGradient,
      borderRadius:24,
      boxShadow: dark? '0 8px 32px rgba(0,0,0,0.38)' : '0 8px 32px rgba(0,0,0,0.14)',
      padding:44,minWidth:340,maxWidth:440,width:'92vw',zIndex:1001,
      display:'flex',flexDirection:'column',alignItems:'center',
      border:`1.5px solid ${dark? borderColor : '#b6d4fe'}`,
      color: dark? '#eaf4fd':'#1a2a3a',
      animation:'fadeInModal .25s ease'
    };
    return (
      <div style={modalStyle}>
        {/* close x */}
        <FaTimes onClick={()=>setSelectedUser(null)} style={{position:'absolute',top:18,right:22,cursor:'pointer',fontSize:18,color:dark?'#eaf4fd':'#666'}}/>
        {/* avatar */}
        <div style={{width:120,height:120,borderRadius:'50%',border:`3px solid ${primaryColor}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,fontWeight:700,color:primaryColor.toString(),marginBottom:24,textTransform:'uppercase'}}>
          {selectedUser.username?.[0]||'?'}
        </div>
        {/* name */}
        <h2 style={{margin:0,fontSize:24,fontWeight:800,textAlign:'center',color:dark?'#eaf4fd':'#1d1d25'}}>{selectedUser.username}</h2>
        {/* email */}
        { (prof.email || selectedUser.email) && (
          <div style={{marginTop:6,display:'flex',alignItems:'center',gap:6,fontSize:15,color:primaryColor}}>
            <FaEnvelope/> {(prof.email || selectedUser.email)}
          </div>
        ) }
        {/* bio */}
        {prof.bio && <div style={{marginTop:18,background:dark?'#102027':'#0d47a1',color:'#eaf4fd',borderRadius:10,padding:'10px 14px',maxWidth:'100%',fontStyle:'italic',fontSize:15,display:'flex',alignItems:'center',gap:6}}><FaQuoteLeft/> {prof.bio}</div>}
        {/* skills */}
        {Array.isArray(skills)&&skills.length>0 && (
          <div style={{marginTop:18,display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center'}}>
            {skills.map((s,i)=>(<span key={i} style={{background:primaryColor,color:'#fff',padding:'4px 10px',borderRadius:6,fontSize:13,fontWeight:700,whiteSpace:'nowrap'}}>{s}</span>))}
          </div>
        )}
        {/* info rows */}
        <div style={{marginTop:24,width:'100%'}}>
          {rows.map(r=> (
            <div key={r.key} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,fontSize:15}}>
              <span style={{fontSize:18,color:iconColors[r.key]||primaryColor}}>{iconMap[r.key]}</span>
              <span style={{fontWeight:700,minWidth:90}}>{r.label}</span>
              <span style={{flex:1}}>{r.value}</span>
            </div>
          ))}
        </div>
        <button onClick={()=>setSelectedUser(null)} style={{background: dark? 'linear-gradient(90deg,#3976a8 0%, #36607e 100%)':'linear-gradient(90deg,#3976a8 0%, #b6d4fe 100%)',color:'#fff',border:'none',borderRadius:14,padding:'12px 38px',fontWeight:700,fontSize:17,marginTop:8,alignSelf:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.1)',cursor:'pointer',letterSpacing:1,transition:'background 0.2s'}}>Back</button>
      </div>
    );
  }

  // --- Context menu for My Chat items ---
  const [myChatMenu,setMyChatMenu]=useState({visible:false,x:0,y:0,chatId:null,anim:''});

  const openMyChatMenu=(e,id)=>{
    e.preventDefault();
    setMyChatMenu({visible:true,x:e.clientX,y:e.clientY,chatId:id,anim:'in'});
  };

  useEffect(()=>{
    if(!myChatMenu.visible) return;
    const hide=()=> setMyChatMenu(m=>({...m,anim:'out'}));
    const t=setTimeout(()=>myChatMenu.anim==='out'&&setMyChatMenu({visible:false,x:0,y:0,chatId:null,anim:''}),180);
    window.addEventListener('click',hide,{once:true});
    return()=>{window.removeEventListener('click',hide);clearTimeout(t);};
  },[myChatMenu]);

  const removeChat=(id)=>{
    setMyChatIds(prev=>{
      const arr=prev.filter(c=>c!==id);
      localStorage.setItem('myChats',JSON.stringify(arr));
      return arr;
    });
    setLeftChats(prev=>{
      if(prev.includes(id)) return prev;
      const arr=[...prev,id];
      localStorage.setItem('leftChats',JSON.stringify(arr));
      return arr;
    });
    if(selectedChat && selectedChat.id===id){
      setSelectedChat(null);
      setChatMessages([]); // clear messages so current user removed from participants list
    }
    if(socketRef.current){
      socketRef.current.emit('leave-chat',{chatId:id,userId});
    }
    setMyChatMenu({visible:false,x:0,y:0,chatId:null,anim:''});
  };

  // after existing useState hooks near theme, add new state for language
  const [lang, setLang] = useState(() => localStorage.getItem('language') || 'ru');

  useEffect(() => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  }, [lang]);

  return (
    <div style={{ minHeight: '100vh', background: pageBg, color: fieldColor }}>
      {/* Sidebar + Toggle Button */}
      {sidebarOpen && (
        <div style={sidebarStyle}>
          <div style={{ padding: '24px 12px 0 18px', flex: 1, overflowY: 'auto' }}>
            {dropdowns.map(drop => (
              <div key={drop.key} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }} onClick={() => setOpenDropdown(openDropdown === drop.key ? null : drop.key)}>
                  {drop.icon}
                  <h5 style={{ fontWeight: 700, fontSize: 17, color: dark ? '#eaf4fd' : '#3976a8', margin: 0 }}>{drop.title}</h5>
                  <span style={{ marginLeft: 8, color: '#888', fontSize: 15 }}>{openDropdown === drop.key ? '▲' : '▼'}</span>
                </div>
                {openDropdown === drop.key && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0 0' }}>
                    {drop.items.length === 0 && (
                      <li style={{ color: '#888', fontSize: 15, padding: '7px 0 7px 8px' }}>
                        {drop.key === 'favorites' ? (t('chatSidebar.noFavorites') || 'Нет избранных чатов') : (t('chatSidebar.noChats'))}
                      </li>
                    )}
                    {drop.items.map((item, idx) => (
                      <li key={item.id || idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0 7px 8px', color: dark ? '#b6d4fe' : '#3976a8', fontSize: 15, borderRadius: 8, cursor: 'pointer', transition: 'background 0.13s', position: 'relative' }}
                        onMouseOver={e => e.currentTarget.style.background = dark ? '#213747' : '#f4f8fb'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        onClick={() => handleSelectChat(item)}
                        onContextMenu={(e)=>openMyChatMenu(e,item.id)}
                      >
                        {item.icon}
                        <span style={{ flex: 1 }}>{item.label}</span>
                        <span onClick={e => { e.stopPropagation(); toggleFavorite(item.id); }} style={{ cursor: 'pointer', marginLeft: 4 }}>
                          {favorites.includes(item.id) ? <FaStar color={dark ? '#ffe082' : '#ffd700'} /> : <FaRegStar color={dark ? '#b6d4fe' : '#aaa'} />}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          {/* Кнопка выхода внизу */}
          <div style={{ width: '100%', padding: '0 0 18px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <select
              aria-label="Select language"
              style={{ padding: '0.35rem 0.8rem', borderRadius: 16, border: `1px solid ${borderColor}`, background: dark ? '#213747' : '#f9fafd', color: dark ? '#eaf4fd' : '#3976a8', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', marginRight: 8 }}
              value={i18n.language}
              onChange={e => {
                const lang = e.target.value;
                i18n.changeLanguage(lang);
                localStorage.setItem('language', lang);
                // не делаем setLang, не делаем window.location.reload()
              }}
            >
              {langOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: dark ? '#ffe082' : '#222', marginRight: 8 }}
              aria-label="Switch theme"
            >
              {dark ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => history.push('/')}
              title="Выйти"
              className="logout-btn"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      )}
      {/* Toggle Button теперь вне sidebar, фиксированная позиция */}
      <button style={{
        position: 'fixed',
        top: '50%',
        left: sidebarOpen ? (sidebarWidth - 10) : 2,
        transform: 'translateY(-50%)',
        width: 19,
        height: 320,
        background: dark ? '#36607e' : '#b6d4fe',
        border: 'none',
        borderRadius: 16,
        color: dark ? '#ffe082' : '#3976a8',
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        cursor: 'pointer',
        zIndex: 121,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.18s, left 0.22s',
        padding: 0,
      }} onClick={() => setSidebarOpen(v => !v)} aria-label={sidebarOpen ? 'Скрыть панель' : 'Показать панель'}>
        {sidebarOpen ? <FaChevronLeft size={18} /> : <FaChevronRight size={18} />}
      </button>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: dark ? '#eaf4fd' : '#3976a8', marginLeft: 8 }}>
            {selectedChat ? selectedChat.label : (t('chat.chooseChat') || 'Выберите чат')}
          </div>
          {selectedChat && (
            <div style={{ fontSize: 15, color: '#888', marginLeft: 8, marginTop: 2 }}>
              {chatMessages.length} {t('chat.messages')}
            </div>
          )}
        </div>
        <div style={controlsStyle}>
          <select
            aria-label="Select language"
            style={{ padding: '0.4rem 1rem', borderRadius: 20, border: `1px solid ${borderColor}`, background: formBg, color: dark ? '#eaf4fd' : '#3976a8', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
            value={lang}
            onChange={e => setLang(e.target.value)}
          >
            {langOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: dark ? '#ffe082' : '#222', marginLeft: 0, transition: 'all 0.1s ease', fontFamily: 'Nunito' }}
            aria-label="Switch theme"
          >
            {dark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => history.goBack()}
            style={{ padding: '0.5rem 1.5rem', backgroundColor: '#3976a8', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: '1rem', marginLeft: 8 }}
          >
            {t('reviews.back') || 'Назад'}
          </button>
        </div>
      </div>
      {/* Сообщения */}
      <div className="container" style={{ maxWidth: 600, margin: '0 auto', padding: 0, marginLeft: sidebarOpen ? sidebarWidth + (showRightPanel ? 320 : 0) : (showRightPanel ? 320 : 0), transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={messagesContainerStyle}>
          {loadingMessages ? (
            <div style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>Загрузка сообщений...</div>
          ) : chatMessages.length === 0 ? (
            <div style={{
              ...emptyStyle,
              position: 'absolute',
              left: sidebarOpen ? sidebarWidth : 0,
              right: showRightPanel ? 320 : 0,
              top: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: 'auto',
              margin: 0,
              pointerEvents: 'none',
              zIndex: 2,
            }}>
              {selectedChat ? (t('chat.noMessages') || 'Нет сообщений') : (t('chat.chooseChat') || 'Выберите чат')}
            </div>
          ) : chatMessages.map((msg, i) => {
            const isMe = (msg.user && (msg.user.username || msg.user) === username) || (typeof msg.user === 'string' && msg.user === username);
            const displayName = msg.user && typeof msg.user === 'object' ? (msg.user.username || msg.user.name || 'Anonymous') : (msg.user || 'Anonymous');
            const displayTime = msg.sentAt ? new Date(msg.sentAt) : (msg.time ? new Date(msg.time) : null);
            return (
              <div key={msg.id || i} style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, justifyContent: 'flex-start', width: '100%' }}>
                <div style={avatarStyle(isMe)} onClick={()=> setSelectedUser(typeof msg.user==='object'? msg.user : {id:msg.user, username:msg.user})}>{displayName[0] ? displayName[0].toUpperCase() : '?'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                  <span style={nameStyle(isMe)} onClick={()=> setSelectedUser(typeof msg.user==='object'? msg.user : {id:msg.user, username:msg.user})}>{isMe ? (t('chat.you')) : displayName}</span>
                  <span
                    style={{ ...bubbleStyle(isMe), marginLeft: 0, marginRight: 16, cursor: 'context-menu', alignSelf: 'flex-start' }}
                    onContextMenu={e => handleContextMenu(e, i)}
                  >
                    {/* Текст сообщения с ссылками */}
                    {renderMessageText(msg.text)}
                    {/* Медиа/файл */}
                    {msg.fileUrl && (/\.(png|jpe?g|gif|webp|svg)$/i.test(msg.fileUrl) || (msg.fileType && msg.fileType.startsWith('image/'))) && (
                      <div style={{ marginTop: 8 }}>
                        <img src={msg.fileUrl.startsWith('/') ? SERVER_URL + msg.fileUrl : msg.fileUrl} alt={msg.fileName || ''} style={{ maxWidth: 220, maxHeight: 220, borderRadius: 10 }} />
                      </div>
                    )}
                    {msg.fileUrl && (/\.(mp4|webm|ogg)$/i.test(msg.fileUrl) || (msg.fileType && msg.fileType.startsWith('video/'))) && (
                      <div style={{ marginTop: 8 }}>
                        <video src={msg.fileUrl.startsWith('/') ? SERVER_URL + msg.fileUrl : msg.fileUrl} controls style={{ maxWidth: 220, borderRadius: 10 }} />
                      </div>
                    )}
                    {msg.fileUrl && (!msg.fileType || (!msg.fileType.startsWith('image/') && !msg.fileType.startsWith('video/'))) && (
                      <div style={{ marginTop: 8 }}>
                        {(() => {
                          const raw = decodeURIComponent(msg.fileUrl.split('/').pop());
                          const cleaned = raw.replace(/-[0-9]{10,}-[0-9]+(?=\.)/, '')  // убираем -timestamp-rand если есть
                                                      .replace(/-[0-9]+(?=\.)/, '');
                          const displayName = msg.fileName || cleaned;
                          return (
                            <a href={getDownloadUrl(msg, displayName)} download={displayName} target="_blank" rel="noopener noreferrer">{displayName}</a>
                          );
                        })()}
                      </div>
                    )}
                    {msg.caption && <div style={{ marginTop: 6, color: '#888', fontSize: 15 }}>{msg.caption}</div>}
                  </span>
                  {/* Эмодзи-реакции */}
                  {reactions[msg.id] && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, justifyContent: 'flex-start' }}>
                      {Object.entries(reactions[msg.id])
                        .map(([code, obj]) => (
                          isValidEmoji(code)
                            ? <span key={code} className="animated-emoji" style={{ fontSize: 20, background: 'transparent', borderRadius: 8, padding: '2px 8px', cursor: 'pointer', userSelect: 'none', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: Array.isArray(obj.users) && obj.users.some(u => (u.username || u.name) === username) ? 800 : 400, opacity: Array.isArray(obj.users) && obj.users.some(u => (u.username || u.name) === username) ? 1 : 0.7 }} onClick={() => handleReactionClick(msg.id, code)}>{code} <span style={{ fontWeight: 700 }}>{obj.count}</span></span>
                            : <span key={code} title="Ошибка реакции" style={{ fontSize: 20, background: '#eee', borderRadius: 8, padding: '2px 8px', color: '#aaa', border: '1px solid #ddd', display: 'inline-flex', alignItems: 'center', gap: 4, opacity: 0.5 }}>😀 <span style={{ fontWeight: 700 }}>{obj.count}</span></span>
                        ))}
                    </div>
                  )}
                  <span style={{ ...timeStyle, textAlign: 'left', alignSelf: 'flex-start' }}>
                    {displayTime ? displayTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    {displayTime && (
                      <span style={{ marginLeft: 10, color: '#bbb', fontSize: 12 }}>
                        {getDayLabel(displayTime)}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
          {/* Контекстное меню */}
          {contextMenu.visible && (
            <div className={`context-menu-anim context-menu-anim-${contextMenu.anim}`} style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: dark ? '#23272f' : '#fff', color: dark ? '#eaf4fd' : '#23272f', border: `1.5px solid ${borderColor}`, borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.18)', zIndex: 9999, minWidth: 140, padding: 8, pointerEvents: contextMenu.anim === 'out' ? 'none' : 'auto' }}>
              <div style={{ padding: '7px 12px', cursor: 'pointer', borderRadius: 6, fontSize: 15 }} onClick={() => handleCopy(chatMessages[contextMenu.msgIdx]?.text)}>Copy text</div>
              <div style={{ borderTop: `1px solid ${borderColor}`, margin: '6px 0' }} />
              <div style={{ display: 'flex', gap: 6, padding: '4px 0 2px 4px' }}>
                <span
                  className="animated-emoji"
                  style={{ fontSize: 22, cursor: 'pointer', display: 'inline-block' }}
                  onClick={e => {
                    e.stopPropagation();
                    handleEmoji(chatMessages[contextMenu.msgIdx]);
                  }}
                >😀</span>
                <span style={{ fontSize: 15, color: '#888', marginLeft: 8 }}>Больше...</span>
              </div>
            </div>
          )}
          {/* Emoji Picker */}
          {emojiPicker.visible && (
            <div ref={emojiPickerRef} className={`emoji-picker-anim emoji-picker-anim-${emojiPicker.anim}`} style={{ position: 'fixed', top: emojiPicker.y, left: emojiPicker.x, zIndex: 10000, pointerEvents: emojiPicker.anim === 'out' ? 'none' : 'auto' }}>
              <Picker data={data} theme={dark ? 'dark' : 'light'} onEmojiSelect={handleSelectEmoji} searchPosition="top" previewPosition="none" skinTonePosition="search" />
            </div>
          )}
          {/* Toast уведомление */}
          <div style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: dark ? '#23272f' : '#fff',
            color: dark ? '#eaf4fd' : '#23272f',
            border: `1.5px solid ${borderColor}`,
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            padding: '14px 32px',
            fontSize: 17,
            fontWeight: 700,
            opacity: toast.visible ? 1 : 0,
            pointerEvents: 'none',
            zIndex: 99999,
            transition: 'opacity 0.7s',
            display: toast.text ? 'block' : 'none',
          }}>{toast.text}</div>
          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* Панель ввода */}
      <div style={inputBarStyle}>
        <div className="container" style={{ maxWidth: 600, margin: '0 auto', padding: 0 }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="text"
              value={input}
              onChange={e => {
                setInput(e.target.value);
                if(e.target.value.trim().length>0 && selectedChat && !myChatIds.includes(selectedChat.id)) {
                  addToMyChats(selectedChat.id);
                }
              }}
              placeholder={t('chat.placeholder') || 'Введите сообщение...'}
              style={{ flex: 1, borderRadius: 14, border: `1.5px solid ${borderColor}`, padding: '14px 20px', fontSize: 17, background: dark ? '#213747' : '#f9fafd', color: fieldColor, boxShadow: 'none', outline: 'none', transition: 'border 0.2s' }}
              autoFocus
              maxLength={500}
            />
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
            />
            <button type="button" onClick={() => fileInputRef.current && fileInputRef.current.click()} style={{ background: '#eaf4fd', color: '#3976a8', border: 'none', borderRadius: 10, padding: '0 14px', fontWeight: 700, fontSize: 22, height: 44, cursor: 'pointer' }}>📎</button>
            <button type="submit" style={{ background: '#3976a8', color: '#fff', border: 'none', borderRadius: 14, padding: '0 32px', fontWeight: 700, fontSize: 17, height: 52, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', transition: 'background 0.2s', letterSpacing: 1 }}>
              {t('chat.send') || 'Отправить'}
            </button>
          </form>
          {/* Предпросмотр файла */}
          {file && (
            <div style={{ marginTop: 8, marginBottom: 4, background: dark ? '#213747' : '#f9fafd', border: `1.5px solid ${borderColor}`, borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              {filePreview && file.type.startsWith('image/') && <img src={filePreview} alt="preview" style={{ maxWidth: 80, maxHeight: 80, borderRadius: 8 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{file.name}</div>
                <div style={{ fontSize: 13, color: '#888' }}>{(file.size/1024).toFixed(1)} KB</div>
                <input type="text" value={caption} onChange={e => setCaption(e.target.value)} placeholder={t('chat.caption') || 'Подпись к файлу (необязательно)'} style={{ marginTop: 6, borderRadius: 8, border: `1px solid ${borderColor}`, padding: '6px 10px', fontSize: 15, width: '100%' }} />
              </div>
              <button type="button" onClick={resetFile} style={{ background: '#eee', color: '#3976a8', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>{t('common.reset') || 'Сбросить'}</button>
            </div>
          )}
        </div>
      </div>
      {/* Адаптивность и анимации */}
      <style>{`
        @media (max-width: 900px) {
          .container { max-width: 99vw !important; padding: 0 2vw !important; }
        }
        @media (max-width: 700px) {
          .container { max-width: 100vw !important; padding: 0 1vw !important; }
        }
        @media (max-width: 600px) {
          .container { margin-left: 0 !important; }
          [style*='position:fixed'][style*='left:'] { left: 0 !important; width: 100vw !important; }
        }
        .animated-emoji {
          transition: transform 0.18s cubic-bezier(.4,1.6,.6,1), filter 0.18s;
          animation: fadeInEmoji 0.25s cubic-bezier(.4,1.6,.6,1);
        }
        @keyframes fadeInEmoji {
          0% { transform: scale(0.4); opacity: 0; }
          60% { transform: scale(1.25); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animated-emoji:hover {
          transform: scale(1.35) translateY(-7px) rotate(-7deg);
          filter: drop-shadow(0 2px 8px #0002);
        }
        .pop-emoji {
          animation: pop-emoji-anim 0.33s cubic-bezier(.4,1.6,.6,1);
        }
        @keyframes pop-emoji-anim {
          0% { transform: scale(1); }
          40% { transform: scale(1.6) rotate(7deg); }
          70% { transform: scale(1.25) rotate(-7deg); }
          100% { transform: scale(1) rotate(0); }
        }
        .context-menu-anim {
          opacity: 0;
          transform: scale(0.95);
          transition: opacity 0.18s cubic-bezier(.4,1.6,.6,1), transform 0.18s cubic-bezier(.4,1.6,.6,1);
        }
        .context-menu-anim-in {
          opacity: 1 !important;
          transform: scale(1) !important;
        }
        .context-menu-anim-out {
          opacity: 0 !important;
          transform: scale(0.95) !important;
        }
        .emoji-picker-anim {
          opacity: 0;
          transform: scale(0.95);
          transition: opacity 0.18s cubic-bezier(.4,1.6,.6,1), transform 0.18s cubic-bezier(.4,1.6,.6,1);
        }
        .emoji-picker-anim-in {
          opacity: 1 !important;
          transform: scale(1) !important;
        }
        .emoji-picker-anim-out {
          opacity: 0 !important;
          transform: scale(0.85) !important;
        }
      `}</style>
      {/* Правая панель участников и вкладки */}
      {showRightPanel && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 320,
          height: '100vh',
          background: dark ? '#23272f' : '#f6f7fa',
          borderLeft: `1.5px solid ${borderColor}`,
          zIndex: 200,
          boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0 0 0',
        }}>
          {/* Group Info */}
          <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px 8px 24px'}}>
            <FaUsers size={26} color={dark ? '#eaf4fd' : '#3976a8'} />
            <span style={{fontWeight: 900, fontSize: 23, color: dark ? '#eaf4fd' : '#3976a8', letterSpacing: 0.5}}>{t('chat.groupInfo')}</span>
          </div>
          {/* scrollable content */}
          <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column'}}>
          {/* Shared Links, Files, Photos */}
          <div style={{borderTop: `1px solid ${borderColor}`, margin: '18px 0 0 0', padding: '0 24px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18, marginBottom: 8, width: '100%'}}>
              <button onClick={() => setLinksModalOpen(true)} style={{background: 'none', border: 'none', color: dark ? '#eaf4fd' : '#3976a8', fontWeight: 700, fontSize: 16, cursor: 'pointer', whiteSpace: 'normal', wordBreak: 'break-word', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: 8}}><FaLink />{t('chat.sharedLinks')} ({sharedLinks.length})</button>
              <button onClick={() => setFilesModalOpen(true)} style={{background: 'none', border: 'none', color: dark ? '#eaf4fd' : '#3976a8', fontWeight: 700, fontSize: 16, cursor: 'pointer', whiteSpace: 'normal', wordBreak: 'break-word', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: 8}}><FaFileAlt />{t('chat.sharedFiles')} ({sharedFiles.length})</button>
              <button onClick={() => setPhotosModalOpen(true)} style={{background: 'none', border: 'none', color: dark ? '#eaf4fd' : '#3976a8', fontWeight: 700, fontSize: 16, cursor: 'pointer', whiteSpace: 'normal', wordBreak: 'break-word', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: 8}}><FaImage />{t('chat.sharedPhotos')} ({sharedPhotos.length})</button>
              <button onClick={() => setVideosModalOpen(true)} style={{background: 'none', border: 'none', color: dark ? '#eaf4fd' : '#3976a8', fontWeight: 700, fontSize: 16, cursor: 'pointer', whiteSpace: 'normal', wordBreak: 'break-word', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: 8}}><FaVideo />{t('chat.sharedVideos')||'Видео'} ({sharedVideos.length})</button>
              <button onClick={() => setAudiosModalOpen(true)} style={{background: 'none', border: 'none', color: dark ? '#eaf4fd' : '#3976a8', fontWeight: 700, fontSize: 16, cursor: 'pointer', whiteSpace: 'normal', wordBreak: 'break-word', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: 8}}><FaMusic />{t('chat.sharedAudios')||'Аудио'} ({sharedAudios.length})</button>
              <button onClick={() => setGifsModalOpen(true)} style={{background: 'none', border: 'none', color: dark ? '#eaf4fd' : '#3976a8', fontWeight: 700, fontSize: 16, cursor: 'pointer', whiteSpace: 'normal', wordBreak: 'break-word', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: 8}}><FaFileImage />GIF ({sharedGifs.length})</button>
            </div>
          </div>

          {/* Participants */}
          <div style={{padding: '0 24px', borderTop: `1px solid ${borderColor}`, marginTop: 18, marginBottom:24}}>
             <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 18}}>
              <h3 style={{fontWeight: 800, fontSize: 18, color: dark ? '#eaf4fd' : '#3976a8', margin: 0}}>{t('chat.participants')} ({participants.length})</h3>
            </div>
            <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
              {participants.sort((a,b)=> (b.online?1:0)-(a.online?1:0)).map(user => (
                <li key={user.id} style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer', borderRadius: 8, padding: '4px 6px', transition: 'background 0.13s'}} onClick={() => setSelectedUser(user)}>
                  <div style={{width: 32, height: 32, borderRadius: '50%', background: '#b6d4fe', color: '#3976a8', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{user.username[0]?.toUpperCase() || '?'}</div>
                  <div style={{flex: 1, minWidth: 0, wordBreak: 'break-all', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal', fontSize: 15}}>{user.username}</div>
                  {user.online && <span style={{width:8,height:8,borderRadius:'50%',background:'#4caf50'}}/>}
                </li>
              ))}
            </ul>
            </div>
          </div>
          {/* Модальное окно/блок с инфой о пользователе */}
          {selectedUser && <UserProfileModal/>}
          {panelTab === 'links' && !linksModalOpen && (
            <div style={{padding:'0 24px', marginTop:12, overflowY:'auto', maxHeight:200}}>
              {sharedLinks.length === 0 && <div style={{color:'#888'}}>{t('chat.noLinks')||'Нет ссылок'}</div>}
              <ul style={{padding:0, margin:0, listStyle:'none'}}>
                {sharedLinks.map((l,i)=>(<li key={i} style={{marginBottom:6}}><a href={l} target="_blank" rel="noopener noreferrer" style={{color: dark ? '#7ecbff' : '#3976a8'}}>{l}</a></li>))}
              </ul>
            </div>
          )}
          {panelTab === 'files' && !filesModalOpen && (
            <div style={{padding:'0 24px', marginTop:12, overflowY:'auto', maxHeight:200}}>
              {sharedFiles.length === 0 && <div style={{color:'#888'}}>{t('chat.noFiles')||'Нет файлов'}</div>}
              <ul style={{padding:0, margin:0, listStyle:'none'}}>
                {sharedFiles.map((m,i)=>(<li key={i} style={{marginBottom:6}}><a href={getDownloadUrl(m, m.fileName || decodeURIComponent(m.fileUrl.split('/').pop()))} target="_blank" rel="noopener noreferrer" style={{color: dark ? '#7ecbff' : '#3976a8'}}>{m.fileName || decodeURIComponent(m.fileUrl.split('/').pop())}</a></li>))}
              </ul>
            </div>
          )}
          {panelTab === 'photos' && !photosModalOpen && (
            <div style={{padding:'0 24px', marginTop:12, overflowY:'auto', maxHeight:200, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:8, alignContent:'flex-start'}}>
              {sharedPhotos.length === 0 && <div style={{color:'#888', gridColumn:'1 / -1'}}>{t('chat.noPhotos')||'Нет изображений'}</div>}
              {sharedPhotos.map((m,i)=>(<img key={i} src={m.fileUrl.startsWith('/')?SERVER_URL+m.fileUrl:m.fileUrl} alt='' style={{width:'100%',height:120,objectFit:'cover',borderRadius:6}}/>))}
            </div>
          )}
        </div>
      )}
      {/* Кнопка для скрытия/открытия правой панели: */}
      <button
        aria-label={showRightPanel ? t('chat.hidePanel') : t('chat.showPanel')}
        style={{
          position: 'fixed',
          top: '50%',
          right: showRightPanel ? 320 : 0,
          transform: showRightPanel ? 'translateY(-50%) translateX(50%)' : 'translateY(-50%)',
          width: 19,
          height: 260,
          background: dark ? '#36607e' : '#b6d4fe',
          border: 'none',
          borderRadius: 16,
          color: dark ? '#ffe082' : '#3976a8',
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          cursor: 'pointer',
          zIndex: 201,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.18s, right 0.22s',
          padding: 0,
          marginRight: 'max(env(safe-area-inset-right), 4px)',
        }}
        onClick={() => setShowRightPanel(v => !v)}
      >
        {showRightPanel ? <FaChevronRight size={18} /> : <FaChevronLeft size={18} />}
      </button>
      {/* Central Modal for Shared Photos */}
      {photosModalOpen && (
        <>
          {/* Backdrop */}
          <div onClick={() => setPhotosModalOpen(false)} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:9998}}/>
          {/* Modal Window */}
          <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'80vw',maxWidth:900,height:'80vh',background:dark?'#23272f':'#fff',border:`1.5px solid ${borderColor}`,borderRadius:12,zIndex:9999,display:'flex',flexDirection:'column',padding:24,boxShadow:'0 4px 16px rgba(0,0,0,0.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <h3 style={{margin:0,fontSize:22,fontWeight:800,color:dark ? '#eaf4fd' : '#3976a8'}}>{t('chat.sharedPhotos')} ({sharedPhotos.length})</h3>
              <button onClick={() => setPhotosModalOpen(false)} style={{background:'#3976a8',color:'#fff',border:'none',borderRadius:8,padding:'6px 14px',fontWeight:700,fontSize:15,cursor:'pointer'}}>{t('common.close')}</button>
            </div>
            <div style={{overflowY:'auto',flex:1,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:12,gridAutoRows:'120px',alignContent:'flex-start'}}>
              {sharedPhotos.length === 0 && <div style={{color:'#888', gridColumn:'1 / -1'}}>{t('chat.noPhotos')||'Нет изображений'}</div>}
              {sharedPhotos.map((m,i)=>(<img key={i} src={m.fileUrl.startsWith('/')?SERVER_URL+m.fileUrl:m.fileUrl} alt='' style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:6}}/>))}
            </div>
          </div>
        </>
      )}
      {/* Central Modal for Shared Links */}
      {linksModalOpen && (
        <>
          <div onClick={() => setLinksModalOpen(false)} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:9998}}/>
          <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'80vw',maxWidth:700,height:'70vh',background:dark?'#23272f':'#fff',border:`1.5px solid ${borderColor}`,borderRadius:12,zIndex:9999,display:'flex',flexDirection:'column',padding:24,boxShadow:'0 4px 16px rgba(0,0,0,0.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <h3 style={{margin:0,fontSize:22,fontWeight:800,color:dark ? '#eaf4fd' : '#3976a8'}}>{t('chat.sharedLinks')} ({sharedLinks.length})</h3>
              <button onClick={() => setLinksModalOpen(false)} style={{background:'#3976a8',color:'#fff',border:'none',borderRadius:8,padding:'6px 14px',fontWeight:700,fontSize:15,cursor:'pointer'}}>{t('common.close')}</button>
            </div>
            <div style={{overflowY:'auto',flex:1}}>
              {sharedLinks.length === 0 && <div style={{color:'#888'}}>{t('chat.noLinks')||'Нет ссылок'}</div>}
              <ul style={{padding:0,margin:0,listStyle:'none'}}>
                {sharedLinks.map((l,i)=>(
                  <li key={i} style={{marginBottom:8}}>
                    <a href={l} target="_blank" rel="noopener noreferrer" style={{color: dark ? '#7ecbff' : '#3976a8',wordBreak:'break-all'}}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
      {/* Central Modal for Shared Files */}
      {filesModalOpen && (
        <>
          <div onClick={() => setFilesModalOpen(false)} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:9998}}/>
          <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'80vw',maxWidth:700,height:'70vh',background:dark?'#23272f':'#fff',border:`1.5px solid ${borderColor}`,borderRadius:12,zIndex:9999,display:'flex',flexDirection:'column',padding:24,boxShadow:'0 4px 16px rgba(0,0,0,0.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <h3 style={{margin:0,fontSize:22,fontWeight:800,color:dark ? '#eaf4fd' : '#3976a8'}}>{t('chat.sharedFiles')} ({sharedFiles.length})</h3>
              <button onClick={() => setFilesModalOpen(false)} style={{background:'#3976a8',color:'#fff',border:'none',borderRadius:8,padding:'6px 14px',fontWeight:700,fontSize:15,cursor:'pointer'}}>{t('common.close')}</button>
            </div>
            <div style={{overflowY:'auto',flex:1}}>
              {sharedFiles.length === 0 && <div style={{color:'#888'}}>{t('chat.noFiles')||'Нет файлов'}</div>}
              <ul style={{padding:0,margin:0,listStyle:'none'}}>
                {sharedFiles.map((m,i)=>(
                  <li key={i} style={{marginBottom:8,display:'flex',alignItems:'center',gap:14,padding:'8px 10px',borderRadius:8,transition:'background 0.15s',cursor:'pointer',background: 'none'}}
                    onMouseOver={e=>e.currentTarget.style.background=dark?'#2a3440':'#f3f7fa'}
                    onMouseOut={e=>e.currentTarget.style.background='none'}
                  >
                    <span style={{fontSize:26,flexShrink:0,opacity:0.85}}>{getFileIcon(m.fileName||m.fileUrl||'')}</span>
                    <a href={getDownloadUrl(m, m.fileName || decodeURIComponent(m.fileUrl.split('/').pop()))} target="_blank" rel="noopener noreferrer" style={{color: dark ? '#7ecbff' : '#3976a8',fontWeight:600,wordBreak:'break-all',flex:1}}>{m.fileName || decodeURIComponent(m.fileUrl.split('/').pop())}</a>
                    <span style={{color:'#888',fontSize:13,minWidth:60,textAlign:'right'}}>{m.fileSize ? ((m.fileSize/1024).toFixed(1)+' KB') : ''}</span>
                    <span style={{color:'#888',fontSize:13,minWidth:90,textAlign:'right'}}>{m.sentAt ? (new Date(m.sentAt).toLocaleDateString()) : (m.time ? (new Date(m.time).toLocaleDateString()) : '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
      {/* Central Modal for Shared Videos */}
      {videosModalOpen && (
        <>
          <div onClick={() => setVideosModalOpen(false)} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:9998}}/>
          <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'80vw',maxWidth:900,height:'80vh',background:dark?'#23272f':'#fff',border:`1.5px solid ${borderColor}`,borderRadius:12,zIndex:9999,display:'flex',flexDirection:'column',padding:24,boxShadow:'0 4px 16px rgba(0,0,0,0.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <h3 style={{margin:0,fontSize:22,fontWeight:800,color:dark ? '#eaf4fd' : '#3976a8'}}>{t('chat.sharedVideos')||'Видео'} ({sharedVideos.length})</h3>
              <button onClick={() => setVideosModalOpen(false)} style={{background:'#3976a8',color:'#fff',border:'none',borderRadius:8,padding:'6px 14px',fontWeight:700,fontSize:15,cursor:'pointer'}}>{t('common.close')}</button>
            </div>
            <div style={{overflowY:'auto',flex:1,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:8,gridAutoRows:'120px',alignContent:'flex-start'}}>
              {sharedVideos.length === 0 && <div style={{color:'#888', gridColumn:'1 / -1'}}>{t('chat.noVideos')||'Нет видео'}</div>}
              {sharedVideos.map((m,i)=>(<video key={i} src={m.fileUrl.startsWith('/')?SERVER_URL+m.fileUrl:m.fileUrl} controls style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:6}}/>))}
            </div>
          </div>
        </>
      )}

      {/* Central Modal for Shared Audios */}
      {audiosModalOpen && (
        <>
          <div onClick={() => setAudiosModalOpen(false)} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:9998}}/>
          <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'60vw',maxWidth:600,height:'60vh',background:dark?'#23272f':'#fff',border:`1.5px solid ${borderColor}`,borderRadius:12,zIndex:9999,display:'flex',flexDirection:'column',padding:24,boxShadow:'0 4px 16px rgba(0,0,0,0.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <h3 style={{margin:0,fontSize:22,fontWeight:800,color:dark ? '#eaf4fd' : '#3976a8'}}>{t('chat.sharedAudios')||'Аудио'} ({sharedAudios.length})</h3>
              <button onClick={() => setAudiosModalOpen(false)} style={{background:'#3976a8',color:'#fff',border:'none',borderRadius:8,padding:'6px 14px',fontWeight:700,fontSize:15,cursor:'pointer'}}>{t('common.close')}</button>
            </div>
            <div style={{overflowY:'auto',flex:1}}>
              {sharedAudios.length === 0 && <div style={{color:'#888'}}>{t('chat.noAudios')||'Нет аудио'}</div>}
              <ul style={{padding:0,margin:0,listStyle:'none'}}>
                {sharedAudios.map((m,i)=>(<li key={i} style={{marginBottom:12}}><audio src={m.fileUrl.startsWith('/')?SERVER_URL+m.fileUrl:m.fileUrl} controls style={{width:'100%'}}/></li>))}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Central Modal for Shared GIFs */}
      {gifsModalOpen && (
        <>
          <div onClick={() => setGifsModalOpen(false)} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:9998}}/>
          <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'60vw',maxWidth:600,height:'60vh',background:dark?'#23272f':'#fff',border:`1.5px solid ${borderColor}`,borderRadius:12,zIndex:9999,display:'flex',flexDirection:'column',padding:24,boxShadow:'0 4px 16px rgba(0,0,0,0.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <h3 style={{margin:0,fontSize:22,fontWeight:800,color:dark ? '#eaf4fd' : '#3976a8'}}>{t('chat.sharedGifs')||'GIF'} ({sharedGifs.length})</h3>
              <button onClick={() => setGifsModalOpen(false)} style={{background:'#3976a8',color:'#fff',border:'none',borderRadius:8,padding:'6px 14px',fontWeight:700,fontSize:15,cursor:'pointer'}}>{t('common.close')}</button>
            </div>
            <div style={{overflowY:'auto',flex:1,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8,alignContent:'flex-start'}}>
              {sharedGifs.length === 0 && <div style={{color:'#888', gridColumn:'1 / -1'}}>{t('chat.noGifs')||'Нет GIF'}</div>}
              {sharedGifs.map((m,i)=>(<img key={i} src={m.fileUrl.startsWith('/')?SERVER_URL+m.fileUrl:m.fileUrl} alt='' style={{width:'100%',height:120,objectFit:'cover',borderRadius:6}}/>))}
            </div>
          </div>
        </>
      )}
      {/* context menu for my chat */}
      {myChatMenu.visible && (
        <div className={`context-menu-anim context-menu-anim-${myChatMenu.anim}`} style={{position:'fixed',top:myChatMenu.y,left:myChatMenu.x,zIndex:10000,background:dark?'#23272f':'#fff',border:`1px solid ${borderColor}`,borderRadius:8,boxShadow:'0 4px 16px rgba(0,0,0,0.18)',minWidth:140,padding:8}}>
          <div style={{padding:'6px 12px',cursor:'pointer'}} onClick={()=>removeChat(myChatMenu.chatId)}>{t('chat.leaveChat')}</div>
        </div>
      )}
    </div>
  );
} 
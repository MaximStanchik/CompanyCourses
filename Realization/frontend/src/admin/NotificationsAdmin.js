import React, { useState } from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import TeachNavMenu from './TeachNavMenu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faSort, faList, faBook, faBell } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

// Options will be built inside component to access translation function

function SelectBox({ value, onChange, options, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      <style>{`
        .select-animated {
          transition: box-shadow 0.22s cubic-bezier(.4,0,.2,1), background 0.22s, color 0.22s;
        }
        .select-animated:focus {
          box-shadow: 0 0 0 3px var(--focus-outline-color, #4485ed33);
          background: var(--teach-active-bg);
        }
        .select-animated option {
          transition: background 0.18s, color 0.18s;
        }
      `}</style>
      <FontAwesomeIcon icon={options.find(opt => opt.value === value)?.icon || faFilter} style={{ color: 'var(--text-color)' }} />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="select-animated"
        style={{
          padding: '8px 18px',
          borderRadius: 6,
          border: '1px solid var(--border-color)',
          background: 'var(--field-bg)',
          color: 'var(--text-color)',
          fontWeight: 500,
          minWidth: 140,
          fontSize: 15,
          textAlign: 'center',
          textAlignLast: 'center',
          transition: 'background 0.22s, color 0.22s, box-shadow 0.22s',
          boxShadow: '0 2px 8px rgba(68,133,237,0.08)',
        }}
      >
        {options.map(opt => (
          <option
            key={opt.value}
            value={opt.value}
            style={{
              textAlign: 'center',
              transition: 'background 0.22s, color 0.22s',
              background: value === opt.value ? 'var(--teach-active-bg)' : 'var(--field-bg)',
              color: value === opt.value ? 'var(--btn-main-bg)' : 'var(--text-color)'
            }}
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function AnimatedSelectBox({ value, onChange, options, style }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef();

  React.useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(opt => opt.value === value);

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 180, width: 180, ...style }}>
      <button
        type="button"
        className="select-box__toggle-btn"
        style={{
          height: 48,
          padding: '0 22px',
          borderRadius: 8,
          background: 'var(--form-bg)',
          color: 'var(--text-color)',
          border: '1.5px solid var(--border-color)',
          fontWeight: 500,
          fontSize: 16,
          minWidth: 180,
          width: 180,
          textAlign: 'left',
          transition: 'background 0.2s, color 0.2s, border 0.18s, box-shadow 0.18s',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxSizing: 'border-box',
        }}
        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--btn-main-bg)'}
        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 3px var(--focus-outline-color, #4485ed33)'}
        onBlur={e => e.currentTarget.style.boxShadow = 'none'}
        onClick={() => setOpen(v => !v)}
      >
        <FontAwesomeIcon icon={selected?.icon || faFilter} style={{ color: 'var(--text-color)' }} />
        <span className="select-box-option__slot-item">
          <span className="select-box-option__content">
            {selected?.label}
          </span>
        </span>
        <svg style={{ marginLeft: 'auto', transition: 'transform 0.18s', transform: open ? 'rotate(180deg)' : 'none' }} width="18" height="18" viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
      </button>
      <ul
        className={`dropdown-anim${open ? ' dropdown-anim-open' : ''}`}
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          minWidth: 180,
          width: 180,
          maxHeight: 260,
          overflowY: 'auto',
          background: 'var(--form-bg)',
          border: '1.5px solid var(--border-color)',
          borderRadius: 8,
          margin: 0,
          padding: '6px 0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          zIndex: 1000,
          listStyle: 'none',
        }}
      >
        {options.map(opt => (
          <li
            key={opt.value}
            style={{
              padding: '8px 18px',
              cursor: 'pointer',
              color: 'var(--text-color)',
              fontSize: 15,
              transition: 'background 0.18s',
              background: value === opt.value ? 'var(--teach-active-bg)' : 'transparent'
            }}
            onClick={() => { onChange(opt.value); setOpen(false); }}
          >
            <FontAwesomeIcon icon={opt.icon || faFilter} style={{ marginRight: 8, color: 'var(--text-color)' }} />
            {opt.label}
          </li>
        ))}
      </ul>
      <style>{`
        .dropdown-anim {
          opacity: 0;
          transform: translateY(-8px) scale(0.98);
          pointer-events: none;
          transition: opacity 0.22s cubic-bezier(.4,0,.2,1), transform 0.22s cubic-bezier(.4,0,.2,1);
        }
        .dropdown-anim-open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
}

const NotificationsAdmin = () => {
  const { t } = useTranslation();
  const statusOptions = [
    { value: 'unread', label: t('notifications.unread'), icon: faBell },
    { value: 'read', label: t('notifications.read'), icon: faBell },
    { value: 'all', label: t('common.any_status'), icon: faBell },
  ];
  const orderOptions = [
    { value: '-time', label: t('notifications.new_first'), icon: faSort },
    { value: 'time', label: t('notifications.old_first'), icon: faSort },
  ];
  const categoryOptions = [
    { value: 'all', label: t('notifications.all_categories'), icon: faFilter },
    { value: 'learning', label: t('notifications.learning'), icon: faBook },
    { value: 'reviews', label: t('notifications.reviews'), icon: faList },
    { value: 'comments', label: t('notifications.comments'), icon: faList },
    { value: 'teaching', label: t('notifications.teaching'), icon: faList },
    { value: 'other', label: t('notifications.other'), icon: faList },
  ];
  const courseOptions = [
    { value: 'all', label: t('notifications.all_courses'), icon: faBook }
  ];
  const [status, setStatus] = useState('unread');
  const [order, setOrder] = useState('-time');
  const [category, setCategory] = useState('all');
  const [course, setCourse] = useState('all');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', color: 'var(--teach-fg)', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <div style={{ flex: 1, display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        <TeachNavMenu variant="teach" />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '0 0 32px 0' }}>
          <div style={{ width: '100%', maxWidth: 900, margin: '32px auto 0', background: 'var(--form-bg)', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: '32px 24px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <header className="marco-layout__header" style={{ width: '100%', textAlign: 'center', marginBottom: 24 }}>
              <h1 style={{ fontWeight: 700, fontSize: 32, margin: 0, color: 'var(--text-color)', transition: 'color 0.22s' }}>{t('notifications.title')}</h1>
            </header>
            <div style={{ width: '100%', textAlign: 'center', marginBottom: 12, fontWeight: 600, fontSize: 18, color: 'var(--text-color)', letterSpacing: 0.2 }}>
              {t('notifications.filter_by_course')}
            </div>
            <div className="notifications__filters" style={{ display: 'flex', gap: 16, flexWrap: 'nowrap', justifyContent: 'center', width: '100%' }}>
              <AnimatedSelectBox value={status} onChange={setStatus} options={statusOptions} />
              <AnimatedSelectBox value={order} onChange={setOrder} options={orderOptions} />
              <AnimatedSelectBox value={category} onChange={setCategory} options={categoryOptions} />
              <AnimatedSelectBox value={course} onChange={setCourse} options={courseOptions} />
            </div>
          </div>
          {/* Здесь будут уведомления */}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default NotificationsAdmin; 
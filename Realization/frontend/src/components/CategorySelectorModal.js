import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronDown, faTimes } from '@fortawesome/free-solid-svg-icons';
import axios from '../utils/axios';

/**
 * CategorySelectorModal
 * props:
 *   open           - boolean (показывать/скрывать окно)
 *   onClose()      - закрыть без изменений
 *   onConfirm(arr) - подтвердить выбор (arr = массив выбранных id)
 *   initialSelected - массив ранее выбранных id
 */
export default function CategorySelectorModal({ open, onClose, onConfirm, initialSelected = [] }) {
  const [tree, setTree] = useState([]);
  const [expanded, setExpanded] = useState({}); // id -> bool
  const [selected, setSelected] = useState(initialSelected);
  const [loading, setLoading] = useState(false);
  const MAX = 5;
  const [leaving, setLeaving] = useState(false);

  // Сбрасываем флаг leaving при повторном открытии
  useEffect(() => {
    if (open) setLeaving(false);
  }, [open]);

  useEffect(() => {
    if (open && tree.length === 0) {
      setLoading(true);
      axios.get('/categories', {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` },
      })
        .then(res => setTree(res.data))
        .catch(err => console.error('Failed to load categories', err))
        .finally(() => setLoading(false));
    }
  }, [open, tree.length]);

  // reset selection each time modal opens
  useEffect(() => {
    if (open) setSelected(initialSelected);
  }, [open, initialSelected]);

  const toggleExpand = id => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const toggleSelect = id => {
    if (selected.includes(id)) {
      setSelected(selected.filter(x => x !== id));
    } else {
      if (selected.length >= MAX) {
        alert(`Можно выбрать не более ${MAX} категорий`);
        return;
      }
      setSelected([...selected, id]);
    }
  };

  const renderTree = (nodes, level = 0) => (
    <ul style={{ listStyle: 'none', margin: 0, paddingLeft: level === 0 ? 0 : 16 }}>
      {nodes.map(node => (
        <li key={node.id} style={{ margin: '4px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {node.children && node.children.length > 0 && (
              <button type="button" onClick={() => toggleExpand(node.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <FontAwesomeIcon icon={expanded[node.id] ? faChevronDown : faChevronRight} />
              </button>
            )}
            {!(node.children && node.children.length > 0) && <span style={{ width: 14 }} />} {/* spacer */}
            <input
              type="checkbox"
              checked={selected.includes(node.id)}
              onChange={() => toggleSelect(node.id)}
              id={`cat-${node.id}`}
            />
            <label htmlFor={`cat-${node.id}`} style={{ cursor: 'pointer' }}>{node.nameRu || node.nameEn || node.name}</label>
          </div>
          {node.children && node.children.length > 0 && expanded[node.id] && renderTree(node.children, level + 1)}
        </li>
      ))}
    </ul>
  );

  if (!open) return null;

  const handleClose = () => {
    setLeaving(true);
    setTimeout(() => onClose(), 250); // время должно совпадать с анимацией fadeOut 0.25s
  };

  /* Анимации */
  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: `${leaving ? 'fadeOut' : 'fadeIn'} 0.25s ease forwards`
  };
  const modalStyle = {
    background: '#fff', maxWidth: 600, width: '90%', borderRadius: 12, padding: 24,
    maxHeight: '80vh', overflowY: 'auto', position: 'relative',
    animation: `${leaving ? 'scaleOut' : 'scaleIn'} 0.25s ease forwards`
  };

  return (
    <div style={overlayStyle}>
      {/* Добавляем ключевые кадры один раз */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeOut { from { opacity: 1 } to { opacity: 0 } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes scaleOut { from { transform: scale(1); opacity: 1 } to { transform: scale(0.9); opacity: 0 } }
      `}</style>
      <div style={modalStyle}>
        <button onClick={handleClose} title="Закрыть" style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#666' }}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <h2 style={{ marginTop: 0 }}>Выберите категорию курса</h2>
        <p style={{ color: '#555', marginTop: 0, marginBottom: 16 }}>Более точные категории лучше работают в поиске. Вы можете выбрать до 5 категорий и подкатегорий.</p>
        {loading ? <p>Загрузка...</p> : renderTree(tree)}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button type="button" onClick={handleClose} style={{ background: '#fff', border: '1.5px solid #888', borderRadius: 6, padding: '8px 20px', fontSize: 15, cursor: 'pointer' }}>Отменить</button>
          <button
            type="button"
            onClick={() => onConfirm(selected)}
            style={{ background: '#54ad54', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 15, cursor: 'pointer' }}
          >
            Выбрать
          </button>
        </div>
      </div>
    </div>
  );
} 
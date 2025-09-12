import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronDown, faTimes, faFolder, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import useTheme from '../hooks/useTheme';
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
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dark = theme === 'dark';
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
        .then(res => {
          // Строим дерево категорий
          const categories = res.data || [];
          const categoryTree = buildCategoryTree(categories);
          setTree(categoryTree);
        })
        .catch(err => console.error('Failed to load categories', err))
        .finally(() => setLoading(false));
    }
  }, [open, tree.length]);

  // Функция для построения дерева категорий
  const buildCategoryTree = (flatList) => {
    const idToNode = {};
    const roots = [];
    
    // Создаем узлы
    (flatList || []).forEach(cat => {
      const rawId = cat.id ?? cat.ID ?? cat.categoryId ?? cat.category_id;
      if (rawId === undefined || rawId === null) return;
      const key = String(rawId);
      idToNode[key] = { ...cat, id: rawId, children: [] };
    });
    
    // Строим связи
    (flatList || []).forEach(cat => {
      const rawId = cat.id ?? cat.ID ?? cat.categoryId ?? cat.category_id;
      if (rawId === undefined || rawId === null) return;
      const selfKey = String(rawId);
      const rawParent = cat.parentId ?? cat.parent_id ?? cat.parent ?? cat.ParentId;
      const parentKey = rawParent === null || rawParent === undefined || rawParent === '-' || rawParent === '' ? null : String(rawParent);
      
      if (!parentKey || !idToNode[parentKey]) {
        if (idToNode[selfKey]) {
          roots.push(idToNode[selfKey]);
        }
      } else {
        idToNode[parentKey].children.push(idToNode[selfKey]);
      }
    });
    
    return roots;
  };

  // reset selection each time modal opens
  useEffect(() => {
    if (open) setSelected(initialSelected);
  }, [open, initialSelected]);

  const toggleExpand = id => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Вспомогательная функция для поиска узла по ID
  const findNodeById = (nodes, targetId) => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return node;
      }
      if (node.children) {
        const found = findNodeById(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleSelect = id => {
    if (selected.includes(id)) {
      // При снятии выбора с подкатегории проверяем, нужно ли снять выбор с родительской
      const newSelected = selected.filter(x => x !== id);
      
      // Находим родительскую категорию для данной подкатегории
      const findParentId = (nodes, targetId) => {
        for (const node of nodes) {
          if (node.children && node.children.some(child => child.id === targetId)) {
            return node.id;
          }
          if (node.children) {
            const found = findParentId(node.children, targetId);
            if (found) return found;
          }
        }
        return null;
      };
      
      const parentId = findParentId(tree, id);
      
      // Если это подкатегория, проверяем, остались ли другие выбранные подкатегории у родителя
      if (parentId && newSelected.includes(parentId)) {
        const parentNode = findNodeById(tree, parentId);
        if (parentNode && parentNode.children) {
          const hasSelectedChildren = parentNode.children.some(child => 
            newSelected.includes(child.id)
          );
          
          // Если у родителя нет выбранных подкатегорий, снимаем выбор с родителя
          if (!hasSelectedChildren) {
            const finalSelected = newSelected.filter(x => x !== parentId);
            setSelected(finalSelected);
            return;
          }
        }
      }
      
      // Если это родительская категория, снимаем выбор со всех её подкатегорий
      const currentNode = findNodeById(tree, id);
      if (currentNode && currentNode.children && currentNode.children.length > 0) {
        currentNode.children.forEach(child => {
          const childIndex = newSelected.indexOf(child.id);
          if (childIndex > -1) {
            newSelected.splice(childIndex, 1);
          }
        });
      }
      
      setSelected(newSelected);
    } else {
      if (selected.length >= MAX) {
        alert(`Можно выбрать не более ${MAX} категорий`);
        return;
      }
      
      // Находим родительскую категорию для данной подкатегории
      const findParentId = (nodes, targetId) => {
        for (const node of nodes) {
          if (node.children && node.children.some(child => child.id === targetId)) {
            return node.id;
          }
          if (node.children) {
            const found = findParentId(node.children, targetId);
            if (found) return found;
          }
        }
        return null;
      };
      
      const parentId = findParentId(tree, id);
      const newSelected = [...selected, id];
      
      // Если это подкатегория и родительская категория еще не выбрана, добавляем её
      if (parentId && !selected.includes(parentId)) {
        newSelected.push(parentId);
      }
      
      // Если это родительская категория, добавляем все её подкатегории
      const currentNode = findNodeById(tree, id);
      if (currentNode && currentNode.children && currentNode.children.length > 0) {
        currentNode.children.forEach(child => {
          if (!newSelected.includes(child.id)) {
            newSelected.push(child.id);
          }
        });
      }
      
      setSelected(newSelected);
    }
  };

  const renderTree = (nodes, level = 0) => {
    if (!nodes || nodes.length === 0) return null;
    
    return (
      <ul style={{ 
        listStyle: 'none', 
        padding: 0, 
        margin: 0,
        borderLeft: level > 0 ? `2px solid ${dark ? '#4a4f5a' : '#e0e0e0'}` : 'none',
        marginLeft: level > 0 ? 10 : 0
      }}>
        {nodes.map(node => {
          const hasChildren = node.children && node.children.length > 0;
          const isExpanded = expanded[node.id];
          const isSelected = selected.includes(node.id);
          const canExpand = hasChildren && level < 1; // Ограничиваем 2 уровнями (0 и 1)
          
          return (
            <li key={node.id} style={{ 
              margin: '8px 0',
              padding: '8px 12px',
              borderRadius: '8px',
              background: isSelected ? (dark ? '#1e3a5f' : '#e3f2fd') : 'transparent',
              border: isSelected ? '2px solid #2196f3' : `1px solid ${dark ? '#4a4f5a' : 'transparent'}`,
              transition: 'all 0.2s ease'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                cursor: 'pointer'
              }}>
                {canExpand && (
                  <button 
                    type="button" 
                    onClick={() => toggleExpand(node.id)} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      padding: 4,
                      borderRadius: 4,
                      color: dark ? '#b8c5d1' : '#666',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = dark ? '#3a3f4a' : '#f0f0f0'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                  >
                    <FontAwesomeIcon 
                      icon={isExpanded ? faChevronDown : faChevronRight} 
                      style={{ fontSize: '12px' }}
                    />
                  </button>
                )}
                {!canExpand && <span style={{ width: 20 }} />}
                
                <FontAwesomeIcon 
                  icon={hasChildren ? (isExpanded ? faFolderOpen : faFolder) : faFolder} 
                  style={{ 
                    fontSize: '14px', 
                    color: hasChildren ? '#ff9800' : '#4caf50',
                    marginRight: 4
                  }} 
                />
                
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(node.id)}
                  id={`cat-${node.id}`}
                  style={{ margin: 0 }}
                />
                
                <label 
                  htmlFor={`cat-${node.id}`} 
                  style={{ 
                    cursor: 'pointer',
                    fontWeight: level === 0 ? '600' : '400',
                    fontSize: level === 0 ? '16px' : '14px',
                    color: level === 0 ? (dark ? '#eaf4fd' : '#333') : (dark ? '#b8c5d1' : '#555'),
                    flex: 1,
                    margin: 0
                  }}
                >
                  {node.nameRu || node.nameEn || node.name}
                </label>
                
                {hasChildren && level === 0 && (
                  <span style={{ 
                    fontSize: '12px', 
                    color: dark ? '#8a9ba8' : '#999', 
                    background: dark ? '#3a3f4a' : '#f0f0f0', 
                    padding: '2px 6px', 
                    borderRadius: '10px' 
                  }}>
                    {node.children.length} {t('categorySelector.subcategories')}
                  </span>
                )}
              </div>
              
              {canExpand && isExpanded && (
                <div style={{ 
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: `1px solid ${dark ? '#4a4f5a' : '#f0f0f0'}`
                }}>
                  {renderTree(node.children, level + 1)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  if (!open) return null;

  const handleClose = () => {
    setLeaving(true);
    setTimeout(() => onClose(), 250);
  };

  /* Анимации */
  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: `${leaving ? 'fadeOut' : 'fadeIn'} 0.25s ease forwards`
  };
  const modalStyle = {
    background: dark ? '#2d3038' : '#fff', 
    color: dark ? '#eaf4fd' : '#333',
    maxWidth: 700, width: '90%', borderRadius: 12, padding: 24,
    maxHeight: '80vh', overflowY: 'auto', position: 'relative',
    animation: `${leaving ? 'scaleOut' : 'scaleIn'} 0.25s ease forwards`,
    boxShadow: dark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.2)'
  };

  return (
    <div style={overlayStyle}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeOut { from { opacity: 1 } to { opacity: 0 } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes scaleOut { from { transform: scale(1); opacity: 1 } to { transform: scale(0.9); opacity: 0 } }
      `}</style>
      <div style={modalStyle}>
        <button 
          onClick={handleClose} 
          title={t('categorySelector.close')} 
          style={{ 
            position: 'absolute', 
            top: 12, 
            right: 12, 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontSize: 20, 
            color: dark ? '#eaf4fd' : '#666',
            padding: 4,
            borderRadius: 4,
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.target.style.background = dark ? '#3a3f4a' : '#f0f0f0'}
          onMouseOut={(e) => e.target.style.background = 'transparent'}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
        
        <h2 style={{ marginTop: 0, marginBottom: 8, color: dark ? '#eaf4fd' : '#333' }}>{t('categorySelector.title')}</h2>
        <p style={{ 
          color: dark ? '#b8c5d1' : '#666', 
          marginTop: 0, 
          marginBottom: 16, 
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          {t('categorySelector.description')}
          <br />
          <strong>{t('categorySelector.limitation')}</strong>
        </p>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: dark ? '#b8c5d1' : '#666' }}>
            {t('categorySelector.loading')}
          </div>
        ) : (
          <div style={{ 
            border: `1px solid ${dark ? '#4a4f5a' : '#e0e0e0'}`, 
            borderRadius: '8px', 
            padding: '16px',
            maxHeight: '400px',
            overflowY: 'auto',
            background: dark ? '#23272a' : '#fff'
          }}>
            {renderTree(tree)}
          </div>
        )}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: 24,
          paddingTop: 16,
          borderTop: `1px solid ${dark ? '#4a4f5a' : '#e0e0e0'}`
        }}>
          <div style={{ fontSize: '14px', color: dark ? '#b8c5d1' : '#666' }}>
            {t('categorySelector.selected')}: {selected.length} {t('categorySelector.of')} {MAX}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              type="button" 
              onClick={handleClose} 
              style={{ 
                background: dark ? '#2d3038' : '#fff', 
                color: dark ? '#eaf4fd' : '#333',
                border: `1.5px solid ${dark ? '#4a4f5a' : '#888'}`, 
                borderRadius: 6, 
                padding: '10px 20px', 
                fontSize: 14, 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = dark ? '#3a3f4a' : '#f8f8f8'}
              onMouseOut={(e) => e.target.style.background = dark ? '#2d3038' : '#fff'}
            >
              {t('categorySelector.cancel')}
            </button>
            <button
              type="button"
              onClick={() => onConfirm(selected)}
              style={{ 
                background: '#54ad54', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 6, 
                padding: '10px 20px', 
                fontSize: 14, 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#45a049'}
              onMouseOut={(e) => e.target.style.background = '#54ad54'}
            >
              {t('categorySelector.select')} ({selected.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
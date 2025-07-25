import React, { useRef, useEffect, useState } from 'react';
import Tree from 'react-d3-tree';

export default function CategoryGraph({ data, onAdd, onDelete, dark }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  // 1. Убрать inline-стили для цветов, использовать CSS-переменные
  // 2. Добавить классы для контейнера, заголовка, внутренней области, подсказки
  // 3. Цвета SVG (fill, stroke, text) — через переменные

  const themeNodeColor = 'var(--category-node-bg)';
  const themeNodeStroke = 'var(--category-node-border)';
  const themeTextColor = 'var(--category-node-text)';

  // Ensure data has proper structure for react-d3-tree
  const normalizeData = (node) => {
    const displayName = node.nameEn || node.name || node.nameRu || 'Unnamed';
    return {
      ...node,
      name: `${displayName} (${node.id})`,
      value: displayName,
      children: Array.isArray(node.children) ? node.children.map(normalizeData) : []
    };
  };

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
    }
  }, [data]);

  // Вычисляем оптимальные настройки для графа
  const getOptimalSettings = () => {
    const nodeCount = data ? (Array.isArray(data) ? data.length : 1) : 0;
    
    if (nodeCount <= 3) {
      return {
        zoom: 0.8,
        translate: { x: 100, y: 250 },
        separation: { siblings: 1.5, nonSiblings: 2 },
        nodeSize: { x: 180, y: 100 }
      };
    } else if (nodeCount <= 6) {
      return {
        zoom: 0.6,
        translate: { x: 80, y: 250 },
        separation: { siblings: 1.2, nonSiblings: 1.5 },
        nodeSize: { x: 150, y: 80 }
      };
    } else {
      return {
        zoom: 0.5,
        translate: { x: 60, y: 250 },
        separation: { siblings: 1.0, nonSiblings: 1.2 },
        nodeSize: { x: 120, y: 60 }
      };
    }
  };

  const optimalSettings = getOptimalSettings();

  // helper to compute maxDepth
  const getMaxDepth = (node, depth = 0) => {
    if (!node.children || node.children.length === 0) return depth;
    return Math.max(...node.children.map(child => getMaxDepth(child, depth + 1)));
  };

  let maxDepth = 0;
  if (Array.isArray(data)) {
    data.forEach(root => {
      maxDepth = Math.max(maxDepth, getMaxDepth(root, 0));
    });
  }

  const dynamicHeight = Math.max(400, (maxDepth + 2) * 120);

  // Validate data before rendering
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: 500, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '1px dashed #ccc',
        borderRadius: '4px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6c757d', margin: 0 }}>No categories available to display</p>
          <small style={{ color: '#adb5bd' }}>Create some categories to see the hierarchy</small>
        </div>
      </div>
    );
  }

  // Если корень — виртуальный ('Все категории'), показываем только его детей
  let treeData = data;
  if (Array.isArray(data) && data.length === 1 && data[0].name === 'Все категории' && Array.isArray(data[0].children)) {
    treeData = data[0].children;
  }
  // Если нет корней — показываем заглушку
  if (!treeData || (Array.isArray(treeData) && treeData.length === 0)) {
    return (
      <div style={{ 
        width: '100%', 
        height: 500, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '1px dashed #ccc',
        borderRadius: '4px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6c757d', margin: 0 }}>No categories available to display</p>
          <small style={{ color: '#adb5bd' }}>Create some categories to see the hierarchy</small>
        </div>
      </div>
    );
  }
  // Всегда оборачиваем forest в один root-объект, чтобы react-d3-tree рисовал все корни
  // Если forest (несколько корней) — передаем массив напрямую, иначе один root
  let normalizedData;
  if (Array.isArray(treeData) && treeData.length > 1) {
    normalizedData = treeData.map(normalizeData);
  } else if (Array.isArray(treeData)) {
    normalizedData = treeData.map(normalizeData);
  } else {
    normalizedData = [normalizeData(treeData)];
  }
  
  console.log("CategoryGraph received data:", data);
  console.log("CategoryGraph data type:", typeof data);
  console.log("CategoryGraph is array:", Array.isArray(data));
  console.log("CategoryGraph data length:", Array.isArray(data) ? data.length : 'not array');
  console.log("CategoryGraph normalized data:", normalizedData);
  console.log("CategoryGraph optimal settings:", optimalSettings);

  const renderCustomNode = ({ nodeDatum }) => {
    // Не рисуем виртуальный корень 'Все категории'
    if (nodeDatum.name === 'Все категории') {
      return <g/>;
    }
    // Показываем только название категории (nameEn || name || nameRu)
    const label = nodeDatum.nameEn || nodeDatum.name || nodeDatum.nameRu || '';
    return (
      <g>
        <circle r={16} fill={themeNodeColor} stroke={themeNodeStroke} strokeWidth={2} />
        <text 
          fill={themeTextColor}
          stroke="none" 
          x={24} 
          dy={4} 
          fontSize={12}
          style={{ userSelect: 'none' }}
        >
          {label}
        </text>
      </g>
    );
  };

  const handleNodeClick = (nodeData, evt) => {
    try {
      if (evt.shiftKey) {
        if (window.confirm(`Delete category "${nodeData.name}" ?`)) {
          onDelete(nodeData.__data.id);
        }
      } else {
        const name = prompt('Enter subcategory name');
        if (name && name.trim()) {
          onAdd(nodeData.__data.id, name.trim());
        }
      }
    } catch (error) {
      console.error('Error handling node click:', error);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="category-graph-inner"
      style={{ width: '100%', height: dynamicHeight, position: 'relative', overflow: 'auto' }}
    >
      <Tree
        data={normalizedData}
        orientation="vertical"
        translate={{ x: dimensions.width ? dimensions.width / 2 : 300, y: 60 }}
        zoomable
        zoom={optimalSettings.zoom}
        renderCustomNodeElement={renderCustomNode}
        collapsible={false}
        pathClassFunc={() => (dark ? 'link-dark' : 'link-light')}
        onNodeClick={handleNodeClick}
        separation={optimalSettings.separation}
        nodeSize={optimalSettings.nodeSize}
        initialDepth={0}
        depthFactor={120}
      />
      <style>{`
        .link-light { 
          stroke: #999; 
          stroke-width: 2;
        }
        .link-dark { 
          stroke: #7ecbff; 
          stroke-width: 2;
        }
      `}</style>
    </div>
  );
} 
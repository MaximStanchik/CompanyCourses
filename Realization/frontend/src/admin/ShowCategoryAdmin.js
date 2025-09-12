import React, { Component } from "react";
import axios from "../utils/axios";
import { ToastContainer, toast } from "react-toastify";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
// import CategoryGraph from "./CategoryGraph"; // Удален граф
import { withTranslation } from 'react-i18next';

function getCurrentTheme() {
  if (typeof document !== 'undefined') {
    return document.body.getAttribute('data-theme') || localStorage.getItem('theme') || 'light';
  }
  return 'light';
}

function getInputStyles() {
  const theme = getCurrentTheme();
  return {
    borderRadius: '8px',
    border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
    padding: '12px 16px',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
    background: theme === 'dark' ? '#2d2d2d' : '#ffffff',
    color: theme === 'dark' ? '#ffffff' : '#333333'
  };
}

// Функция для преобразования плоского списка в дерево
function buildCategoryTree(flatList) {
  console.log('=== BUILD CATEGORY TREE ===');
  console.log('buildCategoryTree input:', flatList);
  const idToNode = {};
  const roots = [];
  (flatList || []).forEach(cat => {
    const rawId = cat.id ?? cat.ID ?? cat.categoryId ?? cat.category_id;
    if (rawId === undefined || rawId === null) return;
    const key = String(rawId);
    idToNode[key] = { ...cat, id: rawId, children: [] };
  });
  console.log('idToNode after first pass:', idToNode);
  (flatList || []).forEach(cat => {
    const rawId = cat.id ?? cat.ID ?? cat.categoryId ?? cat.category_id;
    if (rawId === undefined || rawId === null) return;
    const selfKey = String(rawId);
    const rawParent = cat.parentId ?? cat.parent_id ?? cat.parent ?? cat.ParentId;
    const parentKey = rawParent === null || rawParent === undefined || rawParent === '-' || rawParent === '' ? null : String(rawParent);
    console.log(`Category ${selfKey} (${cat.nameEn || cat.name}) has parent: ${parentKey}`);
    if (!parentKey || !idToNode[parentKey]) {
      if (idToNode[selfKey]) {
        console.log(`Adding ${selfKey} (${cat.nameEn || cat.name}) as root`);
        roots.push(idToNode[selfKey]);
      }
    } else {
      console.log(`Adding ${selfKey} (${cat.nameEn || cat.name}) as child of ${parentKey}`);
      idToNode[parentKey].children.push(idToNode[selfKey]);
    }
  });
  console.log('Final roots:', roots);
  console.log('Roots with children:', roots.filter(r => r.children && r.children.length > 0));
  return roots;
}

class ShowCategory extends Component {
  constructor(props) {
    super(props);
    this.state = {
      todos: [],
      search: "",
      showEditModal: false,
      editingCategory: null,
      editName: "",
      editNameEn: "",
      editNameRu: "",
      showAddSubModal: false,
      addingToCategory: null,
      newSubName: "",
      newSubNameEn: "",
      newSubNameRu: "",
      newSubNameZh: "",
      newSubNameDe: "",
      newSubNameEs: "",
      newSubNamePt: "",
      newSubNameUk: "",
      newSubNameBe: "",
      showCreateModal: false,
      newCategoryName: "",
      newCategoryNameEn: "",
      newCategoryNameRu: "",
      newCategoryNameZh: "",
      newCategoryNameDe: "",
      newCategoryNameEs: "",
      newCategoryNamePt: "",
      newCategoryNameUk: "",
      newCategoryNameBe: "",
      isCreateModalVisible: false,
      categoryUsageInfo: {}, // Информация о том, какие категории используются в курсах
    };
    this.handleThemeChange = this.handleThemeChange.bind(this);
  }

  // Reusable fetch to refresh categories without full reload
  fetchCategories = async () => {
    try {
      const response = await axios.get("/categories/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      });
      this.setState({ todos: response.data ? response.data : [] });
      
      // Загружаем информацию об использовании категорий
      await this.fetchCategoryUsageInfo();
    } catch (error) {
      if (
        (error.response && error.response.status === 401) ||
        (error.response && error.response.status === 403)
      ) {
        window.location.href = "/";
      } else {
        console.log(error);
      }
    }
  }

  // Загрузка информации о том, какие категории используются в курсах
  fetchCategoryUsageInfo = async () => {
    try {
      const response = await axios.get("/categories/usage-info", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      });
      
      this.setState({ categoryUsageInfo: response.data || {} });
    } catch (error) {
      console.warn("Could not fetch category usage info:", error);
      // Не показываем ошибку пользователю, так как это не критично
    }
  };

  updateSearch(event) {
    this.setState({ search: event.target.value.substr(0, 20) });
  }

  async componentDidMount() {
    window.addEventListener('themeChanged', this.handleThemeChange);
    await this.fetchCategories();
  }

  componentWillUnmount() {
    window.removeEventListener('themeChanged', this.handleThemeChange);
  }

  handleThemeChange() {
    this.forceUpdate(); // Просто перерисовать компонент, не перезагружая страницу
  }

  openEditModal = (category) => {
    const englishName = category.nameEn || category.name || "";
    
    this.setState({
      showEditModal: true,
      editingCategory: category,
      editName: englishName,
      editNameEn: englishName,
      editNameRu: category.nameRu || englishName,
      editNameZh: category.nameZh || englishName,
      editNameDe: category.nameDe || englishName,
      editNameEs: category.nameEs || englishName,
      editNamePt: category.namePt || englishName,
      editNameUk: category.nameUk || englishName,
      editNameBe: category.nameBe || englishName
    });
  }

  closeEditModal = () => {
    this.setState({
      showEditModal: false,
      editingCategory: null,
      editName: "",
      editNameEn: "",
      editNameRu: "",
      editNameZh: "",
      editNameDe: "",
      editNameEs: "",
      editNamePt: "",
      editNameUk: "",
      editNameBe: ""
    });
  }

  handleEditNameChange = (e) => {
    const value = e.target.value;
    this.setState({ 
      editName: value,
      editNameEn: value
    });
  }

  handleEditNameEnChange = (e) => {
    const value = e.target.value;
    this.setState({ 
      editNameEn: value
    });
  }

  handleEditNameRuChange = (e) => {
    this.setState({ editNameRu: e.target.value });
  }

  handleEditNameZhChange = (e) => {
    this.setState({ editNameZh: e.target.value });
  }

  handleEditNameDeChange = (e) => {
    this.setState({ editNameDe: e.target.value });
  }

  handleEditNameEsChange = (e) => {
    this.setState({ editNameEs: e.target.value });
  }

  handleEditNamePtChange = (e) => {
    this.setState({ editNamePt: e.target.value });
  }

  handleEditNameUkChange = (e) => {
    this.setState({ editNameUk: e.target.value });
  }

  handleEditNameBeChange = (e) => {
    this.setState({ editNameBe: e.target.value });
  }

  saveEdit = async () => {
    const { t } = this.props;
    const { editingCategory, editName, editNameEn, editNameRu, editNameZh, editNameDe, editNameEs, editNamePt, editNameUk, editNameBe } = this.state;
    
    if (!editName.trim() || !editNameEn.trim() || !editNameRu.trim()) {
      toast.error(t('common.all_fields_required', 'Все поля должны быть заполнены'));
      return;
    }

    try {
      const response = await axios.put(`/category?id=${editingCategory.id}`, 
        { 
          name: editNameEn,
          nameEn: editNameEn,
          nameRu: editNameRu,
          nameZh: editNameZh,
          nameDe: editNameDe,
          nameEs: editNameEs,
          namePt: editNamePt,
          nameUk: editNameUk,
          nameBe: editNameBe
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken")}` } }
      );
      
      toast.success(t('common.category_updated', 'Категория успешно обновлена'));
      this.closeEditModal();
      await this.fetchCategories();
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        window.location.href = "/login";
      } else {
        toast.error(t('common.error_updating_category', 'Ошибка при обновлении категории'));
      }
    }
  }

  async delete(id) {
    try {
      const response = await axios.delete("/category?id=" + id, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      });
      
      toast.success(this.props.t('admin.category_deleted_success'));
      setTimeout(() => {
        this.fetchCategories();
      }, 1000);
    } catch (error) {
      if (
        (error.response && error.response.status === 401) ||
        (error.response && error.response.status === 403)
      ) {
        window.location.href = "/login";
      } else if (error.response && error.response.status === 409) {
        // Категория используется в курсах
        const errorData = error.response.data;
        const usedInCourses = errorData.usedInCourses || [];
        
        let message = errorData.message || this.props.t('admin.category_cannot_be_deleted');
        
        if (usedInCourses.length > 0) {
          message += `\n\n${this.props.t('admin.used_in_courses')}:\n${usedInCourses.map(course => `• ${course.name} (ID: ${course.id})`).join('\n')}`;
        }
        
        // Показываем ошибку в toast с поддержкой переносов строк
        toast.error(message, {
          autoClose: 8000,
          closeOnClick: false,
          draggable: true,
          style: {
            whiteSpace: 'pre-line'
          }
        });
      } else {
        toast.error(this.props.t('admin.category_delete_error'));
      }
    }
  }

  openAddSubModal = (category) => {
    this.setState({
      showAddSubModal: true,
      addingToCategory: category,
      newSubName: "",
      newSubNameEn: "",
      newSubNameRu: ""
    });
  }

  closeAddSubModal = () => {
    this.setState({
      showAddSubModal: false,
      addingToCategory: null,
      newSubName: "",
      newSubNameEn: "",
      newSubNameRu: "",
      newSubNameZh: "",
      newSubNameDe: "",
      newSubNameEs: "",
      newSubNamePt: "",
      newSubNameUk: "",
      newSubNameBe: ""
    });
  }

  handleNewSubNameChange = (e) => {
    const value = e.target.value;
    this.setState({ 
      newSubName: value,
      newSubNameEn: value,
      newSubNameZh: value,
      newSubNameDe: value,
      newSubNameEs: value,
      newSubNamePt: value,
      newSubNameUk: value,
      newSubNameBe: value
    });
  }

  handleNewSubNameEnChange = (e) => {
    const value = e.target.value;
    this.setState({ 
      newSubName: value,
      newSubNameEn: value,
      newSubNameZh: value,
      newSubNameDe: value,
      newSubNameEs: value,
      newSubNamePt: value,
      newSubNameUk: value,
      newSubNameBe: value
    });
  }

  handleNewSubNameRuChange = (e) => {
    this.setState({ newSubNameRu: e.target.value });
  }

  handleNewSubNameZhChange = (e) => {
    this.setState({ newSubNameZh: e.target.value });
  }

  handleNewSubNameDeChange = (e) => {
    this.setState({ newSubNameDe: e.target.value });
  }

  handleNewSubNameEsChange = (e) => {
    this.setState({ newSubNameEs: e.target.value });
  }

  handleNewSubNamePtChange = (e) => {
    this.setState({ newSubNamePt: e.target.value });
  }

  handleNewSubNameUkChange = (e) => {
    this.setState({ newSubNameUk: e.target.value });
  }

  handleNewSubNameBeChange = (e) => {
    this.setState({ newSubNameBe: e.target.value });
  }

  saveAddSub = async () => {
    const { 
      addingToCategory, 
      newSubName, 
      newSubNameEn, 
      newSubNameRu,
      newSubNameZh,
      newSubNameDe,
      newSubNameEs,
      newSubNamePt,
      newSubNameUk,
      newSubNameBe
    } = this.state;
    
    if (!newSubName.trim() || !newSubNameEn.trim() || !newSubNameRu.trim()) {
      toast.error(this.props.t('admin.all_fields_required'));
      return;
    }

    try {
      await axios.post('/category/add', 
        { 
          name: newSubNameEn,
          nameEn: newSubNameEn,
          nameRu: newSubNameRu,
          nameZh: newSubNameZh,
          nameDe: newSubNameDe,
          nameEs: newSubNameEs,
          namePt: newSubNamePt,
          nameUk: newSubNameUk,
          nameBe: newSubNameBe,
          parentId: addingToCategory.id 
        }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } }
      );
      toast.success(this.props.t('admin.subcategory_created_success'));
      this.closeAddSubModal();
      await this.fetchCategories();
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        window.location.href = "/login";
      } else {
        toast.error(this.props.t('admin.subcategory_create_error'));
      }
    }
  }

  openCreateModal = () => {
    this.setState({
      showCreateModal: true,
      isCreateModalVisible: true,
      newCategoryName: "",
      newCategoryNameEn: "",
      newCategoryNameRu: "",
      newCategoryNameZh: "",
      newCategoryNameDe: "",
      newCategoryNameEs: "",
      newCategoryNamePt: "",
      newCategoryNameUk: "",
      newCategoryNameBe: ""
    });
  }

  closeCreateModal = () => {
    this.setState({ isCreateModalVisible: false });
    setTimeout(() => {
      this.setState({
        showCreateModal: false,
        newCategoryName: "",
        newCategoryNameEn: "",
        newCategoryNameRu: "",
        newCategoryNameZh: "",
        newCategoryNameDe: "",
        newCategoryNameEs: "",
        newCategoryNamePt: "",
        newCategoryNameUk: "",
        newCategoryNameBe: ""
      });
    }, 300);
  }

  handleNewCategoryNameChange = (e) => {
    const value = e.target.value;
    this.setState({ 
      newCategoryName: value,
      newCategoryNameEn: value,
      newCategoryNameZh: value,
      newCategoryNameDe: value,
      newCategoryNameEs: value,
      newCategoryNamePt: value,
      newCategoryNameUk: value,
      newCategoryNameBe: value
    });
  }

  handleNewCategoryNameEnChange = (e) => {
    const value = e.target.value;
    this.setState({ 
      newCategoryName: value,
      newCategoryNameEn: value,
      newCategoryNameZh: value,
      newCategoryNameDe: value,
      newCategoryNameEs: value,
      newCategoryNamePt: value,
      newCategoryNameUk: value,
      newCategoryNameBe: value
    });
  }

  handleNewCategoryNameRuChange = (e) => {
    this.setState({ newCategoryNameRu: e.target.value });
  }

  handleNewCategoryNameZhChange = (e) => {
    this.setState({ newCategoryNameZh: e.target.value });
  }

  handleNewCategoryNameDeChange = (e) => {
    this.setState({ newCategoryNameDe: e.target.value });
  }

  handleNewCategoryNameEsChange = (e) => {
    this.setState({ newCategoryNameEs: e.target.value });
  }

  handleNewCategoryNamePtChange = (e) => {
    this.setState({ newCategoryNamePt: e.target.value });
  }

  handleNewCategoryNameUkChange = (e) => {
    this.setState({ newCategoryNameUk: e.target.value });
  }

  handleNewCategoryNameBeChange = (e) => {
    this.setState({ newCategoryNameBe: e.target.value });
  }

  saveCreateCategory = async () => {
    const { t } = this.props;
    const { newCategoryName, newCategoryNameRu, newCategoryNameZh, newCategoryNameDe, newCategoryNameEs, newCategoryNamePt, newCategoryNameUk, newCategoryNameBe } = this.state;
    if (!newCategoryName.trim() || !newCategoryNameRu.trim()) {
      toast.error(t('common.all_fields_required', 'Все поля должны быть заполнены'));
      return;
    }

    try {
      await axios.post('/category/add', 
        { 
          name: newCategoryName,
          nameEn: newCategoryName,
          nameRu: newCategoryNameRu,
          nameZh: newCategoryNameZh,
          nameDe: newCategoryNameDe,
          nameEs: newCategoryNameEs,
          namePt: newCategoryNamePt,
          nameUk: newCategoryNameUk,
          nameBe: newCategoryNameBe
        }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } }
      );
      toast.success(t('common.category_created', 'Категория успешно создана'));
      this.closeCreateModal();
      await this.fetchCategories();
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        window.location.href = "/login";
      } else {
        toast.error(t('common.error_creating_category', 'Ошибка при создании категории'));
      }
    }
  }

  // Функция для генерации уникального цвета на основе ID категории
  getCategoryColor = (categoryId, level = 0) => {
    const colors = [
      '#4485ed', // синий
      '#54ad54', // зеленый
      '#ffc107', // желтый
      '#dc3545', // красный
      '#6f42c1', // фиолетовый
      '#fd7e14', // оранжевый
      '#20c997', // бирюзовый
      '#e83e8c', // розовый
      '#6c757d', // серый
      '#28a745', // темно-зеленый
      '#17a2b8', // голубой
      '#ff6b6b', // коралловый
      '#4ecdc4', // мятный
      '#45b7d1', // небесно-голубой
      '#96ceb4', // салатовый
      '#feca57', // золотой
      '#ff9ff3', // светло-розовый
      '#54a0ff', // ярко-синий
      '#5f27cd', // темно-фиолетовый
      '#00d2d3'  // бирюзовый
    ];
    
    const colorIndex = categoryId % colors.length;
    const baseColor = colors[colorIndex];
    
    if (level === 0) {
      return baseColor; // Основная категория - полный цвет
    } else {
      // Подкатегории - более светлый оттенок (ближе к белому)
      return this.lightenColor(baseColor, level * 0.3);
    }
  };

  // Функция для осветления цвета (делает его ближе к белому)
  lightenColor = (hex, amount) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Осветляем цвет, смешивая с белым
    const newR = Math.min(255, r + (255 - r) * amount);
    const newG = Math.min(255, g + (255 - g) * amount);
    const newB = Math.min(255, b + (255 - b) * amount);
    
    return `rgb(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(newB)})`;
  };

  // Функция для конвертации hex в rgba
  hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  render() {
    const { t } = this.props;
    const theme = getCurrentTheme();
    const dark = theme === 'dark';
    
    console.log('Loaded categories (todos):', this.state.todos);
    const tree = buildCategoryTree(Array.isArray(this.state.todos) ? this.state.todos : []);
    console.log('tree:', tree);
    console.log('Categories with children:', tree.filter(cat => cat.children && cat.children.length > 0));
    console.log('Tree structure:');
    tree.forEach(root => {
      console.log(`Root: ${root.nameEn || root.name} (ID: ${root.id})`);
      if (root.children && root.children.length > 0) {
        root.children.forEach(child => {
          console.log(`  - Child: ${child.nameEn || child.name} (ID: ${child.id}, parentId: ${child.parentId})`);
        });
      }
    });
    // Оборачиваем в виртуальный корень для корректного отображения всех категорий
    const graphData = [{ name: 'Все категории', children: tree }];
    console.log('graphData:', graphData);
    console.log('Graph data for CategoryGraph:', buildCategoryTree(this.state.todos));

    // Словарь для отображения имени родителя по parentId
    const idToName = {};
    (Array.isArray(this.state.todos) ? this.state.todos : []).forEach(c => {
      const rawId = c.id ?? c.ID ?? c.categoryId ?? c.category_id;
      if (rawId !== undefined && rawId !== null) {
        idToName[String(rawId)] = c.nameEn || c.name;
      }
    });

    // Для таблицы: рекурсивно отображаем дерево
    const Todo = (props) => {
      const { todo, level = 0 } = props;
      const children = todo.children || [];
      return (
        <>
          <tr style={{ 
            transition: 'background 0.18s', 
            borderRadius: 8,
            background: level === 0 ? 'var(--teach-tile-bg, #fff)' : 
                        this.hexToRgba(this.getCategoryColor(todo.id, 0), 0.05),
            borderLeft: level > 0 ? `4px solid ${this.getCategoryColor(todo.id, 0)}` : 'none'
          }} onMouseEnter={e => e.currentTarget.style.background = 'var(--teach-hover-bg)'} onMouseLeave={e => e.currentTarget.style.background = level === 0 ? 'var(--teach-tile-bg, #fff)' : 
                        this.hexToRgba(this.getCategoryColor(todo.id, 0), 0.05)}>
            <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8, minWidth: '150px' }}>
                {(todo.parentId ?? todo.parent_id ?? todo.parent) ? (
                  <span style={{ 
                    color: this.getCategoryColor(todo.parentId ?? todo.parent_id ?? todo.parent, 0),
                    fontWeight: '500'
                  }}>
                    {idToName[String(todo.parentId ?? todo.parent_id ?? todo.parent)] || (todo.parentId ?? todo.parent_id ?? todo.parent)}
                  </span>
                ) : '-'}
              </td>
            <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                {level > 0 && (
                  <>
                    <div style={{ 
                      width: level * 24, 
                      height: '100%',
                      position: 'relative',
                      marginRight: 8,
                      flexShrink: 0
                    }}>
                      {/* Вертикальная линия для связи с родителем */}
                      <div style={{
                        position: 'absolute',
                        left: level * 12 - 1,
                        top: -12,
                        width: 2,
                        height: 24,
                        background: this.getCategoryColor(todo.id, level),
                        opacity: 0.8
                      }} />
                      {/* Горизонтальная линия для уровня */}
                      <div style={{ 
                        position: 'absolute',
                        left: level * 12 - 1,
                        top: 12,
                        width: 12,
                        height: 2,
                        background: this.getCategoryColor(todo.id, level),
                        opacity: 0.9
                      }} />
                    </div>
                  </>
                )}
                <span style={{ 
                  color: level === 0 ? 'var(--text-color)' : this.getCategoryColor(todo.id, level), 
                  fontWeight: level === 0 ? 600 : 500,
                  fontSize: level === 0 ? 16 : 14,
                  paddingLeft: level > 0 ? '8px' : '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: this.getCategoryColor(todo.id, 0),
                    flexShrink: 0
                  }} />
                  {level === 0 && '📁'}
                  {level === 1 && '📂'}
                  {level === 2 && '📄'}
                  {level > 2 && '📋'}
                  {todo.nameEn || todo.name}
                </span>
                {children.length > 0 && (
                  <span style={{ 
                    marginLeft: 8, 
                    color: level === 0 ? 'var(--text-color)' : this.getCategoryColor(todo.id, level), 
                    opacity: 0.7, 
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>📊</span>
                    {children.length} {t('common.subcategories_count', 'подкатегорий')}
                  </span>
                )}
              </div>
            </td>
            <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8, minWidth: '100px' }}>{todo.nameRu || todo.name}</td>
            <td style={{ border: 'none', padding: '14px 10px', borderRadius: 8, minWidth: '100px' }}>{todo.nameBe || todo.name}</td>
            <td style={{ border: 'none', padding: '14px 10px', borderRadius: 8, minWidth: '100px' }}>{todo.nameDe || todo.name}</td>
            <td style={{ border: 'none', padding: '14px 10px', borderRadius: 8, minWidth: '100px' }}>{todo.nameEs || todo.name}</td>
            <td style={{ border: 'none', padding: '14px 10px', borderRadius: 8, minWidth: '100px' }}>{todo.namePt || todo.name}</td>
            <td style={{ border: 'none', padding: '14px 10px', borderRadius: 8, minWidth: '100px' }}>{todo.nameUk || todo.name}</td>
            <td style={{ border: 'none', padding: '14px 10px', borderRadius: 8, minWidth: '100px' }}>{todo.nameZh || todo.name}</td>
            <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8, minWidth: '300px', background: dark ? 'rgba(255,255,255,0.1)' : '#f8f9fa' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => this.openEditModal(todo)} className="btn btn-primary btn-info anim-btn" style={{ borderRadius: 8, fontWeight: 600, fontSize: 14, padding: '8px 16px', border: 'none', background: '#4485ed', color: '#fff', boxShadow: '0 2px 8px rgba(68,133,237,0.08)', transition: 'background 0.2s', minWidth: '80px' }}>{t('common.edit')}</button>
                  {this.state.categoryUsageInfo[todo.id] ? (
                    <button 
                      className="btn btn-secondary anim-btn" 
                      style={{ 
                        borderRadius: 8, 
                        fontWeight: 600, 
                        fontSize: 14, 
                        padding: '8px 16px', 
                        border: 'none', 
                        background: '#6c757d', 
                        color: '#fff', 
                        boxShadow: '0 2px 8px rgba(108,117,125,0.08)', 
                        transition: 'background 0.2s', 
                        minWidth: '80px',
                        cursor: 'not-allowed',
                        opacity: 0.7
                      }}
                      title={`Нельзя удалить: используется в ${this.state.categoryUsageInfo[todo.id].usedInCourses.length} курсах`}
                      disabled
                    >
                      🔒 {t('common.delete')}
                    </button>
                  ) : (
                    <button onClick={() => this.delete(todo.id)} className="btn btn-danger anim-btn" style={{ borderRadius: 8, fontWeight: 600, fontSize: 14, padding: '8px 16px', border: 'none', background: '#d9534f', color: '#fff', boxShadow: '0 2px 8px rgba(217,83,79,0.08)', transition: 'background 0.2s', minWidth: '80px' }}>{t('common.delete')}</button>
                  )}
                </div>
                {/* Показываем кнопку Add Sub только для категорий уровня 0 (не глубже 1 уровня) */}
                {level < 1 && (
                  <button
                    className="btn btn-success btn-sm anim-btn"
                    onClick={() => this.openAddSubModal(todo)}
                    style={{ borderRadius: 8, fontWeight: 600, fontSize: 14, padding: '8px 16px', border: 'none', background: '#54ad54', color: '#fff', boxShadow: '0 2px 8px rgba(84,173,84,0.08)', transition: 'background 0.2s', display: 'inline-flex', alignItems: 'center', minWidth: '120px' }}
                  >
                    {this.props.t('common.add_subcategory', 'Add Sub')}
                  </button>
                )}
              </div>
            </td>
          </tr>
          {children.map(child => (
            <Todo todo={child} key={child.id} level={level + 1} />
          ))}
        </>
      );
    };
    // Прореживаем дерево по поиску, сохраняя ветви с совпадениями
    const pruneBySearch = (nodes, q) => {
      if (!q) return nodes;
      const query = q.toLowerCase();
      const walk = (node) => {
        const matchSelf = ((node.nameEn || node.name || '').toLowerCase().includes(query))
          || ((node.nameRu || '').toLowerCase().includes(query));
        const prunedChildren = (node.children || []).map(walk).filter(Boolean);
        if (matchSelf || prunedChildren.length) {
          return { ...node, children: prunedChildren };
        }
        return null;
      };
      return nodes.map(walk).filter(Boolean);
    };
    const filteredTree = pruneBySearch(tree, this.state.search);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--teach-bg)', color: 'var(--teach-fg)', transition: 'background 0.3s, color 0.3s' }}>
        <NavBar />
        {/* Заголовок удален */}

        {/* Секция визуализации удалена */}

        {/* Controls above table */}
        <div className="container" style={{ marginBottom: 20, marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button
              onClick={this.openCreateModal}
              className="btn anim-btn"
              style={{ height: '34.5px', minWidth: 160, padding: '6px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'var(--teach-btn-bg)', color: 'var(--teach-btn-fg)', border: '1.5px solid var(--border-color)', fontWeight: 600, fontSize: 16, boxShadow: '0 2px 8px rgba(68,133,237,0.08)', whiteSpace: 'nowrap' }}
            >
              {t('common.create_category')}
            </button>
            <input
              type="text"
              placeholder={t('common.search') + '...'}
              className="form-control"
              style={{ height: '40px', borderRadius: 8, border: '1.5px solid var(--border-color)', background: 'var(--field-bg)', color: 'var(--text-color)', fontSize: 15, padding: '0 12px', transition: 'background 0.2s, color 0.2s' }}
              value={this.state.search}
              onChange={this.updateSearch.bind(this)}
            />
          </div>
          {/* Заголовок "Название" удален */}
        </div>

        <div className="container" style={{ borderRadius: 16, boxShadow: '0 4px 24px rgba(68,133,237,0.10)', background: 'var(--teach-tile-bg, #fff)', padding: 0, marginBottom: 32, transition: 'background 0.3s' }}>
          <ToastContainer />
          <div style={{ padding: '10px 20px', background: dark ? 'rgba(255,255,255,0.1)' : '#f8f9fa', borderBottom: '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-color)', textAlign: 'center' }}>
            💡 {t('common.horizontal_scroll_hint', 'Используйте горизонтальную прокрутку для просмотра всех столбцов')}
          </div>
          <div style={{ overflowX: 'auto', borderRadius: 12 }}>
            <table
              className="table table-striped"
              id="categorytable"
              style={{ marginTop: 20, borderRadius: 12, overflow: 'hidden', background: 'var(--teach-tile-bg, #fff)', color: 'var(--text-color)', transition: 'background 0.3s, color 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', minWidth: '1600px' }}
              ref={(el) => (this.el = el)}
              data-order='[[ 1, "asc" ]]'
              data-page-length="25"
            >
            <thead style={{ background: 'var(--teach-hover-bg)', color: 'var(--text-color)' }}>
              <tr>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16, minWidth: '150px' }}>{t('common.parent_id', 'Родительская категория')}</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16, minWidth: '200px' }}>EN</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16, minWidth: '100px' }}>RU</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16, minWidth: '100px' }}>BE</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16, minWidth: '100px' }}>DE</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16, minWidth: '100px' }}>ES</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16, minWidth: '100px' }}>PT</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16, minWidth: '100px' }}>UK</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16, minWidth: '100px' }}>ZH</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16, minWidth: '300px', background: dark ? 'rgba(255,255,255,0.1)' : '#f8f9fa', color: 'var(--text-color)' }}>{t('common.actions', 'Действия')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTree.map(root => (
                <Todo key={root.id} todo={root} level={0} />
              ))}
            </tbody>
          </table>
        </div>
        </div>
        <div style={{ marginTop: 'auto' }}><Footer /></div>

        {/* Модальное окно для редактирования */}
        {this.state.showEditModal && (
          <div className="modal" style={{ 
            display: 'block', 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1050,
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes slideIn {
                from { 
                  opacity: 0; 
                  transform: translateY(-20px) scale(0.95); 
                }
                to { 
                  opacity: 1; 
                  transform: translateY(0) scale(1); 
                }
              }
            `}</style>
            <div className="modal-dialog" style={{ 
              display: 'flex',
              alignItems: 'center',
              minHeight: '100vh'
            }}>
              <div className="modal-content" style={{
                animation: 'slideIn 0.3s ease-out',
                transform: 'translateY(0) scale(1)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                borderRadius: '16px',
                border: 'none',
                background: getCurrentTheme() === 'dark' ? '#2d2d2d' : '#ffffff'
              }}>
                <div className="modal-header" style={{ 
                  borderBottom: `1px solid ${getCurrentTheme() === 'dark' ? '#404040' : '#e9ecef'}`,
                  padding: '20px 24px',
                  borderRadius: '16px 16px 0 0'
                }}>
                  <h5 className="modal-title" style={{ 
                    margin: 0, 
                    fontSize: '20px', 
                    fontWeight: '600',
                    color: 'var(--text-color)'
                  }}>
                    {this.state.editingCategory && this.state.editingCategory.parentId ? 
                      t('common.edit_subcategory', 'Редактировать подкатегорию') : 
                      t('common.edit_category', 'Редактировать категорию')
                    }
                  </h5>
                  <button 
                    type="button" 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      fontSize: '24px', 
                      cursor: 'pointer',
                      color: '#6c757d',
                      transition: 'color 0.2s ease'
                    }} 
                    onClick={this.closeEditModal}
                    onMouseOver={(e) => e.target.style.color = '#dc3545'}
                    onMouseOut={(e) => e.target.style.color = '#6c757d'}
                  >
                    ✕
                  </button>
                </div>
                <div className="modal-body" style={{ 
                  padding: '24px',
                  maxHeight: '70vh',
                  overflowY: 'auto'
                }}>
                  <div className="mb-3">
                    <label htmlFor="categoryNameEn" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.english')}):</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="categoryNameEn" 
                      placeholder={t('common.enter_category_name_en')} 
                      value={this.state.editNameEn} 
                      onChange={this.handleEditNameEnChange} 
                      required 
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="categoryNameRu" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.russian')}):</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="categoryNameRu" 
                      placeholder={t('common.enter_category_name_ru')} 
                      value={this.state.editNameRu} 
                      onChange={this.handleEditNameRuChange} 
                      required 
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="categoryNameZh" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.chinese')}):</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="categoryNameZh" 
                      placeholder={t('common.enter_category_name_zh')} 
                      value={this.state.editNameZh || ''} 
                      onChange={e => this.setState({ editNameZh: e.target.value })} 
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="categoryNameDe" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.german')}):</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="categoryNameDe" 
                      placeholder={t('common.enter_category_name_de')} 
                      value={this.state.editNameDe || ''} 
                      onChange={e => this.setState({ editNameDe: e.target.value })} 
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="categoryNameEs" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.spanish')}):</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="categoryNameEs" 
                      placeholder={t('common.enter_category_name_es')} 
                      value={this.state.editNameEs || ''} 
                      onChange={e => this.setState({ editNameEs: e.target.value })} 
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="categoryNamePt" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.portuguese')}):</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="categoryNamePt" 
                      placeholder={t('common.enter_category_name_pt')} 
                      value={this.state.editNamePt || ''} 
                      onChange={e => this.setState({ editNamePt: e.target.value })} 
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="categoryNameUk" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.ukrainian')}):</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="categoryNameUk" 
                      placeholder={t('common.enter_category_name_uk')} 
                      value={this.state.editNameUk || ''} 
                      onChange={e => this.setState({ editNameUk: e.target.value })} 
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="categoryNameBe" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.belarusian')}):</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="categoryNameBe" 
                      placeholder={t('common.enter_category_name_be')} 
                      value={this.state.editNameBe || ''} 
                      onChange={e => this.setState({ editNameBe: e.target.value })} 
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                  </div>
                </div>
                <div className="modal-footer" style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: '12px',
                  padding: '20px 24px',
                  borderTop: `1px solid ${getCurrentTheme() === 'dark' ? '#404040' : '#e9ecef'}`
                }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={this.closeEditModal}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: '1px solid #6c757d',
                      background: 'transparent',
                      color: '#6c757d',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      height: '40px',
                      minWidth: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#6c757d';
                      e.target.style.color = '#fff';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#6c757d';
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={this.saveEdit}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#4485ed',
                      color: '#fff',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(68, 133, 237, 0.2)',
                      height: '40px',
                      minWidth: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '0'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#3668c9';
                      e.target.style.boxShadow = '0 4px 12px rgba(68, 133, 237, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = '#4485ed';
                      e.target.style.boxShadow = '0 2px 8px rgba(68, 133, 237, 0.2)';
                    }}
                  >
                    {t('common.save')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно для добавления подкатегории */}
        {this.state.showAddSubModal && (
          <div className="modal" style={{ 
            display: 'block', 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1050,
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div className="modal-dialog" style={{ 
              display: 'flex',
              alignItems: 'center',
              minHeight: '100vh'
            }}>
              <div className="modal-content" style={{
                animation: 'slideIn 0.3s ease-out',
                transform: 'translateY(0) scale(1)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                borderRadius: '16px',
                border: 'none',
                background: getCurrentTheme() === 'dark' ? '#2d2d2d' : '#ffffff'
              }}>
                <div className="modal-header" style={{ 
                  borderBottom: `1px solid ${getCurrentTheme() === 'dark' ? '#404040' : '#e9ecef'}`,
                  padding: '20px 24px',
                  borderRadius: '16px 16px 0 0'
                }}>
                  <h5 className="modal-title" style={{ 
                    margin: 0, 
                    fontSize: '20px', 
                    fontWeight: '600',
                    color: 'var(--text-color)'
                  }}>{t('common.add_subcategory')}</h5>
                  <button 
                    type="button" 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      fontSize: '24px', 
                      cursor: 'pointer',
                      color: '#6c757d',
                      transition: 'color 0.2s ease'
                    }} 
                    onClick={this.closeAddSubModal}
                    onMouseOver={(e) => e.target.style.color = '#dc3545'}
                    onMouseOut={(e) => e.target.style.color = '#6c757d'}
                  >
                    ✕
                  </button>
                </div>
                <div className="modal-body" style={{ 
                  padding: '24px',
                  maxHeight: '70vh',
                  overflowY: 'auto'
                }}>
                  <div className="mb-3">
                    <label htmlFor="subCategoryName" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.english')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="subCategoryName"
                      value={this.state.newSubName}
                      onChange={this.handleNewSubNameChange}
                      placeholder={t('common.enter_subcategory_name_en')}
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="subCategoryNameRu" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.russian')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="subCategoryNameRu"
                      value={this.state.newSubNameRu}
                      onChange={this.handleNewSubNameRuChange}
                      placeholder={t('common.enter_subcategory_name_ru')}
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="subCategoryNameZh" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.chinese')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="subCategoryNameZh"
                      value={this.state.newSubNameZh}
                      onChange={this.handleNewSubNameZhChange}
                      placeholder={t('common.enter_subcategory_name_zh')}
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                </div>
                  <div className="mb-3">
                    <label htmlFor="subCategoryNameDe" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.german')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="subCategoryNameDe"
                      value={this.state.newSubNameDe}
                      onChange={this.handleNewSubNameDeChange}
                      placeholder={t('common.enter_subcategory_name_de')}
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="subCategoryNameEs" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.spanish')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="subCategoryNameEs"
                      value={this.state.newSubNameEs}
                      onChange={this.handleNewSubNameEsChange}
                      placeholder={t('common.enter_subcategory_name_es')}
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="subCategoryNamePt" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.portuguese')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="subCategoryNamePt"
                      value={this.state.newSubNamePt}
                      onChange={this.handleNewSubNamePtChange}
                      placeholder={t('common.enter_subcategory_name_pt')}
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="subCategoryNameUk" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.ukrainian')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="subCategoryNameUk"
                      value={this.state.newSubNameUk}
                      onChange={this.handleNewSubNameUkChange}
                      placeholder={t('common.enter_subcategory_name_uk')}
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="subCategoryNameBe" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.belarusian')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="subCategoryNameBe"
                      value={this.state.newSubNameBe}
                      onChange={this.handleNewSubNameBeChange}
                      placeholder={t('common.enter_subcategory_name_be')}
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                  </div>
                </div>
                <div className="modal-footer" style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  alignItems: 'center',
                  gap: '12px',
                  padding: '20px 24px',
                  borderTop: `1px solid ${getCurrentTheme() === 'dark' ? '#404040' : '#e9ecef'}`,
                  borderRadius: '0 0 16px 16px'
                }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={this.closeAddSubModal}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: '1px solid #6c757d',
                      background: 'transparent',
                      color: '#6c757d',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      height: '40px',
                      minWidth: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#6c757d';
                      e.target.style.color = '#fff';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#6c757d';
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={this.saveAddSub}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#4485ed',
                      color: '#fff',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(68, 133, 237, 0.2)',
                      height: '40px',
                      minWidth: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '0'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#3668c9';
                      e.target.style.boxShadow = '0 4px 12px rgba(68, 133, 237, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = '#4485ed';
                      e.target.style.boxShadow = '0 2px 8px rgba(68, 133, 237, 0.2)';
                    }}
                  >
                    {t('common.save')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно для создания категории */}
        {this.state.showCreateModal && (
          <div className="modal" style={{ 
            display: 'block', 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1050,
            animation: this.state.isCreateModalVisible ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.3s ease-out'
          }}>
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
              }
              @keyframes slideIn {
                from { 
                  opacity: 0; 
                  transform: translateY(-20px) scale(0.95); 
                }
                to { 
                  opacity: 1; 
                  transform: translateY(0) scale(1); 
                }
              }
              @keyframes slideOut {
                from { 
                  opacity: 1; 
                  transform: translateY(0) scale(1); 
                }
                to { 
                  opacity: 0; 
                  transform: translateY(-20px) scale(0.95); 
                }
              }
            `}</style>
            <div className="modal-dialog" style={{ 
              display: 'flex',
              alignItems: 'center',
              minHeight: '100vh'
            }}>
              <div className="modal-content" style={{
                animation: this.state.isCreateModalVisible ? 'slideIn 0.3s ease-out' : 'slideOut 0.3s ease-out',
                transform: this.state.isCreateModalVisible ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.95)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                borderRadius: '16px',
                border: 'none',
                background: getCurrentTheme() === 'dark' ? '#2d2d2d' : '#ffffff'
              }}>
                <div className="modal-header" style={{ 
                  borderBottom: `1px solid ${getCurrentTheme() === 'dark' ? '#404040' : '#e9ecef'}`,
                  padding: '20px 24px',
                  borderRadius: '16px 16px 0 0'
                }}>
                  <h5 className="modal-title" style={{ 
                    margin: 0, 
                    fontSize: '20px', 
                    fontWeight: '600',
                    color: 'var(--text-color)'
                  }}>{t('common.create_category')}</h5>
                  <button 
                    type="button" 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      fontSize: '24px', 
                      cursor: 'pointer',
                      color: '#6c757d',
                      transition: 'color 0.2s ease'
                    }} 
                    onClick={this.closeCreateModal}
                    onMouseOver={(e) => e.target.style.color = '#dc3545'}
                    onMouseOut={(e) => e.target.style.color = '#6c757d'}
                  >
                    ✕
                  </button>
                </div>
                <div className="modal-body" style={{ 
                  padding: '24px',
                  maxHeight: '70vh',
                  overflowY: 'auto'
                }}>
                  <div className="mb-3">
                    <label htmlFor="newCategoryName" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.english')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="newCategoryName"
                      value={this.state.newCategoryName}
                      onChange={this.handleNewCategoryNameChange}
                      placeholder={t('common.enter_category_name_en')}
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="newCategoryNameRu" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.russian')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="newCategoryNameRu"
                      value={this.state.newCategoryNameRu}
                      onChange={this.handleNewCategoryNameRuChange}
                      placeholder={t('common.enter_category_name_ru')}
                      style={getInputStyles()}
                      onFocus={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = theme === 'dark' ? '#2d2d2d' : '#ffffff';
                        e.target.style.color = theme === 'dark' ? '#ffffff' : '#333333';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="newCategoryNameZh" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.chinese')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="newCategoryNameZh"
                      value={this.state.newCategoryNameZh}
                      onChange={this.handleNewCategoryNameZhChange}
                      placeholder={t('common.enter_category_name_zh')}
                      style={getInputStyles()}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="newCategoryNameDe" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.german')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="newCategoryNameDe"
                      value={this.state.newCategoryNameDe}
                      onChange={this.handleNewCategoryNameDeChange}
                      placeholder={t('common.enter_category_name_de')}
                      style={getInputStyles()}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="newCategoryNameEs" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.spanish')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="newCategoryNameEs"
                      value={this.state.newCategoryNameEs}
                      onChange={this.handleNewCategoryNameEsChange}
                      placeholder={t('common.enter_category_name_es')}
                      style={getInputStyles()}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="newCategoryNamePt" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.portuguese')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="newCategoryNamePt"
                      value={this.state.newCategoryNamePt}
                      onChange={this.handleNewCategoryNamePtChange}
                      placeholder={t('common.enter_category_name_pt')}
                      style={getInputStyles()}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="newCategoryNameUk" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.ukrainian')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="newCategoryNameUk"
                      value={this.state.newCategoryNameUk}
                      onChange={this.handleNewCategoryNameUkChange}
                      placeholder={t('common.enter_category_name_uk')}
                      style={getInputStyles()}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="newCategoryNameBe" className="form-label" style={{ 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: 'var(--text-color)'
                    }}>{t('common.category_name')} ({t('common.belarusian')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="newCategoryNameBe"
                      value={this.state.newCategoryNameBe}
                      onChange={this.handleNewCategoryNameBeChange}
                      placeholder={t('common.enter_category_name_be')}
                      style={getInputStyles()}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#4485ed';
                        e.target.style.boxShadow = '0 0 0 3px rgba(68, 133, 237, 0.1)';
                      }}
                      onBlur={(e) => {
                        const theme = getCurrentTheme();
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
                <div className="modal-footer" style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  alignItems: 'center',
                  gap: '12px',
                  padding: '20px 24px',
                  borderTop: `1px solid ${getCurrentTheme() === 'dark' ? '#404040' : '#e9ecef'}`,
                  borderRadius: '0 0 16px 16px'
                }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={this.closeCreateModal}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: '1px solid #6c757d',
                      background: 'transparent',
                      color: '#6c757d',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      height: '40px',
                      minWidth: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#6c757d';
                      e.target.style.color = '#fff';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#6c757d';
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={this.saveCreateCategory}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#4485ed',
                      color: '#fff',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(68, 133, 237, 0.2)',
                      height: '40px',
                      minWidth: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '0'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#3367d6';
                      e.target.style.boxShadow = '0 4px 12px rgba(68, 133, 237, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = '#4485ed';
                      e.target.style.boxShadow = '0 2px 8px rgba(68, 133, 237, 0.2)';
                    }}
                  >
                    {t('common.save')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default withTranslation()(ShowCategory);

import React, { Component } from "react";
import axios from "../utils/axios";
import { ToastContainer, toast } from "react-toastify";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import CategoryGraph from "./CategoryGraph";
import { withTranslation } from 'react-i18next';

function getCurrentTheme() {
  if (typeof document !== 'undefined') {
    return document.body.getAttribute('data-theme') || localStorage.getItem('theme') || 'light';
  }
  return 'light';
}

// Функция для преобразования плоского списка в дерево
function buildCategoryTree(flatList) {
  const idToNode = {};
  const roots = [];
  flatList.forEach(cat => {
    idToNode[cat.id] = { ...cat, children: [] };
  });
  flatList.forEach(cat => {
    // Считаем корнем, если parentId пустой, null, undefined или '-'
    if (!cat.parentId || cat.parentId === '-' || !idToNode[cat.parentId]) {
      roots.push(idToNode[cat.id]);
    } else {
      idToNode[cat.parentId].children.push(idToNode[cat.id]);
    }
  });
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
      showCreateModal: false,
      newCategoryName: "",
      newCategoryNameEn: "",
      newCategoryNameRu: "",
    };
    this.handleThemeChange = this.handleThemeChange.bind(this);
  }

  updateSearch(event) {
    this.setState({ search: event.target.value.substr(0, 20) });
  }

  async componentDidMount() {
    window.addEventListener('themeChanged', this.handleThemeChange);
    axios
      .get("/categories/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((response) => {
        console.log("Loaded categories:", response.data);
        console.log("Categories count:", response.data ? response.data.length : 0);
        console.log("Categories structure:", response.data ? response.data.map(cat => ({
          id: cat.id,
          name: cat.name,
          nameEn: cat.nameEn,
          nameRu: cat.nameRu,
          parentId: cat.parentId,
          children: cat.children ? cat.children.length : 0
        })) : []);
        this.setState({ todos: response.data ? response.data : [] });
      })
      .catch((error) => {
        if (
          (error.response && error.response.status === 401) ||
          (error.response && error.response.status === 403)
        ) {
          window.location.href = "/";
        } else {
          console.log(error);
        }
      });
  }

  componentWillUnmount() {
    window.removeEventListener('themeChanged', this.handleThemeChange);
  }

  handleThemeChange() {
    this.forceUpdate(); // Просто перерисовать компонент, не перезагружая страницу
  }

  openEditModal = (category) => {
    this.setState({
      showEditModal: true,
      editingCategory: category,
      editName: category.nameEn || category.name || "",
      editNameEn: category.nameEn || category.name || "",
      editNameRu: category.nameRu || ""
    });
  }

  closeEditModal = () => {
    this.setState({
      showEditModal: false,
      editingCategory: null,
      editName: "",
      editNameEn: "",
      editNameRu: ""
    });
  }

  handleEditNameChange = (e) => {
    const value = e.target.value;
    this.setState({ 
      editName: value,
      editNameEn: value // синхронизируем с английским полем
    });
  }

  handleEditNameEnChange = (e) => {
    const value = e.target.value;
    this.setState({ 
      editName: value,
      editNameEn: value
    });
  }

  handleEditNameRuChange = (e) => {
    this.setState({ editNameRu: e.target.value });
  }

  saveEdit = async () => {
    const { editingCategory, editName, editNameEn, editNameRu } = this.state;
    if (!editName.trim() || !editNameEn.trim() || !editNameRu.trim()) {
      toast.error("Все поля должны быть заполнены");
      return;
    }

    try {
      await axios.put(`/category?id=${editingCategory.id}`, 
        { 
          name: editNameEn,
          nameEn: editNameEn,
          nameRu: editNameRu
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken")}` } }
      );
      toast.success("Категория успешно обновлена");
      this.closeEditModal();
      window.location.reload();
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        window.location.href = "/login";
      } else {
        toast.error("Ошибка при обновлении категории");
      }
    }
  }

  async delete(id) {
    axios
      .delete("/category?id=" + id, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then(() => {
        toast.success("Deleted successfully");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      })
      .catch((error) => {
        if (
          (error.response && error.response.status === 401) ||
          (error.response && error.response.status === 403)
        ) {
          window.location.href = "/login";
        } else {
          toast.error("Category not deleted");
        }
      });
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
      newSubNameRu: ""
    });
  }

  handleNewSubNameChange = (e) => {
    const value = e.target.value;
    this.setState({ 
      newSubName: value,
      newSubNameEn: value // синхронизируем с английским полем
    });
  }

  handleNewSubNameEnChange = (e) => {
    const value = e.target.value;
    this.setState({ 
      newSubName: value,
      newSubNameEn: value
    });
  }

  handleNewSubNameRuChange = (e) => {
    this.setState({ newSubNameRu: e.target.value });
  }

  saveAddSub = async () => {
    const { addingToCategory, newSubName, newSubNameEn, newSubNameRu } = this.state;
    if (!newSubName.trim() || !newSubNameEn.trim() || !newSubNameRu.trim()) {
      toast.error("Все поля должны быть заполнены");
      return;
    }

    try {
      await axios.post('/category/add', 
        { 
          name: newSubNameEn,
          nameEn: newSubNameEn,
          nameRu: newSubNameRu,
          parentId: addingToCategory.id 
        }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } }
      );
      toast.success("Подкатегория успешно создана");
      this.closeAddSubModal();
      window.location.reload();
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        window.location.href = "/login";
      } else {
        toast.error("Ошибка при создании подкатегории");
      }
    }
  }

  openCreateModal = () => {
    this.setState({
      showCreateModal: true,
      newCategoryName: "",
      newCategoryNameEn: "",
      newCategoryNameRu: ""
    });
  }

  closeCreateModal = () => {
    this.setState({
      showCreateModal: false,
      newCategoryName: "",
      newCategoryNameEn: "",
      newCategoryNameRu: ""
    });
  }

  handleNewCategoryNameChange = (e) => {
    const value = e.target.value;
    this.setState({ 
      newCategoryName: value,
      newCategoryNameEn: value // синхронизируем с английским полем
    });
  }

  handleNewCategoryNameEnChange = (e) => {
    const value = e.target.value;
    this.setState({ 
      newCategoryName: value,
      newCategoryNameEn: value
    });
  }

  handleNewCategoryNameRuChange = (e) => {
    this.setState({ newCategoryNameRu: e.target.value });
  }

  saveCreateCategory = async () => {
    const { newCategoryName, newCategoryNameRu } = this.state;
    if (!newCategoryName.trim() || !newCategoryNameRu.trim()) {
      toast.error("Все поля должны быть заполнены");
      return;
    }

    try {
      await axios.post('/category/add', 
        { 
          name: newCategoryName,
          nameEn: newCategoryName,
          nameRu: newCategoryNameRu
        }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } }
      );
      toast.success("Категория успешно создана");
      this.closeCreateModal();
      window.location.reload();
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        window.location.href = "/login";
      } else {
        toast.error("Ошибка при создании категории");
      }
    }
  }

  render() {
    const { t } = this.props;
    const theme = getCurrentTheme();
    const dark = theme === 'dark';
    
    console.log('Loaded categories (todos):', this.state.todos);
    const tree = buildCategoryTree(Array.isArray(this.state.todos) ? this.state.todos : []);
    console.log('tree:', tree);
    // Оборачиваем в виртуальный корень для корректного отображения всех категорий
    const graphData = [{ name: 'Все категории', children: tree }];
    console.log('graphData:', graphData);

    // Для таблицы: рекурсивно отображаем дерево
    const Todo = (props) => {
      const { todo, level = 0 } = props;
      const children = todo.children || [];
      return (
        <>
          <tr style={{ transition: 'background 0.18s', borderRadius: 8 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--teach-hover-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>
              {level > 0 && '└ '.repeat(level)}{todo.nameEn || todo.name}
            </td>
            <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{todo.nameEn || todo.name}</td>
            <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{todo.nameRu || todo.name}</td>
            <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{todo.nameBe || todo.name}</td>
            <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{todo.nameDe || todo.name}</td>
            <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{todo.nameEs || todo.name}</td>
            <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{todo.namePt || todo.name}</td>
            <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{todo.nameUk || todo.name}</td>
            <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{todo.nameZh || todo.name}</td>
            <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{todo.parentId || '-'}</td>
            <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>
              <button onClick={() => this.openEditModal(todo)} className="btn btn-primary btn-info anim-btn" style={{ borderRadius: 8, fontWeight: 600, fontSize: 15, padding: '6px 18px', marginRight: 8, border: 'none', background: '#4485ed', color: '#fff', boxShadow: '0 2px 8px rgba(68,133,237,0.08)', transition: 'background 0.2s' }}>{t('common.edit')}</button>
              <button onClick={() => this.delete(todo.id)} className="btn btn-danger anim-btn" style={{ borderRadius: 8, fontWeight: 600, fontSize: 15, padding: '6px 18px', border: 'none', background: '#d9534f', color: '#fff', boxShadow: '0 2px 8px rgba(217,83,79,0.08)', transition: 'background 0.2s' }}>{t('common.delete')}</button>
              {/* Показываем кнопку Add Sub только для категорий первого и второго уровня */}
              {level < 2 && (
                <button
                  className="btn btn-success btn-sm anim-btn"
                  onClick={() => this.openAddSubModal(todo)}
                  style={{ marginTop: 20, marginRight: 10, marginBottom: 5, borderRadius: 8, fontWeight: 600, fontSize: 15, paddingRight: 18, paddingLeft: 18, paddingTop: 6, paddingBottom: 6, border: 'none', background: '#54ad54', color: '#fff', boxShadow: '0 2px 8px rgba(84,173,84,0.08)', transition: 'background 0.2s', height: 40, display: 'inline-flex', alignItems: 'center' }}
                >
                  {this.props.t('common.add_subcategory', 'Add Sub')}
                </button>
              )}
            </td>
          </tr>
          {children.map(child => (
            <Todo todo={child} key={child.id} level={level + 1} />
          ))}
        </>
      );
    };

    // Фильтрация только по корневым категориям и поиску
    let filteredusers = (this.state.todos || []).filter((category) =>
      (category.nameEn || category.name).toLowerCase().includes(this.state.search.toLowerCase())
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--teach-bg)', color: 'var(--teach-fg)', transition: 'background 0.3s, color 0.3s' }}>
        <NavBar />
        <div style={{ padding: '24px 0 10px 0', textAlign: 'center' }}>
          <h1 style={{ color: 'var(--text-color)', fontWeight: 700, fontSize: 32, margin: 0, transition: 'color 0.3s' }}>
            {t('common.category_list')}
          </h1>
        </div>

        {/* Graph view with border and better styling */}
        <div className="container" style={{ marginBottom: 30 }}>
          <div className={dark ? 'category-graph-container dark' : 'category-graph-container'}>
            <h4 className="category-graph-title">
              {t('common.category_hierarchy_visualization', 'Category Hierarchy Visualization')}
            </h4>
            <div className="category-graph-inner">
              <CategoryGraph
                data={graphData}
                dark={dark}
                onAdd={(parentId,name)=> {
                  axios.post('/category/add', { name, parentId }, { headers:{Authorization:`Bearer ${localStorage.getItem('jwtToken')}`} }).then(()=>window.location.reload()).catch(()=>alert('Error'));
                }}
                onDelete={(id)=> {
                  if(window.confirm(t('common.delete_category_confirm', 'Delete category?'))){
                    axios.delete('/category?id='+id,{ headers:{Authorization:`Bearer ${localStorage.getItem('jwtToken')}`} }).then(()=>window.location.reload()).catch(()=>alert('Error'));
                  }
                }}
              />
            </div>
            <div className="category-graph-hint">
              {t('common.graph_hint', '💡 Click on a node to add subcategory, Shift+Click to delete')}
            </div>
          </div>
        </div>

        {/* Controls above table */}
        <div className="container" style={{ marginBottom: 20 }}>
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
          <div style={{ fontWeight: 700, fontSize: 18, marginTop: 18, marginBottom: 4, color: 'var(--text-color)' }}>{t('common.name_column')}</div>
        </div>

        <div className="container" style={{ borderRadius: 16, boxShadow: '0 4px 24px rgba(68,133,237,0.10)', background: 'var(--teach-tile-bg, #fff)', padding: 0, marginBottom: 32, transition: 'background 0.3s' }}>
          <ToastContainer />
          <table
            className="table table-striped"
            id="categorytable"
            style={{ marginTop: 20, borderRadius: 12, overflow: 'hidden', background: 'var(--teach-tile-bg, #fff)', color: 'var(--text-color)', transition: 'background 0.3s, color 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
            ref={(el) => (this.el = el)}
            data-order='[[ 1, "asc" ]]'
            data-page-length="25"
          >
            <thead style={{ background: 'var(--teach-hover-bg)', color: 'var(--text-color)' }}>
              <tr>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16 }}>EN</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16 }}>RU</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16 }}>BE</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16 }}>DE</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16 }}>ES</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16 }}>PT</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16 }}>UK</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16 }}>ZH</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16 }}>{t('common.parent_id', 'Parent Category')}</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16 }}>{t('common.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredusers.map((currentTodo, i) => (
                <tr style={{ transition: 'background 0.18s', borderRadius: 8 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--teach-hover-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} key={i}>
                  <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{currentTodo.nameEn || t('common.dash')}</td>
                  <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{currentTodo.nameRu || t('common.dash')}</td>
                  <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{currentTodo.nameBe || t('common.dash')}</td>
                  <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{currentTodo.nameDe || t('common.dash')}</td>
                  <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{currentTodo.nameEs || t('common.dash')}</td>
                  <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{currentTodo.namePt || t('common.dash')}</td>
                  <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{currentTodo.nameUk || t('common.dash')}</td>
                  <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{currentTodo.nameZh || t('common.dash')}</td>
                  <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{currentTodo.parentId || t('common.dash')}</td>
                  <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>
                    <button onClick={() => this.openEditModal(currentTodo)} className="btn btn-primary btn-info anim-btn" style={{ borderRadius: 8, fontWeight: 600, fontSize: 15, padding: '6px 18px', marginRight: 8, border: 'none', background: '#4485ed', color: '#fff', boxShadow: '0 2px 8px rgba(68,133,237,0.08)', transition: 'background 0.2s' }}>{t('common.edit')}</button>
                    <button onClick={() => this.delete(currentTodo.id)} className="btn btn-danger anim-btn" style={{ borderRadius: 8, fontWeight: 600, fontSize: 15, padding: '6px 18px', border: 'none', background: '#d9534f', color: '#fff', boxShadow: '0 2px 8px rgba(217,83,79,0.08)', transition: 'background 0.2s' }}>{t('common.delete')}</button>
                    {(!currentTodo.parentId || currentTodo.parentId === '-' || currentTodo.level < 2) && (
                      <button
                        className="btn btn-success btn-sm anim-btn"
                        onClick={() => this.openAddSubModal(currentTodo)}
                        style={{ marginTop: 20, marginRight: 10, marginBottom: 5, borderRadius: 8, fontWeight: 600, fontSize: 15, paddingRight: 18, paddingLeft: 18, paddingTop: 6, paddingBottom: 6, border: 'none', background: '#54ad54', color: '#fff', boxShadow: '0 2px 8px rgba(84,173,84,0.08)', transition: 'background 0.2s', height: 40, display: 'inline-flex', alignItems: 'center' }}
                      >
                        {this.props.t('common.add_subcategory', 'Add Sub')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            zIndex: 1050
          }}>
            <div className="modal-dialog" style={{ 
              display: 'flex',
              alignItems: 'center',
              minHeight: '100vh'
            }}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Редактировать категорию</h5>
                  <button type="button" style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }} onClick={this.closeEditModal}>
                    ✕
                  </button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="categoryNameEn" className="form-label">Название категории (английское):</label>
                    <input type="text" className="form-control" id="categoryNameEn" placeholder={t('common.enter_category_name', 'Enter category name in English')} value={this.state.editNameEn} onChange={this.handleEditNameEnChange} required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="categoryNameRu" className="form-label">Название на русском:</label>
                    <input type="text" className="form-control" id="categoryNameRu" placeholder={t('common.enter_category_name_ru', 'Введите название категории на русском')} value={this.state.editNameRu} onChange={this.handleEditNameRuChange} required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="categoryNameBe" className="form-label">Название на белорусском:</label>
                    <input type="text" className="form-control" id="categoryNameBe" placeholder={t('common.enter_category_name_be', 'Увядзіце назву па-беларуску')} value={this.state.editNameBe || ''} onChange={e => this.setState({ editNameBe: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="categoryNameDe" className="form-label">Название на немецком:</label>
                    <input type="text" className="form-control" id="categoryNameDe" placeholder={t('common.enter_category_name_de', 'Geben Sie den Kategorienamen auf Deutsch ein')} value={this.state.editNameDe || ''} onChange={e => this.setState({ editNameDe: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="categoryNameEs" className="form-label">Название на испанском:</label>
                    <input type="text" className="form-control" id="categoryNameEs" placeholder={t('common.enter_category_name_es', 'Ingrese el nombre de la categoría en español')} value={this.state.editNameEs || ''} onChange={e => this.setState({ editNameEs: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="categoryNamePt" className="form-label">Название на португальском:</label>
                    <input type="text" className="form-control" id="categoryNamePt" placeholder={t('common.enter_category_name_pt', 'Digite o nome da categoria em português')} value={this.state.editNamePt || ''} onChange={e => this.setState({ editNamePt: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="categoryNameUk" className="form-label">Название на украинском:</label>
                    <input type="text" className="form-control" id="categoryNameUk" placeholder={t('common.enter_category_name_uk', 'Введіть назву категорії українською')} value={this.state.editNameUk || ''} onChange={e => this.setState({ editNameUk: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="categoryNameZh" className="form-label">Название на китайском (упрощённом):</label>
                    <input type="text" className="form-control" id="categoryNameZh" placeholder={t('common.enter_category_name_zh', '输入类别名称（中文）')} value={this.state.editNameZh || ''} onChange={e => this.setState({ editNameZh: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button type="button" className="btn btn-secondary" onClick={this.closeEditModal}>
                    {t('common.cancel')}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={this.saveEdit}>
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
            zIndex: 1050
          }}>
            <div className="modal-dialog" style={{ 
              display: 'flex',
              alignItems: 'center',
              minHeight: '100vh'
            }}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Добавить подкатегорию</h5>
                  <button type="button" style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }} onClick={this.closeAddSubModal}>
                    ✕
                  </button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="subCategoryName" className="form-label">Название подкатегории (английское):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="subCategoryName"
                      value={this.state.newSubName}
                      onChange={this.handleNewSubNameChange}
                      placeholder="Enter subcategory name in English"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="subCategoryNameRu" className="form-label">Название на русском:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="subCategoryNameRu"
                      value={this.state.newSubNameRu}
                      onChange={this.handleNewSubNameRuChange}
                      placeholder="Введите название подкатегории на русском"
                    />
                  </div>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button type="button" className="btn btn-secondary" onClick={this.closeAddSubModal}>
                    Отмена
                  </button>
                  <button type="button" className="btn btn-success" onClick={this.saveAddSub}>
                    Добавить
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
            zIndex: 1050
          }}>
            <div className="modal-dialog" style={{ 
              display: 'flex',
              alignItems: 'center',
              minHeight: '100vh'
            }}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t('common.create_category')}</h5>
                  <button type="button" style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }} onClick={this.closeCreateModal}>
                    ✕
                  </button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="newCategoryName" className="form-label">{t('common.category_name')} ({t('common.english')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="newCategoryName"
                      value={this.state.newCategoryName}
                      onChange={this.handleNewCategoryNameChange}
                      placeholder={t('common.enter_category_name', 'Enter category name in English')}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="newCategoryNameRu" className="form-label">{t('common.category_name')} ({t('common.russian')}):</label>
                    <input
                      type="text"
                      className="form-control"
                      id="newCategoryNameRu"
                      value={this.state.newCategoryNameRu}
                      onChange={this.handleNewCategoryNameRuChange}
                      placeholder={t('common.enter_category_name_ru', 'Введите название категории на русском')}
                    />
                  </div>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={this.closeCreateModal}>
                    {t('common.cancel')}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={this.saveCreateCategory} style={{ marginTop: 0 }}>
                    {t('common.create')}
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

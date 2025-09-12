import React, { Component } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Navbar from "../components/NavBar";
import axios from "../utils/axios";
import { getAvatarUrl } from "../utils/minioUtils";

const ShowRole = (props) => (
  <option key={props.todo.name} value={props.todo.name}>
    {props.todo.name}
  </option>
);

export default class UserEdit extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      todos: [], 
      Roles: [],
      showAvatarModal: false,
      avatarSrc: null,
      crop: { x: 0, y: 0 },
      zoom: 1,
      croppedAreaPixels: null,
      avatarError: false
    };
  }

  componentDidMount() {
    axios
      .get("/auth/user?id=" + this.props.match.params.id)
      .then((response) => {
        this.setState({ todos: response.data });
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  RoleList() {
    const roleList = this.state.Roles.map(function (currentTodo, i) {
      return <ShowRole todo={currentTodo} key={i} />;
    });
    roleList.unshift(
      <option key="default" value="" disabled>
        Select role...
      </option>
    );
    return roleList;
  }

  onChange = (e) => {
    const state = this.state.todos;
    state[e.target.name] = e.target.value;
    this.setState({ todos: state });
  };

  toggleOpen = () => this.setState({ isOpen: !this.state.isOpen }); // для выпадающего списка

  delete() {
    axios
      .delete("/auth/user?id=" + this.props.match.params.id, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((result) => {
        this.props.history.push("/allusers/");
      });
  }

  handleChange(e) {
    var whoIsChecked = { ...this.state.whoIsChecked };
    whoIsChecked.allowDestroyAll = e.target.value;
    this.setState({ whoIsChecked }, () => {
      console.log(this.state);
    });
  }

  onAvatarClick() {
    this.setState({ showAvatarModal: true });
  }

  onAvatarClose() {
    this.setState({ showAvatarModal: false, avatarSrc: null, crop: { x: 0, y: 0 }, zoom: 1 });
  }

  onCropChange(crop) {
    this.setState({ crop });
  }

  onZoomChange(zoom) {
    this.setState({ zoom });
  }

  onCropComplete(_, croppedAreaPixels) {
    this.setState({ croppedAreaPixels });
  }

  onChooseImage(e) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Файл слишком большой. Максимальный размер: 5MB');
        return;
      }
      
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        toast.error('Пожалуйста, выберите изображение');
        return;
      }
      
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (typeof reader.result === 'string') {
          this.setState({ avatarSrc: reader.result, crop: { x: 0, y: 0 }, zoom: 1 });
        } else {
          this.setState({ avatarSrc: null });
        }
      });
      reader.readAsDataURL(file);
    } else {
      this.setState({ avatarSrc: null });
    }
  }

  async onSaveCropped() {
    if (!this.state.avatarSrc) {
      toast.error('Сначала выберите изображение');
      return;
    }

    try {
      // Создаем blob из base64 изображения
      const response = await fetch(this.state.avatarSrc);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');
      
      const token = localStorage.getItem('jwtToken');
      const res = await fetch(`/profile/avatar-user/${this.props.match.params.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      const data = await res.json();
      if (data.avatar && typeof data.avatar === 'string') {
        this.setState({ 
          todos: { ...this.state.todos, avatar: data.avatar }, 
          showAvatarModal: false, 
          avatarSrc: null 
        });
        toast.success('Аватарка успешно загружена!');
      } else {
        toast.error('Ошибка при загрузке аватарки');
      }
    } catch (error) {
      console.error('Ошибка при сохранении аватарки:', error);
      toast.error('Ошибка при сохранении аватарки');
    }
  }

  onSubmit = (e) => {
    e.preventDefault();

    const { name, email, password, role } = this.state.todos;
    console.log(this.state.todos);

    // Проверка, чтобы поле "name" не было пустым
    if (!name) {
      toast.error("User name cannot be empty");
      return;
    }

    if (!email) {
      toast.error("Email cannot be empty");
      return;
    }

    if (
      typeof this.state.todos.role !== "string" ||
      this.state.todos.role.trim() === ""
    ) {
      toast.error("Please select a role");
      return;
    }

    axios
      .put("/auth/user?id=" + this.props.match.params.id, {
        name,
        email,
        password,
        role,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((result) => {
        this.props.history.push("/allusers/");
      })
      .catch((error) => {
        if (error.response && error.response.status === 409) {
          toast.error("A user with this email already exists.");
        } else {
          toast.error("Failed to update user data.");
        }
      });
  };

  render() {
    // const menuClass = `dropdown-menu${this.state.isOpen ? " show" : ""}`;
    var message = "You selected " + this.state.todos.role;
    return (
      <div>
        <Navbar />
        <div class="container">
          <div class="panel panel-default">
            <div class="panel-heading">
              <br />
              <h2 class="panel-title">Edit User</h2>
            </div>
            <div class="panel-body">
              <br />
              <form onSubmit={this.onSubmit}>
                <Link to="/allusers" className="btn btn-light">
                  Go Back
                </Link>
                <div class="form-group">
                  <label for="First Name">Name:</label>
                  <input
                    type="text"
                    class="form-control"
                    name="name"
                    value={this.state.todos.name}
                    onChange={this.onChange}
                    placeholder="Name"
                  />
                </div>
                
                {/* Аватарка пользователя */}
                <div class="form-group">
                  <label>Avatar:</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      border: '2px solid #ddd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 32,
                      fontWeight: 700,
                      color: '#666',
                      background: (this.state.todos.avatar && !this.state.avatarError) ? `url(${getAvatarUrl(this.state.todos.avatar)})` : '#f8f9fa',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }} onClick={this.onAvatarClick.bind(this)}>
                      {this.state.todos.avatar && (
                        <img
                          src={getAvatarUrl(this.state.todos.avatar)}
                          alt=""
                          style={{ display: 'none' }}
                          onError={() => this.setState({ avatarError: true })}
                        />
                      )}
                      {(!this.state.todos.avatar || this.state.avatarError) && (this.state.todos.name?.[0] || '?')}
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-outline-primary"
                      onClick={this.onAvatarClick.bind(this)}
                    >
                      Change Avatar
                    </button>
                  </div>
                </div>
                <div class="form-group">
                  <label for="Email">Email:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="email"
                    value={this.state.todos.email}
                    onChange={this.onChange}
                    placeholder="Email"
                  />
                </div>
                <div>
                  <label>Role</label>
                  <select
                    className="form-control"
                    name="role"
                    id="ada"
                    onChange={this.onChange}
                    value={this.state.todos.role || ""}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="USER">USER</option>
                  </select>
                  <p>{message}</p>
                </div>
                <br />
                <ToastContainer />
                <button type="submit" class="btn btn-dark">
                  Update
                </button>
                <button
                  onClick={this.delete.bind(this, this.state.todos.id)}
                  class="btn btn-danger"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Модальное окно для загрузки аватарки */}
        {this.state.showAvatarModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h3 style={{ margin: 0 }}>Change User Avatar</h3>
                <button
                  onClick={this.onAvatarClose.bind(this)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  ×
                </button>
              </div>

              {!this.state.avatarSrc ? (
                // Экран выбора файла
                <div>
                  <div style={{
                    border: '2px dashed #ddd',
                    borderRadius: '12px',
                    padding: '40px',
                    textAlign: 'center',
                    background: '#f8f9fa',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '48px', color: '#666', marginBottom: '16px' }}>📷</div>
                    <p style={{ marginBottom: '16px', color: '#666' }}>
                      Перетащите изображение сюда или нажмите для выбора
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={this.onChooseImage.bind(this)}
                      style={{ display: 'none' }}
                      id="avatar-input"
                    />
                    <label 
                      htmlFor="avatar-input"
                      style={{
                        background: '#007bff',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-block',
                        fontWeight: '500'
                      }}
                    >
                      Выбрать изображение
                    </label>
                  </div>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Поддерживаемые форматы: JPG, PNG, GIF. Максимальный размер: 5MB
                  </p>
                </div>
              ) : (
                // Экран предпросмотра
                <div>
                  <div style={{ 
                    position: 'relative', 
                    height: '300px', 
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img
                      src={this.state.avatarSrc}
                      alt="Preview"
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%', 
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                  
                  {/* Предпросмотр */}
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h5 style={{ marginBottom: '12px' }}>Предпросмотр</h5>
                    <div style={{ 
                      display: 'inline-block',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid #ddd',
                      background: '#f8f9fa'
                    }}>
                      <img
                        src={this.state.avatarSrc}
                        alt="Preview"
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Кнопки */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={this.onAvatarClose.bind(this)}
                  style={{
                    padding: '12px 24px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Отмена
                </button>
                
                {this.state.avatarSrc && (
                  <>
                    <button
                      onClick={() => {
                        this.setState({ avatarSrc: null, crop: { x: 0, y: 0 }, zoom: 1 });
                        const input = document.getElementById('avatar-input');
                        if (input) {
                          input.value = '';
                        }
                      }}
                      style={{
                        padding: '12px 24px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Выбрать другое
                    </button>
                    
                    <button
                      onClick={this.onSaveCropped.bind(this)}
                      style={{
                        padding: '12px 24px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Сохранить аватарку
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

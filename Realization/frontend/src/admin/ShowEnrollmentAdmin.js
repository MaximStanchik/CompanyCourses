import React, { Component } from "react";
import axios from "../utils/axios";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { ToastContainer, toast } from "react-toastify";
import "./admin.css";
import { withTranslation } from 'react-i18next';
import CreateEnroll from './CreateEnrollmentAdmin';
import TeachNavMenu from './TeachNavMenu';

function getCurrentTheme() {
  if (typeof document !== 'undefined') {
    return document.body.getAttribute('data-theme') || localStorage.getItem('theme') || 'light';
  }
  return 'light';
}

class EnrollList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      enrollments: [],
      showCreateModal: false,
      search: '',
    };
    this.handleThemeChange = this.handleThemeChange.bind(this);
    this.refreshEnrollList = this.refreshEnrollList.bind(this);
  }

  updateSearch(event) {
    this.setState({ search: event.target.value.substr(0, 20) });
  }

  openCreateModal = () => {
    this.setState({ showCreateModal: true });
  }

  closeCreateModal = () => {
    this.setState({ showCreateModal: false });
  }

  async componentDidMount() {
    window.addEventListener('themeChanged', this.handleThemeChange);
    axios
      .get("/enrollments/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((response) => {
        console.log(response.data);
        this.setState({
          enrollments: response.data ? response.data : [],
        });
      })
      .catch((error) => {
        if (
          (error.response && error.response.status === 401) ||
          (error.response && error.response.status === 403)
        ) {
          window.location.href = "/login";
        } else {
          console.log(error);
        }
      });
  }

  componentWillUnmount() {
    window.removeEventListener('themeChanged', this.handleThemeChange);
  }

  handleThemeChange() {
    window.location.reload();
  }

  async delete(id) {
    const { t } = this.props;
    try {
      await axios
      .delete("/enrollment?id=" + id, {
          headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken")}` },
        });
      this.componentDidMount();
      toast.success(t('enrollment.unenroll_success'));
    } catch (error) {
      console.error(error);
      toast.error(t('enrollment.unenroll_error'));
    }
  }

  refreshEnrollList = (res) => {
    this.setState({
      enrollments: res.data.enrollments.map((todo) => {
        return {
          user: todo.User,
          course: todo.Course,
        };
      }),
    });
  };

  render() {
    const { t } = this.props;
    const theme = getCurrentTheme();
    const dark = theme === 'dark';
    const filteredUsers = this.state.enrollments.filter(
      (enroll) => (enroll.User?.email || '').toLowerCase().includes(this.state.search.toLowerCase())
        || (enroll.Course?.name || '').toLowerCase().includes(this.state.search.toLowerCase())
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--teach-bg)', color: 'var(--teach-fg)', transition: 'background 0.3s, color 0.3s' }}>
        <NavBar />
        <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
          <TeachNavMenu variant="teach" />
          <main style={{ flex: 1, padding: 32 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 }}>
              <h1 style={{ color:'var(--text-color)', fontWeight: 700, fontSize: 28, margin: 0 }}>{t('enrollment.title')}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="text"
                  placeholder={t('common.search') + '...'}
                  className="form-control"
                  style={{ height: '40px', borderRadius: 8, border: '1.5px solid var(--border-color)', background: 'var(--field-bg)', color: 'var(--text-color)', fontSize: 15, padding: '0 12px' }}
                  value={this.state.search}
                  onChange={this.updateSearch.bind(this)}
                />
                <button
                  onClick={this.openCreateModal}
                  className="btn anim-btn"
                  style={{ 
                    height: 40, 
                    minWidth: 'fit-content',
                    padding: '0 20px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: 8, 
                    background: 'var(--teach-btn-bg)', 
                    color: 'var(--teach-btn-fg)', 
                    border: '1.5px solid var(--border-color)', 
                    fontWeight: 600, 
                    fontSize: 16,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {t('enrollment.enroll_user')}
                </button>
              </div>
            </div>
            <div className="container" style={{ borderRadius: 16, boxShadow: '0 4px 24px rgba(68,133,237,0.10)', background: 'var(--teach-tile-bg, #fff)', padding: 0, marginBottom: 32, transition: 'background 0.3s' }}>
              <ToastContainer />
              <table
                className="table table-striped"
                id="usertable"
                style={{ marginTop: 20, borderRadius: 12, overflow: 'hidden', background: 'var(--teach-tile-bg, #fff)', color: 'var(--text-color)', transition: 'background 0.3s, color 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                ref={(el) => (this.el = el)}
                data-order='[[ 1, "asc" ]]'
                data-page-length="25"
              >
                <thead style={{ background: 'var(--teach-hover-bg)', color: 'var(--text-color)' }}>
                  <tr>
                    <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16 }}>{t('enrollment.student_email')}</th>
                    <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16 }}>{t('enrollment.course_name')}</th>
                    <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16 }}>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((todo, i) => (
                    <tr key={i} style={{ transition: 'background 0.18s', borderRadius: 8 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--teach-hover-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{todo.User?.email}</td>
                      <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{todo.Course?.name}</td>
                      <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>
                        <button
                          onClick={() => this.delete(todo.id)}
                          className="btn btn-danger anim-btn"
                          style={{ 
                            borderRadius: 8, 
                            fontWeight: 600, 
                            fontSize: 14, 
                            padding: '6px 12px', 
                            border: 'none', 
                            background: '#d9534f', 
                            color: '#fff', 
                            boxShadow: '0 2px 8px rgba(217,83,79,0.08)', 
                            transition: 'background 0.2s',
                            whiteSpace: 'nowrap',
                            minWidth: 'fit-content'
                          }}
                        >
                          {t('enrollment.unenroll_button')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>
        </div>
        <div style={{ marginTop: 'auto' }}><Footer /></div>
        {/* Модальное окно для создания записи */}
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
              <div className="modal-content" style={{ borderRadius: 16, boxShadow: '0 8px 32px rgba(68,133,237,0.18)', background: 'var(--teach-tile-bg, #fff)', color: 'var(--text-color)', transition: 'background 0.3s, color 0.3s' }}>
                <div className="modal-body">
                  <CreateEnroll onSuccess={this.closeCreateModal} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default withTranslation()(EnrollList);


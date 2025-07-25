import React, { Component } from "react";
import axios from "../utils/axios";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import i18n from "../i18n";

function getCurrentTheme() {
  if (typeof document !== 'undefined') {
    return document.body.getAttribute('data-theme') || localStorage.getItem('theme') || 'light';
  }
  return 'light';
}

export default class UserList extends Component {
  constructor(props) {
    super(props);
    this.state = { todos: [], search: "" };
    this.handleThemeChange = this.handleThemeChange.bind(this);
  }

  updateSearch(event) {
    this.setState({ search: event.target.value.substr(0, 20) });
  }

  async componentDidMount() {
    window.addEventListener('themeChanged', this.handleThemeChange);
    axios
      .get("/courses/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((response) => {
        this.setState({ todos: response.data });
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

  delete(id) {
    console.log(id);
    axios
      .delete("/course?id=" + id, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((result) => {
        toast.success("Deleted successfully");
        setTimeout(() => {
          window.location.reload(); // обновление страницы после задержки
        }, 1000);
      })
      .catch((err) => {
        toast.error("Course not deleted");
      });
  }

  render() {
    const theme = getCurrentTheme();
    const dark = theme === 'dark';
    const divStyle = {
      display: "contents",
    };
    const t = i18n.t.bind(i18n);
    const Todo = (props) => (
      <tr style={{ transition: 'background 0.18s', borderRadius: 8 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--teach-hover-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{props.todo.name}</td>
        <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{props.todo.description || t('course.no_description')}</td>
        <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>{props.todo.Category?.name || t('common.dash')}</td>
        <td style={{ border: 'none', padding: '12px 10px', borderRadius: 8 }}>
          <a href={"/ShowCourseList/edit/" + props.todo.id} className="btn btn-primary btn-info anim-btn" style={{ borderRadius: 8, fontWeight: 600, fontSize: 15, padding: '6px 18px', marginRight: 8, border: 'none', background: '#4485ed', color: '#fff', boxShadow: '0 2px 8px rgba(68,133,237,0.08)', transition: 'background 0.2s' }}>{t('course.edit')}</a>
          <button onClick={() => props.onDelete(props.todo.id)} className="btn btn-danger anim-btn" style={{ borderRadius: 8, fontWeight: 600, fontSize: 15, padding: '6px 18px', border: 'none', background: '#d9534f', color: '#fff', boxShadow: '0 2px 8px rgba(217,83,79,0.08)', transition: 'background 0.2s' }}>{t('course.delete')}</button>
        </td>
      </tr>
    );
    

    let filteredusers = this.state.todos.filter((course) => {
      return (
        course.name.indexOf(this.state.search) !== -1 ||
        course.description.indexOf(this.state.search) !== -1 ||
        (course.Category.name &&
          course.Category.name.indexOf(this.state.search) !== -1)
      );
    });
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--teach-bg)', color: 'var(--teach-fg)', transition: 'background 0.3s, color 0.3s' }}>
        <NavBar />
        <div
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: 'center',
          }}
        >
          <input type="hidden" />
          <h1
            style={{
              color: 'var(--text-color)',
              fontWeight: 700,
              fontSize: 32,
              margin: 0,
              fontFamily: "Nunito",
              transition: 'color 0.3s',
            }}
          >
            {t('course.list_title')}
          </h1>
          <input
            type="text"
            placeholder={t('course.search_placeholder')}
            className="form-control input-sm"
            style={{ width: "250px", borderRadius: 8, border: '1.5px solid var(--border-color)', background: 'var(--field-bg)', color: 'var(--text-color)', fontSize: 15, padding: '0 12px', transition: 'background 0.2s, color 0.2s' }}
            value={this.state.search}
            onChange={this.updateSearch.bind(this)}
          />
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
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16 }}>{t('course.course_name')}</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16 }}>{t('course.course_description')}</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16 }}>{t('course.category')}</th>
                <th style={{ border: 'none', padding: '14px 12px', fontWeight: 700, fontSize: 16 }}>{t('course.action')}</th>
              </tr>
            </thead>
            <tbody>
  {filteredusers.map((currentTodo) => (
    <Todo todo={currentTodo} key={currentTodo.id} onDelete={this.delete.bind(this)} />
  ))}
</tbody>

          </table>
        </div>
        <div style={{ marginTop: 'auto' }}><Footer /></div>
      </div>
    );
  }
}

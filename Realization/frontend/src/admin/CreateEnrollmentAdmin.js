import React, { Component } from "react";
import axios from "../utils/axios";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTimes, faCog } from '@fortawesome/free-solid-svg-icons';
import { withTranslation } from 'react-i18next';
import './CreateEnrollmentAdmin.css';

const ShowUser = (props) => (
  <option key={props.todo.email} value={props.todo.email}>
    {props.todo.email}
  </option>
);

const ShowCourse = (props) => (
  <option key={props.todo.name} value={props.todo.name}>
    {props.todo.name}
  </option>
);

class CreateEnroll extends Component {
  constructor(props) {
    super(props);
    this.state = {
      User: [],
      Course: [],
      user: "",
      course: "",
      selectedUserId: null,
      selectedCourseId: null,
      isVisible: false,
      userEnrollments: [], // Добавляем состояние для записей пользователя
    };

    this.onChangeCourse = this.onChangeCourse.bind(this);
    this.onChangeStudent = this.onChangeStudent.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.handleEditStudent = this.handleEditStudent.bind(this);
    this.handleEditCourse = this.handleEditCourse.bind(this);
  }

  componentDidMount() {
    // Анимация появления
    setTimeout(() => {
      this.setState({ isVisible: true });
    }, 100);

    axios
      .get("/courses/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((response) => {
        // Фильтруем только опубликованные курсы (статус 'published')
        const publishedCourses = response.data.filter(course => 
          course.status === 'published'
        );
        console.log('Все курсы:', response.data.length);
        console.log('Опубликованные курсы:', publishedCourses.length);
        console.log('Статусы курсов:', response.data.map(c => ({ id: c.id, name: c.name, status: c.status })));
        this.setState({ Course: publishedCourses });
      })
      .catch((error) => {
        console.log(error);
      });

    axios
      .get("/auth/users/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((response) => {
        this.setState({ User: response.data });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  componentWillUnmount() {
    // Анимация исчезновения
    this.setState({ isVisible: false });
  }

  CourseList() {
    const { t } = this.props;
    const { userEnrollments, Course } = this.state;
    
    // Фильтруем курсы, исключая те, на которые пользователь уже записан
    const availableCourses = Course.filter(course => 
      !userEnrollments.includes(course.id)
    );

    const courseList = availableCourses.map((currentTodo, i) => {
      return <ShowCourse todo={currentTodo} key={i} />;
    });

    courseList.unshift(
      <option key="default" value="" disabled>
        {userEnrollments.length > 0 ? t('enrollment.available_courses') : t('enrollment.select_course')}
      </option>
    );

    return courseList;
  }

  UserList() {
    const { t } = this.props;
    const userList = this.state.User.map((currentTodo, i) => {
      return <ShowUser todo={currentTodo} key={i} />;
    });

    userList.unshift(
      <option key="default" value="" disabled>
        {t('enrollment.select_user')}
      </option>
    );

    return userList;
  }

  onChangeCourse(e) {
    const selectedCourse = this.state.Course.find(course => course.name === e.target.value);
    this.setState({ 
      course: e.target.value,
      selectedCourseId: selectedCourse ? selectedCourse.id : null
    });
  }

  onChangeStudent(e) {
    const selectedUser = this.state.User.find(user => user.email === e.target.value);
    this.setState({ 
      user: e.target.value,
      selectedUserId: selectedUser ? selectedUser.id : null
    });

    if (selectedUser && selectedUser.id) {
      this.loadUserEnrollments(selectedUser.id);
    } else {
      this.setState({ userEnrollments: [] });
    }
  }

  loadUserEnrollments = async (userId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(`/enrollmentbystudent?id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const enrollments = response.data || [];
      const enrolledCourseIds = enrollments
        .filter(enrollment => enrollment.approved === true) 
        .map(enrollment => enrollment.course_id)
        .filter(id => id !== null && id !== undefined);

      this.setState({ userEnrollments: enrolledCourseIds });
    } catch (error) {
      console.error('Error loading user enrollments:', error);
      this.setState({ userEnrollments: [] });
    }
  };

  handleEditStudent() {
    const { t } = this.props;
    if (this.state.selectedUserId) {
      this.setState({ isVisible: false }, () => {
        setTimeout(() => {
          const selectedUser = this.state.User.find(user => user.id === this.state.selectedUserId);
          const searchQuery = selectedUser ? selectedUser.email : '';
          window.location.href = `/users?search=${encodeURIComponent(searchQuery)}&editUserId=${this.state.selectedUserId}&openEditModal=true`;
        }, 300);
      });
    } else {
      toast.error(t('enrollment.select_user_first'));
    }
  }

  handleEditCourse() {
    const { t } = this.props;
    if (this.state.selectedCourseId) {
      this.setState({ isVisible: false }, () => {
        setTimeout(() => {
          window.location.href = `/editcourse/${this.state.selectedCourseId}`;
        }, 300);
      });
    } else {
      toast.error(t('enrollment.select_course_first'));
    }
  }

  onSubmit(e) {
    e.preventDefault();
    const { t } = this.props;

    if (typeof this.state.user !== "string" || this.state.user.trim() === "") {
      toast.error(t('enrollment.select_user_error'));
      return;
    }

    if (
      typeof this.state.course !== "string" ||
      this.state.course.trim() === ""
    ) {
      toast.error(t('enrollment.select_course_error'));
      return;
    }

    const newTodo = {
      student: this.state.user,
      course: this.state.course,
    };

    this.setState({ isVisible: false }, () => {
      setTimeout(() => {
        axios
          .post("/enroll/add", newTodo, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
            },
          })
          .then(() => {
            window.location.href = "/EnrollmentList/";
          })
          .catch((error) => {
            if (error.response) {
              toast.error(error.response.data);
            } else {
              console.log(error);
            }
            this.setState({ isVisible: true });
          });
      }, 300);
    });

    this.setState({
      user: "",
      course: "",
      selectedUserId: null,
      selectedCourseId: null,
      userEnrollments: [],
    });
  }

  render() {
    const { t } = this.props;
    const { user, course, isVisible } = this.state;

    return (
      <div className={`enrollment-modal ${isVisible ? 'visible' : ''}`}>
        <div className="enrollment-overlay" onClick={() => {
          this.setState({ isVisible: false }, () => {
            setTimeout(() => {
              window.location.href = "/EnrollmentList/";
            }, 300);
          });
        }}></div>
        <div className="enrollment-content">
          {/* Крестик для закрытия */}
          <button
            className="enrollment-close-btn"
            onClick={() => {
              this.setState({ isVisible: false }, () => {
                setTimeout(() => {
                  window.location.href = "/EnrollmentList/";
                }, 300);
              });
            }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
          
          <div className="container">
            <div className="row">
              <div className="col-md-6 mt-5 mx-auto">
                <form onSubmit={this.onSubmit}>
                  <div>
                    <label>{t('courses.user_label')}:</label>
                    <br />
                    <select
                      className="enrollment-select"
                      name="student"
                      id="user-select"
                      onChange={this.onChangeStudent}
                      value={user}
                      size="5"
                    >
                      {this.UserList()}
                    </select>
                  </div>
                  <p>{t('enrollment.you_selected')} {user}</p>
                  
                  {/* Кнопка изменения данных студента */}
                  {this.state.selectedUserId && (
                    <div style={{ marginBottom: '15px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary edit-student-btn"
                        onClick={this.handleEditStudent}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                        {t('enrollment.edit_student')}
                      </button>
                    </div>
                  )}
                  
                  <div>
                    <label>
                      {t('enrollment.course_select_info')}
                      {this.state.userEnrollments.length > 0 && t('enrollment.course_select_exclude')}
                      ):
                    </label>
                    <br />
                    <select
                      className="enrollment-select"
                      name="course"
                      id="course-select"
                      onChange={this.onChangeCourse}
                      value={course}
                      size="5"
                    >
                      {this.CourseList()}
                    </select>
                  </div>
                  <p>{t('enrollment.you_selected')} {course}</p>
                  
                  {/* Информационное сообщение, если пользователь уже записан на все курсы */}
                  {this.state.userEnrollments.length > 0 && this.state.Course.length > 0 && 
                   this.state.Course.filter(course => !this.state.userEnrollments.includes(course.id)).length === 0 && (
                    <div style={{ 
                      marginBottom: '15px',
                      padding: '10px',
                      background: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '5px',
                      color: '#856404'
                    }}>
                      <strong>{t('common.information')}:</strong> {t('enrollment.user_already_enrolled')}
                    </div>
                  )}
                  
                  {/* Кнопка изменения данных курса */}
                  {this.state.selectedCourseId && (
                    <div style={{ marginBottom: '15px' }}>
                      <button
                        type="button"
                        className="btn btn-warning"
                        onClick={this.handleEditCourse}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          fontSize: '14px'
                        }}
                      >
                        <FontAwesomeIcon icon={faCog} />
                        {t('enrollment.edit_course')}
                      </button>
                    </div>
                  )}
                  
                  <br />
                  <div className="form-group">
                    <ToastContainer />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-lg btn-info submit-btn"
                  >
                    {t('enrollment.enroll_user')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTranslation()(CreateEnroll);

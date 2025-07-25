import React, { Component } from "react";
import NavBar from "../components/NavBar";
import axios from "../utils/axios";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

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

export default class CreateEnroll extends Component {
  constructor(props) {
    super(props);
    this.state = {
      User: [],
      Course: [],
      user: "",
      course: "",
    };

    this.onChangeCourse = this.onChangeCourse.bind(this);
    this.onChangeStudent = this.onChangeStudent.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    axios
      .get("/courses/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((response) => {
        this.setState({ Course: response.data });
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

  CourseList() {
    const courseList = this.state.Course.map((currentTodo, i) => {
      return <ShowCourse todo={currentTodo} key={i} />;
    });

    courseList.unshift(
      <option key="default" value="" disabled>
        Select course...
      </option>
    );

    return courseList;
  }

  UserList() {
    const userList = this.state.User.map((currentTodo, i) => {
      return <ShowUser todo={currentTodo} key={i} />;
    });

    userList.unshift(
      <option key="default" value="" disabled>
        Select user...
      </option>
    );

    return userList;
  }

  onChangeCourse(e) {
    this.setState({ course: e.target.value });
  }

  onChangeStudent(e) {
    this.setState({ user: e.target.value });
  }

  onSubmit(e) {
    e.preventDefault();

    if (typeof this.state.user !== "string" || this.state.user.trim() === "") {
      toast.error("Please select a user");
      return;
    }

    if (
      typeof this.state.course !== "string" ||
      this.state.course.trim() === ""
    ) {
      toast.error("Please select a course");
      return;
    }

    const newTodo = {
      student: this.state.user,
      course: this.state.course,
    };

    axios
      .post("/enroll/add", newTodo, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then(() => {
        this.props.history.push("/EnrollmentList/");
      })
      .catch((error) => {
        if (error.response) {
          toast.error(error.response.data);
        } else {
          console.log(error);
        }
      });

    this.setState({
      user: "",
      course: "",
    });
  }

  render() {
    const { user, course } = this.state;

    return (
      <div>
        <NavBar />
        <div className="container">
          <div className="row">
            <div className="col-md-6 mt-5 mx-auto">
              <form onSubmit={this.onSubmit}>
                <Link to="/EnrollmentList/" className="btn btn-light">
                  Go Back
                </Link>
                <br />
                <br />
                <h1
                  className="h3 mb-3 font-weight-bold"
                  style={{ textDecoration: "underline" }}
                >
                  Create New Enrollment
                </h1>
                <br />
                <div>
                  <label>User:</label>
                  <br />
                  <select
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #95c4e2",
                      borderRadius: "5px",
                    }}
                    name="student"
                    id="user-select"
                    onChange={this.onChangeStudent}
                    value={user}
                  >
                    {this.UserList()}
                  </select>
                </div>
                <p>You selected {user}</p>
                <div>
                  <label>Course:</label>
                  <br />
                  <select
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid lightgray",
                      borderRadius: "5px",
                    }}
                    name="course"
                    id="course-select"
                    onChange={this.onChangeCourse}
                    value={course}
                  >
                    {this.CourseList()}
                  </select>
                </div>
                <p>You selected {course}</p>
                <br />
                <div className="form-group">
                  <ToastContainer />
                </div>
                <button
                  type="submit"
                  className="btn btn-lg btn-info btn-block"
                >
                  Add Enrollment
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

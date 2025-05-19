import React, { Component } from "react";
import axios from "../utils/axios";
import NavBar from "../components/NavBar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default class UserList extends Component {
  constructor(props) {
    super(props);
    this.state = { todos: [], search: "" };
  }

  updateSearch(event) {
    this.setState({ search: event.target.value.substr(0, 20) });
  }

  async componentDidMount() {
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
    const divStyle = {
      display: "contents",
    };
    const Todo = (props) => (
      <tr>
        <td>{props.todo.name}</td>
        <td>{props.todo.description}</td>
        <td>{props.todo.Category?.name || "Без категории"}</td>
        <td>
          <a href={"/ShowCourseList/edit/" + props.todo.id} className="btn btn-primary btn-info">Edit</a>
          <button onClick={() => props.onDelete(props.todo.id)} className="btn btn-danger">Delete</button>
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
      <div style={{ overflow: "auto", height: "100vh" }}>
        <NavBar />
        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <input type="hidden" />
          <h1
            style={{
              marginLeft: "600px",
              color: "#a5c41a",
              fontFamily: "Nunito",
            }}
          >
            Course List
          </h1>
          <input
            type="text"
            placeholder="Search..."
            className="form-control input-sm"
            style={{ width: "250px" }}
            value={this.state.search}
            onChange={this.updateSearch.bind(this)}
          />
        </div>

        <div className="container" style={{ border: "10px solid lightgray" }}>
          <table
            className="table table-striped"
            id="usertable"
            style={{ marginTop: 20 }}
            ref={(el) => (this.el = el)}
            data-order='[[ 1, "asc" ]]'
            data-page-length="25"
          >
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Course Description</th>
                <th>Category</th>

                <th>Action</th>
              </tr>
            </thead>
            <tbody>
  {filteredusers.map((currentTodo) => (
    <Todo todo={currentTodo} key={currentTodo.id} onDelete={this.delete.bind(this)} />
  ))}
</tbody>

          </table>
        </div>
      </div>
    );
  }
}

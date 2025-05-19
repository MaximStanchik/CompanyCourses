import React, { Component } from "react";
import axios from "../utils/axios";
import NavBar from "../components/NavBar";
import { ToastContainer, toast } from "react-toastify";

const ShowCat = (props) => (
  <option key={props.todo.category} value={props.todo.category}>
    {props.todo.category}
  </option>
);
export default class EditCourse extends Component {
  constructor(props) {
    super(props);
    this.state = { todos: [], Cat: [] };
  }
  componentDidMount() {
    axios
      .get("/course?id=" + this.props.match.params.id)
      .then((response) => {
        this.setState({ todos: response.data });
      })
      .catch(function (error) {
        console.log(error);
      });

    axios
      .get("/categories/")
      .then((response) => {
        this.setState({ Cat: response.data });
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  CatList() {
    return this.state.Cat.map(function (currentTodo, i) {
      //  console.log(currentTodo.categoryName)
      return <ShowCat todo={currentTodo} key={i} />;
    });
  }

  onChange = (e) => {
    const state = this.state.todos;
    state[e.target.name] = e.target.value;
    this.setState({ todos: state });
  };

  handleChange(e) {
    var whoIsChecked = { ...this.state.whoIsChecked };
    whoIsChecked.allowDestroyAll = e.target.value;
    this.setState({ whoIsChecked }, () => {
      console.log(this.state);
    });
  }

  onSubmit = (e) => {
    e.preventDefault();

    const { name, description, category } = this.state.todos;

    // Проверка, чтобы поле "name" не было пустым
    if (!name) {
      toast.error("Course title cannot be empty");
      return;
    }

    console.log(this.state.todos);
    axios
      .put("/course?id=" + this.state.todos.id, {
        name,
        description,
        category,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((result) => {
        this.props.history.push("/ShowCourseList/");
      })
      .catch((error) => {
        if (error.response && error.response.status === 409) {
          toast.error("Course with this name already exists.");
        } else {
          toast.error("Failed to update course.");
        }
      });
  };
  render() {
    return (
      <div>
        <NavBar />
        <div class="container">
          <div class="panel panel-default">
            <div class="panel-heading">
              <br></br>
              <h2 class="panel-title">Edit Course</h2>
            </div>
            <div class="panel-body">
              <a
                href={"/ShowCourseList/"}
                class="btn btn-primary btn active"
                role="button"
                aria-pressed="true"
              >
                Back
              </a>
              <form onSubmit={this.onSubmit}>
                <div class="form-group">
                  <label for="name">Course Title:</label>
                  <input
                    type="text"
                    class="form-control"
                    name="name"
                    value={this.state.todos.name}
                    onChange={this.onChange}
                    placeholder="Course Title"
                  />
                </div>
                <div class="form-group">
                  <label for="description">Course Description:</label>
                  <textarea
                    type="text"
                    class="form-control"
                    name="description"
                    value={this.state.todos.description}
                    onChange={this.onChange}
                    placeholder="Description"
                  />
                </div>
                <br />
                <div class="form-group">
                  <ToastContainer />
                </div>
                <button type="submit" class="btn btn-dark">
                  Update
                </button>{" "}
                &nbsp;
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

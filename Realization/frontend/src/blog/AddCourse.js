import React, { Component } from "react";
import { ToastContainer, toast } from "react-toastify";
import NavBar from "../components/NavBar";
import axios from "../utils/axios";

const ShowCat = (props) => (
  <option key={props.todo.name} value={props.todo.name}>
    {props.todo.name}
  </option>
);

export default class AddCourse extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      description: "",
      category: "", // теперь это строка
      todos: [],
    };
    this.onChangeCourseName = this.onChangeCourseName.bind(this);
    this.onChangeDescription = this.onChangeDescription.bind(this);
    this.onChangeCategory = this.onChangeCategory.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    axios
      .get("/categories/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((response) => {
        this.setState({ todos: response.data });
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  CatList() {
    const categoryList = this.state.todos.map((currentTodo, i) => (
      <ShowCat todo={currentTodo} key={i} />
    ));
    categoryList.unshift(
      <option key="default" value="" disabled>
        Select category...
      </option>
    );
    return categoryList;
  }

  onChangeCourseName(e) {
    this.setState({ name: e.target.value });
  }

  onChangeDescription(e) {
    this.setState({ description: e.target.value });
  }

  onChangeCategory(e) {
    this.setState({ category: e.target.value });
  }

  onSubmit(e) {
    e.preventDefault();

    if (this.state.name.trim() === "") {
      toast.error("Course name cannot be empty");
      return;
    }

    if (typeof this.state.category !== "string" || this.state.category.trim() === "") {
      toast.error("Please select a category");
      return;
    }

    const newTodo = {
      name: this.state.name,
      description: this.state.description,
      category: this.state.category,
    };

    axios
      .post("/course/add", newTodo, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((result) => {
        this.props.history.push("/add-lecture/" + this.props.match.params.id);
      })
      .catch((error) => {
        if (error.response && error.response.status === 409) {
          toast.error("Course with this name already exists.");
        } else if (
          error.response &&
          (error.response.status === 401 || error.response.status === 403)
        ) {
          window.location.href = "/login";
        } else {
          toast.error("Failed to create course.");
        }
      });
  }

  render() {
    const message = "You selected " + this.state.category;
    return (
      <div>
        <NavBar />
        <div className="container">
          <div className="row">
            <div className="col-md-6 mt-5 mx-auto">
              <form onSubmit={this.onSubmit}>
                <h1 className="h3 mb-3 font-weight-normal"></h1>

                <div className="form-group">
                  <label>Course Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="coursename"
                    placeholder="Enter Course name"
                    value={this.state.name}
                    onChange={this.onChangeCourseName}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    placeholder="Enter Description"
                    value={this.state.description}
                    onChange={this.onChangeDescription}
                  />
                </div>

                <div className="form-group">
                  <label>Course Category</label>
                  <select
                    className="form-control"
                    name="category"
                    value={this.state.category}
                    onChange={this.onChangeCategory}
                  >
                    {this.CatList()}
                  </select>
                </div>

                <p>{message}</p>
                <ToastContainer />
                <button
                  type="submit"
                  className="btn btn-lg btn-primary btn-block"
                >
                  Add Course
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

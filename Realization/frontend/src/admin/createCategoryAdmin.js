import React, { Component } from "react";
import NavBar from "../components/NavBar";
import { ToastContainer, toast } from "react-toastify";
import { Link } from "react-router-dom";
import axios from "../utils/axios";

export default class CreateCategory extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
    };

    this.onChangeCategoryName = this.onChangeCategoryName.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onChangeCategoryName(e) {
    this.setState({
      no: 1,
      name: e.target.value,
    });
  }

  onSubmit(e) {
    e.preventDefault(); //ensure that the default HTML form submit behaviour is prevented

    // Check if name field is empty
    if (!this.state.name) {
      toast.error("Category name cannot be empty.");
      return;
    }

    const newTodo = {
      no: this.state.no,
      name: this.state.name,
      todo_completed: this.state.todo_completed,
    };

    axios
      .post("/category/add", newTodo, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((result) => {
        this.props.history.push("/ShowCategoryList/");
      })
      .catch((error) => {
        if (error.response && error.response.status === 409) {
          toast.error("Category already exists.");
        }
        if (
          (error.response && error.response.status === 401) ||
          (error.response && error.response.status === 403)
        ) {
          window.location.href = "/login";
        } else {
          toast.error("Failed to create category.");
        }
      });

    // Reset the Values.
    this.setState({
      name: "",
      todo_completed: false,
    });
  }
  render() {
    return (
      <div>
        <NavBar />
        <div className="container">
          <div className="row">
            <div className="col-md-6 mt-5 mx-auto">
              <form onSubmit={this.onSubmit}>
                <Link to="/ShowCategoryList" className="btn btn-light">
                  Go Back
                </Link>
                <br />
                <br />
                <h1 className="h3 mb-3 font-weight-bold">Create Category</h1>
                <div className="form-group">
                  <label>New Category</label>
                  <input
                    type="text"
                    className="form-control"
                    name="coursename"
                    placeholder="Enter Category name"
                    value={this.state.name}
                    onChange={this.onChangeCategoryName}
                  />
                </div>

                <br />
                <div class="form-group">
                  <ToastContainer />
                </div>
                <button
                  type="submit"
                  value="Add Category"
                  className="btn btn-lg btn-info btn-block"
                >
                  Add Category
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

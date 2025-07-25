import React, { Component } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import NavBar from "../components/NavBar";
import axios from "../utils/axios";

export default class CatEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      todos: {
        no: "",     // <-- Инициализация по умолчанию
        name: "",   // <-- Инициализация по умолчанию
      },
      isOpen: false,
    };
  }

  componentDidMount() {
    axios
      .get("/category?id=" + this.props.match.params.id, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((response) => {
        this.setState({ todos: response.data || { no: "", name: "" } });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  onChange = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      todos: {
        ...prevState.todos,
        [name]: value,
      },
    }));
  };

  toggleOpen = () => {
    this.setState((prevState) => ({ isOpen: !prevState.isOpen }));
  };

  onSubmit = (e) => {
    e.preventDefault();
    const { no, name } = this.state.todos;

    if (!name) {
      toast.error("Category name cannot be empty");
      return;
    }

    axios
      .put(
        "/category?id=" + this.props.match.params.id,
        { no, name },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          },
        }
      )
      .then(() => {
        this.props.history.push("/ShowCategoryList/");
      })
      .catch((error) => {
        if (error.response && error.response.status === 409) {
          toast.error("Category already exists.");
        } else {
          toast.error("Failed to update category.");
        }
      });
  };

  render() {
    const { name } = this.state.todos;

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
                <h1 className="h3 mb-3 font-weight-bold">EDIT Category</h1>
                <br />
                <div>
                  <label>Category Name: </label>
                  <br />
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={name || ""}
                    onChange={this.onChange}
                    placeholder="Category name"
                  />
                </div>
                <br />
                <ToastContainer />
                <button type="submit" className="btn btn-lg btn-info btn-block">
                  Update
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

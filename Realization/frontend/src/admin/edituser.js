import React, { Component } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Navbar from "../components/NavBar";
import axios from "../utils/axios";

const ShowRole = (props) => (
  <option key={props.todo.name} value={props.todo.name}>
    {props.todo.name}
  </option>
);

export default class UserEdit extends Component {
  constructor(props) {
    super(props);
    this.state = { todos: [], Roles: [] };
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
      </div>
    );
  }
}

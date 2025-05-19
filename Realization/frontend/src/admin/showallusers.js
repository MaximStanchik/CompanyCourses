import React, { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import axios from "../utils/axios";
import "./admin.css";

const divStyle = {
  display: "contents",
};

const Todo = (props) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      axios
        .get("/auth/currentUser", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          setCurrentUser(response.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  }, []);

  const isOwner = currentUser && currentUser.id === props.todo.id;

  return (
    <div style={divStyle}>
      <tr>
        <td>{props.todo.name}</td>
        <td>{props.todo.email}</td>
        <td>{props.todo.role}</td>
        <td>
          {!isOwner && (
            <a
              href={"/allusers/edit/" + props.todo.id}
              className="btn btn-primary btn-info"
              role="button"
              aria-pressed="true"
            >
              Edit
            </a>
          )}
        </td>
      </tr>
    </div>
  );
};

const UserList = () => {
  const [todos, setTodos] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      axios
        .get("/auth/users/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          setTodos(response.data);
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
  }, []);

  const updateSearch = (event) => {
    setSearch(event.target.value.substr(0, 20));
  };

  let filteredUsers = todos.filter((user) => {
    return (
      user.name.indexOf(search) !== -1 || user.email.indexOf(search) !== -1
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
          }}
        >
          Manage Users
        </h1>
        <input
          type="text"
          placeholder="Search..."
          className="form-control input-sm"
          style={{ width: "250px" }}
          value={search}
          onChange={updateSearch}
        />
      </div>
      <div className="container" style={{ border: "10px solid lightgray" }}>
        <table
          className="table table-striped"
          data-order='[[ 1, "asc" ]]'
          data-page-length="25"
        >
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((currentTodo, i) => (
              <Todo todo={currentTodo} key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;

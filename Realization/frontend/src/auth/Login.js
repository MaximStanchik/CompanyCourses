import React, { Component, useState } from "react";
import "./style.css";
import classnames from "classnames";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { loginUser } from "../actions/authActions";
import NavBar from "../components/NavBar";
import { withRouter } from 'react-router-dom';

class Login extends Component {
  constructor() {
    super();
    this.state = {
      email: "",
      password: "",
      errors: {},
      role: "",
      checkbox1: false, // Добавляем состояние для чекбокса
    };
    this.onChange = this.onChange.bind(this); // подключаем метод onChange, который будет обрабатывать изменения в полях формы
    this.onSubmit = this.onSubmit.bind(this); // подключаем метод onSubmit, который будет обрабатывать отправку формы
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value }); // устанавливаем значение поля формы в state
  }

  onSubmit(e) {
    e.preventDefault();

    const newUser = {
      email: this.state.email,
      password: this.state.password,
    };
    this.props.loginUser(newUser);
  }

  componentDidUpdate(prevProps) {
    console.log("componentDidUpdate", this.props.auth.isAuthenticated);
    if (
      this.props.auth.isAuthenticated &&
      this.props.auth.isAuthenticated !== prevProps.auth.isAuthenticated
    ) {
      const role =
        this.props.auth.users.role || this.props.auth.users.roles?.[0];
      console.log("Redirecting to:", role);

      if (role === "ADMIN") {
        this.props.history.push("/services");
      } else if (role === "USER") {
        this.props.history.push("/my-training");
      }
    }

    if (this.props.errors !== prevProps.errors) {
      this.setState({ errors: this.props.errors });
    }
  }




  render() {
    const { errors } = this.state;

    return (
      <div>
        <NavBar />
        <div className="auth-wrapper">
          <div className="auth-content container">
            <div className="card">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <div className="card-body">
                    <div className="logoHead">
                      <h3>itProger</h3>
                    </div>
                    <h4 className="mb-3 f-w-400">Login into your account</h4>
                    <form noValidate onSubmit={this.onSubmit}>
                      <div className="input-group mb-2">
                        <div className="input-group-prepend">
                          <span className="input-group-text">✉</span>
                        </div>
                        <input
                          name="email"
                          type="email"
                          className={classnames("form-control", {
                            "is-invalid": errors.email,
                          })}
                          placeholder="Email address"
                          value={this.state.email}
                          onChange={this.onChange}
                          error={errors.email}
                        />
                        {errors.email && (
                          <div className="invalid-feedback">{errors.email}</div>
                        )}
                      </div>
                      <div className="input-group mb-3">
                        <div className="input-group-prepend">
                          <span className="input-group-text">✔</span>
                        </div>
                        <input
                          name="password"
                          type="password"
                          className={classnames("form-control", {
                            "is-invalid": errors.password,
                          })}
                          placeholder="Password"
                          value={this.state.password}
                          onChange={this.onChange}
                        />
                        {errors.password && (
                          <div className="invalid-feedback">
                            {errors.password}
                          </div>
                        )}
                      </div>
                      <div className="form-group text-left mt-2">
                        <div className="checkbox">
                          <input
                            type="checkbox"
                            name="checkbox-fill-1"
                            id="checkbox-fill-1"
                            checked={this.state.checkbox1} // Убедитесь, что состояние определено
                            onChange={(e) => this.setState({ checkbox1: e.target.checked })} // Обработчик onChange
                          />
                          <label htmlFor="checkbox-fill-1">Remember me</label>
                        </div>
                      </div>
                      <button className="btn btn-primary shadow-4 mb-4">
                        Login
                      </button>
                    </form>
                    <p className="mb-0 text-muted">
                      Don’t have an account?{" "}
                      <a
                        href={`${process.env.PUBLIC_URL}/register/`}
                        className="f-w-400"
                      >
                        Signup
                      </a>
                    </p>
                  </div>
                </div>
                <div className="col-md-6 d-none d-md-block">
                  <img
                    src="../assets/img/slider/login1.png"
                    alt=""
                    className="img-fluid"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// указываем свойства, которые должны быть переданы компоненту
Login.propTypes = {
  loginUser: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  // получаем свойства из хранилища
  auth: state.auth,
  errors: state.errors,
});

export default withRouter(
  connect(
    mapStateToProps,
    { loginUser }
  )(Login)
);


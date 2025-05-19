import React, { Component } from "react";
import "./style.css";
import axios from "../utils/axios";
import classnames from "classnames";
import NavBar from "../components/NavBar";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { registerUser } from "../actions/authActions";

class Register extends Component {
  constructor() {
    super();
    this.state = {
      name: "",
      email: "",
      password: "",
      password2: "",
      errors: {},
      passwordStrength: 0,
    };
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  getPasswordStrength(password) {
    let score = 0;
    if (!password) return score;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
    return score;
  }

  onChange(e) {
    const { name, value } = e.target;
    if (name === "password") {
      this.setState({
        [name]: value,
        passwordStrength: this.getPasswordStrength(value),
      });
    } else {
      this.setState({ [name]: value });
    }
  }

  onSubmit(e) {
    e.preventDefault();
    const newUser = {
      name: this.state.name,
      email: this.state.email,
      password: this.state.password,
      password2: this.state.password2,
      role: this.props.match.params.role,
    };

    axios
      .post("/auth/registration", newUser)
      .then((res) => {
        this.props.history.push("/login/");
      })
      .catch((err) => {
        if (err.response && err.response.data) {
          this.setState({ errors: err.response.data });
        }
      });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.errors) {
      this.setState({ errors: nextProps.errors });
    }
  }

  render() {
    const { errors, passwordStrength } = this.state;

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
                    <h4 className="mb-3 f-w-400">Sign up into your account</h4>
                    <form onSubmit={this.onSubmit}>
                      <div className="input-group mb-2">
                        <div className="input-group-prepend">
                          <span className="input-group-text">☺</span>
                        </div>
                        <input
                          type="text"
                          name="name"
                          className={classnames("form-control", {
                            "is-invalid": errors.name,
                          })}
                          placeholder="Name"
                          error={errors.name}
                          value={this.state.name}
                          onChange={this.onChange}
                        />
                        {errors.name && (
                          <div className="invalid-feedback">{errors.name}</div>
                        )}
                      </div>

                      <div className="input-group mb-2">
                        <div className="input-group-prepend">
                          <span className="input-group-text">✉</span>
                        </div>
                        <input
                          type="email"
                          name="email"
                          className={classnames("form-control", {
                            "is-invalid": errors.email,
                          })}
                          placeholder="Email address"
                          value={this.state.email}
                          error={errors.email}
                          onChange={this.onChange}
                        />
                        {errors.email && (
                          <div className="invalid-feedback">{errors.email}</div>
                        )}
                      </div>

                      <div className="input-group mb-2">
                        <div className="input-group-prepend">
                          <span className="input-group-text">✔</span>
                        </div>
                        <input
                          type="password"
                          name="password"
                          className={classnames("form-control", {
                            "is-invalid": errors.password,
                          })}
                          placeholder="Password"
                          error={errors.password}
                          value={this.state.password}
                          onChange={this.onChange}
                        />
                        {errors.password && (
                          <div className="invalid-feedback">
                            {errors.password}
                          </div>
                        )}
                      </div>

                      {this.state.password && (
                        <div className="mb-2">
                          <div
                            className={classnames("password-strength-bar", {
                              weak: passwordStrength <= 2,
                              fair: passwordStrength === 3,
                              good: passwordStrength === 4,
                              strong: passwordStrength === 5,
                            })}
                          />
                          <small className="text-muted">
                            * at least 8 characters, including a number
                          </small>
                        </div>
                      )}

                      <div className="input-group mb-3">
                        <div className="input-group-prepend">
                          <span className="input-group-text">☑</span>
                        </div>
                        <input
                          type="password"
                          name="password2"
                          className={classnames("form-control", {
                            "is-invalid": errors.password2,
                          })}
                          error={errors.password2}
                          placeholder="Confirm Password"
                          value={this.state.password2}
                          onChange={this.onChange}
                        />
                        {errors.password2 && (
                          <div className="invalid-feedback">
                            {errors.password2}
                          </div>
                        )}
                      </div>

                      <input
                        type="submit"
                        value="Sign Up"
                        className="btn btn-primary shadow-2 mb-4"
                      />
                    </form>
                    <p className="mb-2">
                      Already have an account?{" "}
                      <a
                        href={`${process.env.PUBLIC_URL}/login/`}
                        className="f-w-400"
                      >
                        Log in
                      </a>
                    </p>
                  </div>
                </div>
                <div className="col-md-6 d-none d-md-block">
                  <img
                    src="../assets/img/slider/register2.png"
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

Register.propTypes = {
  registerUser: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  errors: state.errors,
});

export default connect(mapStateToProps, { registerUser })(withRouter(Register));

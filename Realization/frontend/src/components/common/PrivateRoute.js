import React from "react";
import { Route, Redirect } from "react-router-dom";
import jwt_decode from "jwt-decode";

const PrivateRoute = ({ component: Component, roles, ...rest }) => {
  const token = localStorage.jwtToken;
  let userRole = null;

  if (token) {
    try {
      const decoded = jwt_decode(token);
      userRole = decoded.roles ? decoded.roles[0] : decoded.role;
    } catch (e) {
      console.error("Token decode error", e);
    }
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        token && roles.includes(userRole) ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

export default PrivateRoute;

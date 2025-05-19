import React from "react";
import { Route, Redirect } from "react-router-dom";

const PrivateRoute = ({ component: Component, roles, ...rest }) => (
  <Route
    {...rest}
    render={(props) => {
      if (roles.includes("ADMIN")) {
        // Если роль пользователя ADMIN, разрешаем доступ
        return <Component {...props} />;
      } else {
        return <Redirect to="/" />;
      }
    }}
  />
);

export default PrivateRoute;

import React from "react";
import { Route, Redirect } from "react-router-dom";
import { connect } from "react-redux";
import PropTypes from "prop-types";

const PrivateRoute = ({ component: Component, auth, roles, ...rest }) => (
  <Route
    {...rest}
    render={(props) => {
      if (
        auth.isAuthenticated === true &&
        roles.includes(auth.users.roles[0])
      ) {
        // Если пользователь аутентифицирован и имеет правильную роль, разрешаем доступ
        return <Component {...props} />;
      } else {
        // Если пользователь не аутентифицирован или не имеет правильной роли, перенаправляем на страницу логина
        return <Redirect to="/login" />;
      }
    }}
  />
);

PrivateRoute.propTypes = {
  auth: PropTypes.object.isRequired,
  roles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
});

export default connect(mapStateToProps)(PrivateRoute);

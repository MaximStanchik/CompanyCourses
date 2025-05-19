import React, { Component } from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import store from "./store";
import { Provider } from "react-redux";
import setAuthToken from "./utils/setAuthToken";
import jwt_decode from "jwt-decode";
import Login from "./auth/Login";
import Register from "./auth/Register";
import UserList from "./admin/showallusers";
import EditUser from "./admin/edituser";
import ShowCategoryList from "./admin/ShowCategoryAdmin";
import ShowCourseList from "./admin/showCourseAdmin";
import EditCourseList from "./admin/editCourseAdmin";
import CreateCategoryAdmin from "./admin/createCategoryAdmin";
import EditCategoryList from "./admin/editCategoryAdmin";
import EnrollmentList from "./admin/ShowEnrollmentAdmin";
import CreateEnrollAdmin from "./admin/CreateEnrollmentAdmin";
import Services from "./listOfCourses/Courses";
import Servicesforstudent from "./listOfCourses/CoursesForStudent";
import AddCourse from "./blog/AddCourse";
import AddLecture from "./blog/AddLecture";
import Notification from "./blog/Notification";
import BlogDetailsLeftSidebar from "./blog/BlogDetailsLeftSidebar";
import PageNotFound from "./pages/404";
import NoMatch from "./pages/404";
import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";
import PrivateRoute from "./components/common/PrivateRoute";
import { setCurrentUser, logoutUser } from "./actions/authActions";
import CreateProfile from "./components/create-profile/CreateProfile";
import EditProfile from "./components/edit-profile/EditProfile";
import Profile from "./components/profile/Profile";
import FinalDashboard from "./components/FinalDashboard";
import FinalProfiles from "./components/FinalProfiles";

if (localStorage.jwtToken) {
  setAuthToken(localStorage.jwtToken);
  const decoded = jwt_decode(localStorage.jwtToken);
  store.dispatch(setCurrentUser(decoded));

  const currentTime = Date.now() / 1000;
  if (decoded.exp < currentTime) {
    store.dispatch(logoutUser());
    window.location.href = "/login";
  }
}

class Root extends Component {
  render() {
    const isAuthenticated = !!localStorage.jwtToken;
    const userRole = isAuthenticated ? jwt_decode(localStorage.jwtToken).roles[0] : null;

    return (
      <Provider store={store}>
        <BrowserRouter basename={"/"}>
          <Switch>
            <Route exact path={`${process.env.PUBLIC_URL}/`} render={() => (
              isAuthenticated ? (userRole === "ADMIN" ? <Redirect to="/services" /> : <Redirect to="/my-training" />) : <Redirect to="/login" />
            )} />
            <Route exact path={`${process.env.PUBLIC_URL}/login`} component={Login} />
            <Route exact path={`${process.env.PUBLIC_URL}/register`} component={Register} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/servicesforstudent/:id`} component={Servicesforstudent} roles={["USER"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/services`} component={Services} roles={["USER", "ADMIN"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/addcourse/:id`} component={AddCourse} roles={["ADMIN"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/blog-details-left-sidebar/:id`} component={BlogDetailsLeftSidebar} roles={["USER", "ADMIN"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/allusers`} component={UserList} roles={["ADMIN"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/allusers/edit/:id`} component={EditUser} roles={["ADMIN"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/createEnrollAdmin`} component={CreateEnrollAdmin} roles={["ADMIN"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/EnrollmentList`} component={EnrollmentList} roles={["ADMIN"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/ShowCourseList`} component={ShowCourseList} roles={["ADMIN"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/ShowCategoryList`} component={ShowCategoryList} roles={["ADMIN"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/ShowCourseList/edit/:id`} component={EditCourseList} roles={["ADMIN"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/ShowCategoryList/edit/:id`} component={EditCategoryList} roles={["ADMIN"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/CreateCategoryAdmin`} component={CreateCategoryAdmin} roles={["ADMIN"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/add-lecture/:id`} component={AddLecture} roles={["ADMIN"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/Notifications`} component={Notification} roles={["USER"]} />
            <Route exact path={`${process.env.PUBLIC_URL}/404`} component={PageNotFound} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/finaldashboard`} component={FinalDashboard} roles={["USER"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/create-profile`} component={CreateProfile} roles={["USER"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/edit-profile`} component={EditProfile} roles={["USER"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/finalprofiles`} component={FinalProfiles} roles={["ADMIN"]} />
            <PrivateRoute exact path={`${process.env.PUBLIC_URL}/profile/:handle`} component={Profile} roles={["USER", "ADMIN"]} />
            <Route component={NoMatch} />
          </Switch>
        </BrowserRouter>
      </Provider>
    );
  }
}

const rootElement = document.getElementById("root");
createRoot(rootElement).render(<Root />);
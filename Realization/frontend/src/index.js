import React, { Component, Suspense, useState, useEffect } from "react";
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
import AddCourseAdmin from "./admin/AddCourseAdmin";
import AddLecture from "./blog/AddLecture";
import Notification from "./blog/Notification";
import BlogDetailsLeftSidebar from "./blog/BlogDetailsLeftSidebar";
import PageNotFound from "./pages/404";
import NoMatch from "./pages/404";
import { BrowserRouter, Switch, Route, Redirect, withRouter } from "react-router-dom";
import PrivateRoute from "./components/common/PrivateRoute";
import { setCurrentUser, logoutUser } from "./actions/authActions";
import CreateProfile from "./components/create-profile/CreateProfile";
import EditProfile from "./components/edit-profile/EditProfile";
import Profile from "./components/profile/Profile";
import FinalProfiles from "./components/FinalProfiles";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import LicenseAgreement from "./pages/LicenseAgreement";
import EmailVerificationPending from "./pages/EmailVerificationPending";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import "./pageTransitions.css";
import './i18n';
import SocialAuthHandler from "./auth/SocialAuthHandler";
import About from "./components/About";
import Contacts from "./components/Contacts";
import FAQ from "./components/FAQ";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import Reviews from "./components/Reviews";
import Support from "./pages/Support";
import Articles from './pages/Articles';
import NewPost from './pages/NewPost';
import ArticleView from './pages/ArticleView';
import CoursePromo from './pages/CoursePromo';
import Users from './pages/Users';
import Chat from './pages/Chat';
import ShowAllCoursesAdmin from './admin/ShowAllCoursesAdmin';
import ShowAllLessonsAdmin from './admin/ShowAllLessonsAdmin';
import SyllabusEditor from './admin/SyllabusEditor';
import MailingAdmin from './admin/MailingAdmin';
import NotificationsAdmin from './admin/NotificationsAdmin';
import MyClasses from './pages/MyClasses';
import MyStudents from './pages/MyStudents';

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

// Временное примечание: Предупреждение о findDOMNode связано с react-transition-group. Это устаревший метод, который будет удален в следующем крупном релизе React. Рассмотрите обновление библиотеки или использование ref напрямую в будущем.
class Root extends Component {
  state = {
    i18nInitialized: false
  };

  componentDidMount() {
    if (i18n.isInitialized) {
      this.setState({ i18nInitialized: true });
    } else {
      i18n.on('initialized', () => {
        this.setState({ i18nInitialized: true });
      });
    }
  }

  render() {
    const isAuthenticated = !!localStorage.jwtToken;
    const userRole = isAuthenticated ? jwt_decode(localStorage.jwtToken).roles[0] : null;
    const { i18nInitialized } = this.state;

    return (
      <Provider store={store}>
        <Suspense fallback={<div>Загрузка переводов...</div>}>
          <I18nextProvider i18n={i18n}>
            <BrowserRouter basename={"/"}>
              <Route render={({ location }) => (
                <TransitionGroup>
                  <CSSTransition key={location.key} classNames="page-fade" timeout={400}>
                    <Switch location={location}>
                      <Route exact path="/" component={Services} />
                      <Route exact path="/login" component={Login} />
                      <Route exact path="/register" component={Register} />
                      <Route exact path="/privacy-policy" component={PrivacyPolicy} />
                      <Route exact path="/terms-of-service" component={TermsOfService} />
                      <Route exact path="/license-agreement" component={LicenseAgreement} />
                      <Route exact path="/email-verification-pending" component={EmailVerificationPending} />
                      <PrivateRoute exact path="/servicesforstudent/:id" component={Servicesforstudent} roles={["USER"]} />
                      <PrivateRoute exact path="/services" component={Services} roles={["USER", "ADMIN"]} />
                      <PrivateRoute exact path="/addcourse/:id" component={AddCourseAdmin} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/blog-details-left-sidebar/:id" component={BlogDetailsLeftSidebar} roles={["USER", "ADMIN"]} />
                      <PrivateRoute exact path="/allusers" component={UserList} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/allusers/edit/:id" component={EditUser} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/createEnrollAdmin" component={CreateEnrollAdmin} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/EnrollmentList" component={EnrollmentList} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/ShowCourseList" component={ShowCourseList} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/ShowCategoryList" component={ShowCategoryList} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/ShowCourseList/edit/:id" component={EditCourseList} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/editcourse/:id" component={EditCourseList} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/ShowCategoryList/edit/:id" component={EditCategoryList} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/CreateCategoryAdmin" component={CreateCategoryAdmin} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/add-lecture/:id" component={AddLecture} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/Notifications" component={NotificationsAdmin} roles={["ADMIN"]} />
                      <Route exact path="/404" component={PageNotFound} />
                      <PrivateRoute exact path="/create-profile" component={CreateProfile} roles={["USER"]} />
                      <PrivateRoute exact path="/edit-profile" component={EditProfile} roles={["USER"]} />
                      <PrivateRoute exact path="/finalprofiles" component={FinalProfiles} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/profile/:handle" component={Profile} roles={["USER", "ADMIN"]} />
                      <Route exact path="/social-auth" component={SocialAuthHandler} />
                      <Route exact path="/about" component={About} />
                      <Route exact path="/contacts" component={Contacts} />
                      <Route exact path="/faq" component={FAQ} />
                      <Route exact path="/reviews" component={Reviews} />
                      <Route exact path="/support" component={Support} />
                      <Route exact path="/articles" component={Articles} />
                      <Route exact path="/articles/newPost" component={NewPost} />
                      <Route exact path="/articles/:id" component={ArticleView} />
                      <Route exact path="/course-promo/:id" component={CoursePromo} />
                      <Route exact path="/users" component={Users} />
                      <Route exact path="/chat" component={Chat} />
                      <PrivateRoute exact path="/teach/courses" component={ShowAllCoursesAdmin} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/teach/lessons" component={ShowAllLessonsAdmin} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/teach/lessons/new" component={require('./admin/NewLessonAdmin').default} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/teach/classes" component={MyClasses} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/teach/students" component={MyStudents} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/editcourse/:id/syllabus-editor" component={SyllabusEditor} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/editcourse/:id/search" component={require('./admin/CourseSearchAdmin').default} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/teach/mailing" component={MailingAdmin} roles={["ADMIN"]} />
                      <PrivateRoute exact path="/notifications" component={NotificationsAdmin} roles={["ADMIN"]} />
                      <Route component={NoMatch} />
                    </Switch>
                  </CSSTransition>
                </TransitionGroup>
              )} />
            </BrowserRouter>
          </I18nextProvider>
        </Suspense>
      </Provider>
    );
  }
}

const rootElement = document.getElementById("root");
createRoot(rootElement).render(<Root />);
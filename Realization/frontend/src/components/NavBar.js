import React from "react";
import { Link, useHistory } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../actions/authActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCode,
  faUser,
  faUsers,
  faList,
  faFileCode,
  faComputer,
  faSignOutAlt,
  faSignIn,
  faComments,
  faPeopleGroup,
  faGraduationCap,
  faMoon,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import useTheme from "../hooks/useTheme";
import "../components/NavBarStyle.css";

const NavBar = () => {
  const [displayProp, setDisplayProp] = React.useState("none");
  const [flexProp, setFlexProp] = React.useState("row");
  const [showModal, setShowModal] = React.useState(false);

  const { theme, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const history = useHistory();
  const { isAuthenticated, users } = useSelector((state) => state.auth);

  React.useEffect(() => {
    if (users?.id) {
      localStorage.setItem("userid", JSON.stringify(users.id));
    }
    if (users?.roles?.length > 0) {
      localStorage.setItem("userRole", JSON.stringify(users.roles[0]));
    }
  }, [users]);

  const handleLogoutConfirm = () => {
    dispatch(logoutUser());
    history.push("/login");
    setShowModal(false);
  };

  const classToggle = () => {
    setDisplayProp((prev) => (prev === "none" ? "flex" : "none"));
    setFlexProp((prev) => (prev === "row" ? "column" : "row"));
  };

  const ThemeToggle = (
    <li onClick={toggleTheme} style={{ cursor: "pointer" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} size="2x" />
        <span style={{ fontSize: "9px", marginTop: "5px" }}>
          {theme === "light" ? "DARK" : "LIGHT"} MODE
        </span>
      </div>
    </li>
  );

  const logoutLink = (
    <li>
      <a href="#" onClick={(e) => { e.preventDefault(); setShowModal(true); }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <FontAwesomeIcon icon={faSignOutAlt} size="2x" />
          <span style={{ fontSize: "9px", marginTop: "5px" }}>LOGOUT</span>
        </div>
      </a>
    </li>
  );

  const guestLinks = (
    <li>
      <Link className="nav-link" to="/login">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <FontAwesomeIcon icon={faSignIn} size="2x" />
          <span style={{ fontSize: "9px", marginTop: "5px" }}>LOGIN</span>
        </div>
      </Link>
    </li>
  );

  const adminLinks = (
    <>
      <li className="has-children has-children--multilevel-submenu">
        <a>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <FontAwesomeIcon icon={faCode} size="2x" />
            <span style={{ fontSize: "9px", marginTop: "5px" }}>COURSES</span>
          </div>
        </a>
        <ul className="submenu">
          <li><a href={`/addcourse/${users.id}`}>ADD COURSE</a></li>
          <li><a href={`/add-lecture/${users.id}`}>ADD LECTURE</a></li>
          <li><a href={`/services`}>ALL COURSES</a></li>
        </ul>
      </li>
      <li><a href="/finalprofiles"><div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><FontAwesomeIcon icon={faPeopleGroup} size="2x" /><span style={{ fontSize: "9px", marginTop: "5px" }}>USER PROFILES</span></div></a></li>
      <li><a href="/allusers"><div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><FontAwesomeIcon icon={faUsers} size="2x" /><span style={{ fontSize: "9px", marginTop: "5px" }}>USERS</span></div></a></li>
      <li><a href="/ShowCourseList"><div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><FontAwesomeIcon icon={faList} size="2x" /><span style={{ fontSize: "9px", marginTop: "5px" }}>COURSES</span></div></a></li>
      <li><a href="/ShowCategoryList"><div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><FontAwesomeIcon icon={faFileCode} size="2x" /><span style={{ fontSize: "9px", marginTop: "5px" }}>CATEGORIES</span></div></a></li>
      <li><a href="/EnrollmentList"><div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><FontAwesomeIcon icon={faComputer} size="2x" /><span style={{ fontSize: "9px", marginTop: "5px" }}>ENROLLED USERS</span></div></a></li>
      {ThemeToggle}
      {logoutLink}
    </>
  );

  const userLinks = (
    <>
      <li>
        <Link to="/my-training">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <FontAwesomeIcon icon={faGraduationCap} size="2x" />
            <span style={{ fontSize: "9px", marginTop: "5px" }}>MY TRAINING</span>
          </div>
        </Link>
      </li>
      <li>
        <Link to="/Notifications">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <FontAwesomeIcon icon={faComments} size="2x" />
            <span style={{ fontSize: "9px", marginTop: "5px" }}>NOTIFICATIONS</span>
          </div>
        </Link>
      </li>
      <li className="has-children has-children--multilevel-submenu">
        <a>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <FontAwesomeIcon icon={faList} size="2x" />
            <span style={{ fontSize: "9px", marginTop: "5px" }}>COURSES</span>
          </div>
        </a>
        <ul className="submenu">
          <li><a href={`/servicesforstudent/${users.id}`}>MY COURSES</a></li>
          <li><a href="/services">ALL COURSES</a></li>
        </ul>
      </li>
      <li>
        <Link to="/finaldashboard">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <FontAwesomeIcon icon={faUser} size="2x" />
            <span style={{ fontSize: "9px", marginTop: "5px" }}>PROFILE</span>
          </div>
        </Link>
      </li>
      {ThemeToggle}
      {logoutLink}
    </>
  );

  const renderLinks = () => {
    if (!isAuthenticated) return guestLinks;
    if (users?.roles?.includes("ADMIN")) return adminLinks;
    return userLinks;
  };

  return (
    <>
      <div className="header-area header-sticky header-sticky--default">
        <div className="header-area__desktop header-area__desktop--default">
          <div className="header-navigation-area default-bg">
            <div className="container">
              <div className="row">
                <div className="col-lg-12">
                  <div className="header-navigation header-navigation--header-default position-relative">
                    <div className="header-navigation__nav position-static" style={{ width: "100%" }}>
                      <nav className="main-nav">
                        <a href="/home">
                          <div className="logoHead">
                            <h2>itProger</h2>
                          </div>
                        </a>
                        <ul id="main-nav-ul">{renderLinks()}</ul>
                        <div className="Navbar__Link Navbar__Link-toggle" onClick={classToggle}>
                          <i className="fas fa-bars" />
                        </div>
                      </nav>
                      <nav className="Navbar__Items" style={{ display: displayProp }}>
                        <ul style={{ display: displayProp, flexDirection: flexProp }}>
                          {renderLinks()}
                        </ul>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "#fff", padding: "30px", borderRadius: "8px",
            textAlign: "center", minWidth: "300px", maxWidth: "400px", position: "relative"
          }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>🤔</div>
            <div style={{ fontSize: "18px", marginBottom: "20px" }}>
              Are you sure you want to exit?
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <button onClick={handleLogoutConfirm} style={{ backgroundColor: "#28a745", color: "white", padding: "8px 16px", border: "none", borderRadius: "4px" }}>
                OK
              </button>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 16px", border: "1px solid gray", borderRadius: "4px", backgroundColor: "white" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavBar;

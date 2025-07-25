import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { getCurrentProfile, deleteAccount } from "../../actions/profileActions";
import Spinner from "../common/Spinner";
import ProfileActions from "./ProfileActions";

class Dashboard extends Component {
  componentDidMount() {
    this.props.getCurrentProfile();
  }

  onDeleteClick(e) {
    this.props.deleteAccount();
  }

  render() {
    const { user } = this.props.auth;
    const { profile, loading } = this.props.profile;
    let dashboardContent;
    if (profile === null || loading) {
      dashboardContent = <Spinner />;
    } 
    else {
      if (Object.keys(profile).length > 0) {
        dashboardContent = (
          <div>
            <p className="lead text-muted">
              <h1>
                Welcome,{" "}
                <Link
                  to={`/profile/${profile.handle}`}
                  style={{ color: "#FF9540" }}
                >
                  {profile.handle}
                </Link>
              </h1>
              <br />
            </p>
            <ProfileActions />

            <div className="d-flex justify-content-center align-items-center mt-2">
              <button
                onClick={this.onDeleteClick.bind(this)}
                className="btn btn-danger"
              >
                Delete my profile
              </button>
            </div>
          </div>
        );
      } 
      else {
        dashboardContent = (
          <div
            style={{ textAlign: "center", marginTop: "50px", fontSize: "30px" }}
          >
            <p className="lead text-muted" style={{ fontSize: "40px" }}>
              Welcome, {profile.handle}
            </p>
            <p style={{ fontSize: "20px" }}>
              you have not yet setup a profile, please add some info
            </p>
            <Link to="/edit-profile" className="btn btn-lg btn-info">
              Create Profile
            </Link>
          </div>
        );
      }
    }

    return (
      <div className="dashboard">
        <div className="container">
          <div className="row">
            <div className="col-md-12">{dashboardContent}</div>
          </div>
        </div>
      </div>
    );
  }
}

Dashboard.propTypes = {
  getCurrentProfile: PropTypes.func.isRequired,
  deleteAccount: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  profile: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  profile: state.profile,
  auth: state.auth,
});

export default connect(mapStateToProps, { getCurrentProfile, deleteAccount })(
  Dashboard
);

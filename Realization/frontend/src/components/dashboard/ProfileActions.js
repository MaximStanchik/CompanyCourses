import React from "react";
import { Link } from "react-router-dom";

const ProfileActions = () => {
  return (
    <div className="text-center mb-4">
      <p>Do you want to change or add information about yourself?</p>
      <Link to="/edit-profile" className="btn btn-light">
        <i className="fas fa-user-circle text-info mr-1" /> Edit Profile
      </Link>
    </div>
  );
};

export default ProfileActions;

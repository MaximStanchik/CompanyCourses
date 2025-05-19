import React from "react";
import PropTypes from "prop-types";

const ProfileHeader = ({ profile }) => {
  return (
    <div className="card card-body bg-info text-white mb-3">
      <div className="row">
        <div className="col-4 col-md-3 m-auto">
          <img
            className="rounded-circle"
            src={profile.user.avatar}
            alt=""
          />
        </div>
      </div>
      <div className="text-center">
        <h1 className="display-4">{profile.user.name}</h1>
        <p className="lead">
          {profile.jobTitle && <span>{profile.jobTitle}</span>}
        </p>
        <p>
          {profile.city && <span>{profile.city}, </span>}
          {profile.country && <span>{profile.country}</span>}
        </p>
      </div>
    </div>
  );
};

ProfileHeader.propTypes = {
  profile: PropTypes.object.isRequired
};

export default ProfileHeader;

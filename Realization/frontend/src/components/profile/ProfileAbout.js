import React from "react";
import PropTypes from "prop-types";

const ProfileAbout = ({ profile }) => {
  return (
    <div className="card card-body bg-light mb-3">
      <h3 className="text-center text-info">{(profile.user.name || profile.user.username || 'User')}'s Bio</h3>
      <p className="lead text-center">
        {profile.bio ? <span>{profile.bio}</span> : <span>No bio provided</span>}
      </p>
      <hr />
      {profile.status && (
        <p className="text-center">
          <strong>Status:</strong> {profile.status}
        </p>
      )}
      {Array.isArray(profile.skills) && profile.skills.length > 0 && (
        <>
          <h3 className="text-center text-info">Skill Set</h3>
          <div className="row">
            <div className="d-flex flex-wrap justify-content-center align-items-center">
              {profile.skills.map((skill, index) => (
                <div key={index} className="p-3">
                  <i className="fa fa-check" /> {skill}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

ProfileAbout.propTypes = {
  profile: PropTypes.object.isRequired
};

export default ProfileAbout;

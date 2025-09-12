import React from "react";
import { Link } from "react-router-dom";
import i18n from "../../i18n";

const t = i18n.t.bind(i18n);

const ProfileActions = () => {
  return (
    <div className="text-center mb-4">
      <p>{t('auth.profile_actions_question')}</p>
      <Link to="/edit-profile" className="btn btn-light">
        <i className="fas fa-user-circle text-info mr-1" /> {t('auth.edit_profile')}
      </Link>
    </div>
  );
};

export default ProfileActions;

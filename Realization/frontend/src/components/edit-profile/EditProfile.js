import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import TextFieldGroup from "../common/TextFieldGroup";
import SelectListGroup from "../common/SelectListGroup";
import { createProfile, getCurrentProfile } from "../../actions/profileActions";
import { withRouter } from "react-router-dom";

class EditProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      handle: "",
      skills: "",
      githubusername: "",
      bio: "",
      jobTitle: "",
      city: "",
      country: "",
      status: "",
      errors: {}
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    this.props.getCurrentProfile();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.errors) {
      this.setState({ errors: nextProps.errors });
    }

    if (nextProps.profile.profile) {
      const profile = nextProps.profile.profile;

      // Convert skills array back to CSV
      const skillsCSV = profile.skills.join(",");

      this.setState({
        handle: profile.handle || "",
        skills: skillsCSV,
        githubusername: profile.githubusername || "",
        bio: profile.bio || "",
        jobTitle: profile.jobTitle || "",
        city: profile.city || "",
        country: profile.country || "",
        status: profile.status || ""
      });
    }
  }

  onSubmit(e) {
    e.preventDefault();

    const profileData = {
      handle: this.state.handle,
      skills: this.state.skills,
      githubusername: this.state.githubusername,
      bio: this.state.bio,
      jobTitle: this.state.jobTitle,
      city: this.state.city,
      country: this.state.country,
      status: this.state.status
    };

    this.props.createProfile(profileData, this.props.history);
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  render() {
    const { errors } = this.state;

    const jobOptions = [
      { label: "* Select Job Title", value: "" },
      { label: "Android Developer", value: "Android Developer" },
      { label: "Backend Developer", value: "Backend Developer" },
      { label: "DevOps", value: "DevOps" },
      { label: "Enterprise Java Developer", value: "Enterprise Java Developer" },
      { label: "Frontend Developer", value: "Frontend Developer" },
      { label: "Fullstack Developer", value: "Fullstack Developer" },
      { label: "Java Developer", value: "Java Developer" },
      { label: "iOS Developer", value: "iOS Developer" },
      { label: "QA Automation Engineer", value: "QA Automation Engineer" },
      { label: "Software Developer", value: "Software Developer" },
      { label: "System Engineer", value: "System Engineer" },
      { label: "Software Architect", value: "Software Architect" },
      { label: "Technical Lead", value: "Technical Lead" },
      { label: "Team Lead", value: "Team Lead" },
      { label: "Web Java Developer", value: "Web Java Developer" }
    ];

    const statusOptions = [
      { label: "* Select Status", value: "" },
      { label: "Learning programming", value: "Learning programming" },
      { label: "Working as a programmer", value: "Working as a programmer" },
      { label: "Not a programmer", value: "Not a programmer" }
    ];

    return (
      <div className="edit-profile">
        <div className="container">
          <div className="row">
            <div className="col-md-8 m-auto">
              <h1 className="display-4 text-center">Edit Your Profile</h1>
              <form onSubmit={this.onSubmit}>
                <TextFieldGroup
                  placeholder="* Profile Handle"
                  name="handle"
                  value={this.state.handle}
                  onChange={this.onChange}
                  error={errors.handle}
                  info="A unique handle for your profile URL"
                />

                <TextFieldGroup
                  placeholder="Skills"
                  name="skills"
                  value={this.state.skills}
                  onChange={this.onChange}
                  error={errors.skills}
                  info="Please use comma separated values (e.g. HTML,CSS,JavaScript)"
                />

                <TextFieldGroup
                  placeholder="GitHub Username"
                  name="githubusername"
                  value={this.state.githubusername}
                  onChange={this.onChange}
                  error={errors.githubusername}
                  info="If you want your latest repos, include your GitHub username"
                />

                <TextFieldGroup
                  placeholder="Short Bio"
                  name="bio"
                  value={this.state.bio}
                  onChange={this.onChange}
                  error={errors.bio}
                  info="Tell us a little about yourself"
                />

                <SelectListGroup
                  name="jobTitle"
                  value={this.state.jobTitle}
                  onChange={this.onChange}
                  options={jobOptions}
                  error={errors.jobTitle}
                  info="Select your current job title or specialization"
                />

                <SelectListGroup
                  name="status"
                  value={this.state.status}
                  onChange={this.onChange}
                  options={statusOptions}
                  error={errors.status}
                  info="Your current professional status"
                />

                <TextFieldGroup
                  placeholder="City"
                  name="city"
                  value={this.state.city}
                  onChange={this.onChange}
                  error={errors.city}
                  info="Enter the city you currently live in"
                />

                <TextFieldGroup
                  placeholder="Country"
                  name="country"
                  value={this.state.country}
                  onChange={this.onChange}
                  error={errors.country}
                  info="Enter the country you currently live in"
                />

                <input
                  type="submit"
                  value="Save"
                  className="btn btn-info btn-block mt-4"
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

EditProfile.propTypes = {
  createProfile: PropTypes.func.isRequired,
  getCurrentProfile: PropTypes.func.isRequired,
  profile: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  profile: state.profile,
  errors: state.errors
});

export default connect(mapStateToProps, { createProfile, getCurrentProfile })(
  withRouter(EditProfile)
);

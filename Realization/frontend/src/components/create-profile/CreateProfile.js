import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import TextFieldGroup from "../common/TextFieldGroup";
import SelectListGroup from "../common/SelectListGroup";
import { createProfile } from "../../actions/profileActions";
import { withRouter } from "react-router-dom";

class CreateProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displaySocialInputs: false,
      handle: "",
      skills: "",
      githubusername: "",
      bio: "",
      jobTitle: "",
      city: "",
      country: "",
      goal: "",
      errors: {}
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.errors) {
      this.setState({ errors: nextProps.errors });
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
      goal: this.state.goal
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
      { label: "Back End Developer/Engineer", value: "Back End Developer/Engineer" },
      { label: "Data Scientist", value: "Data Scientist" },
      { label: "Technology Consultant", value: "Technology Consultant" },
      { label: "Machine Learning Engineer", value: "Machine Learning Engineer" },
      { label: "Product Manager", value: "Product Manager" },
      { label: "Business/Management Analyst", value: "Business/Management Analyst" },
      { label: "Data Warehouse Developer", value: "Data Warehouse Developer" },
      { label: "Cyber Security Engineer", value: "Cyber Security Engineer" },
      { label: "Video Game Developer", value: "Video Game Developer" },
      { label: "Data Architect", value: "Data Architect" },
      { label: "Marketing Analytics Specialist", value: "Marketing Analytics Specialist" },
      { label: "Logistics/Supply Chain Analyst", value: "Logistics/Supply Chain Analyst" },
      { label: "IT Project Manager", value: "IT Project Manager" },
      { label: "Business Intelligence Analyst", value: "Business Intelligence Analyst" },
      { label: "Data Analyst", value: "Data Analyst" },
      { label: "Statistician", value: "Statistician" },
      { label: "Mainframe Developer", value: "Mainframe Developer" },
      { label: "Project Manager", value: "Project Manager" },
      { label: "Business Analyst (general)", value: "Business Analyst (general)" },
      { label: "Tax Analyst/Specialist", value: "Tax Analyst/Specialist" },
      { label: "Automation Engineer", value: "Automation Engineer" },
      { label: "Cyber/Information Security Engineer/Analyst", value: "Cyber/Information Security Engineer/Analyst" },
      { label: "Real Estate Agent", value: "Real Estate Agent" },
      { label: "Technical Support Engineer/Analyst", value: "Technical Support Engineer/Analyst" },
      { label: "Social Media Strategist/Specialist", value: "Social Media Strategist/Specialist" },
      { label: "UI/UX Manager", value: "UI/UX Manager" },
      { label: "Data Engineer", value: "Data Engineer" },
      { label: "iOS Developer/Engineer", value: "iOS Developer/Engineer" },
      { label: "Cloud Architect", value: "Cloud Architect" },
      { label: "Sales Representative", value: "Sales Representative" },
      { label: "Human Resources Specialist", value: "Human Resources Specialist" },
      { label: "Scrum Master", value: "Scrum Master" },
      { label: "Full Stack Developer", value: "Full Stack Developer" },
      { label: "Sales Development Representative", value: "Sales Development Representative" },
      { label: "Digital Marketing Specialist", value: "Digital Marketing Specialist" },
      { label: "Bookkeeper / Accounting Clerk", value: "Bookkeeper / Accounting Clerk" },
      { label: "Solutions/Application Architect", value: "Solutions/Application Architect" },
      { label: "Network/Systems Administrator", value: "Network/Systems Administrator" },
      { label: "Customer Service Representative", value: "Customer Service Representative" },
      { label: "Front End Developer", value: "Front End Developer" },
      { label: "Application Developer/Engineer", value: "Application Developer/Engineer" },
      { label: "Network Engineer/Architect", value: "Network Engineer/Architect" },
      { label: "Cyber Security Specialist/Technician", value: "Cyber Security Specialist/Technician" },
      { label: "Actuary", value: "Actuary" },
      { label: "DevOps Engineer", value: "DevOps Engineer" },
      { label: "Sales Operations Specialist", value: "Sales Operations Specialist" },
      { label: "Android Developer/Engineer", value: "Android Developer/Engineer" },
      { label: "Risk Consultant", value: "Risk Consultant" },
      { label: "Computer Support Specialist", value: "Computer Support Specialist" },
      { label: "Business Intelligence Architect/Developer", value: "Business Intelligence Architect/Developer" },
      { label: "Chief Data Officer", value: "Chief Data Officer" },
      { label: "Career Counselor", value: "Career Counselor" },
      { label: "Computer Scientist", value: "Computer Scientist" },
      { label: "Analytics Manager", value: "Analytics Manager" },
      { label: "Risk Analyst", value: "Risk Analyst" },
      { label: "Market Research Analyst", value: "Market Research Analyst" },
      { label: "Strategic Planner/Analyst", value: "Strategic Planner/Analyst" },
      { label: "Business/Management Consultant", value: "Business/Management Consultant" },
      { label: "DEI Specialist", value: "Diversity, Equity, and Inclusion Specialist" },
      { label: "Aerospace Engineer", value: "Aerospace Engineer" },
      { label: "Fraud Examiner/Analyst", value: "Fraud Examiner/Analyst" },
      { label: "Corporate Development Analyst", value: "Corporate Development Analyst" },
      { label: "Data/Data Mining Analyst", value: "Data/Data Mining Analyst" },
      { label: "Advertising/Promotions Manager", value: "Advertising/Promotions Manager" },
      { label: "Business Program Analyst", value: "Business Program Analyst" },
      { label: "Program Manager", value: "Program Manager" },
      { label: "Pricing Analyst", value: "Pricing Analyst" },
      { label: "Researcher/Research Associate", value: "Researcher/Research Associate" },
      { label: "Marketing Analyst", value: "Marketing Analyst" },
      { label: "Data Manager", value: "Data Manager" },
      { label: "Biologist", value: "Biologist" },
      { label: "Talent Acquisition/Recruiting Manager", value: "Talent Acquisition/Recruiting Manager" },
      { label: "Business Development Manager", value: "Business Development Manager" },
      { label: "Business Analysis Manager", value: "Business Analysis Manager" },
      { label: "Sustainability Specialist", value: "Sustainability Specialist" },
      { label: "Supply Chain Analyst", value: "Supply Chain Analyst" },
      { label: "HR Consultant", value: "Human Resources Consultant" },
      { label: "E-commerce Analyst", value: "E-commerce Analyst" },
      { label: "Compensation/Benefits Analyst", value: "Compensation/Benefits Analyst" },
      { label: "Financial Quantitative Analyst", value: "Financial Quantitative Analyst" },
      { label: "Human Resources Analyst", value: "Human Resources Analyst" },
      { label: "Project Management Analyst", value: "Project Management Analyst" },
      { label: "Writer", value: "Writer" },
      { label: "Director of Project Management", value: "Director of Project Management" },
      { label: "Product Development Manager", value: "Product Development Manager" },
      { label: "Chemical/Process Engineer", value: "Chemical/Process Engineer" },
      { label: "Systems Integration Engineer/Specialist", value: "Systems Integration Engineer/Specialist" }
    ];    

    const goalOptions = [
      { label: "* What is your goal?", value: "" },
      { label: "Start a career", value: "Start a career" },
      { label: "Change careers", value: "Change careers" },
      { label: "Improve within your current role", value: "Improve within your current role" },
      { label: "Explore topics unrelated to work", value: "Explore topics unrelated to work" }
    ];

    return (
      <div className="create-profile">
        <div className="container">
          <div className="row">
            <div className="col-md-8 m-auto">
              <h1 className="display-4 text-center">Create Your Profile</h1>
              <p className="lead text-center">
                Let's get some information to make your profile stand out
              </p>
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
                  placeholder="* Job Title"
                  name="jobTitle"
                  value={this.state.jobTitle}
                  onChange={this.onChange}
                  options={jobOptions}
                  error={errors.jobTitle}
                  info="Select your current job title or specialization"
                />

                <SelectListGroup
                  placeholder="* Goal"
                  name="goal"
                  value={this.state.goal}
                  onChange={this.onChange}
                  options={goalOptions}
                  error={errors.goal}
                  info="Your current goal"
                />

                <TextFieldGroup
                  placeholder="City"
                  name="city"
                  value={this.state.city}
                  onChange={this.onChange}
                  error={errors.city}
                  info="Your city"
                />

                <TextFieldGroup
                  placeholder="Country"
                  name="country"
                  value={this.state.country}
                  onChange={this.onChange}
                  error={errors.country}
                  info="Your country"
                />

                <input
                  type="submit"
                  value="Submit"
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

CreateProfile.propTypes = {
  createProfile: PropTypes.func.isRequired,
  profile: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  profile: state.profile,
  errors: state.errors
});

export default connect(mapStateToProps, { createProfile })(
  withRouter(CreateProfile)
);

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
        username: "",
        name: "",
        surname: "",
        additionalName: "",
        skills: "",
        githubusername: "",
        bio: "",
        jobTitle: "",
        city: "",
        country: "",
        goal: "",
        aboutMe: "",
        company: "",
        position: "",
        status: "",
        email: "",
        errors: {}
      };
  
      this.onChange = this.onChange.bind(this);
      this.onSubmit = this.onSubmit.bind(this);
    }
  
    componentDidMount() {
      const { auth, location } = this.props;
      const user = auth?.user || {};
      const prefill = location?.state || {};
  
      this.setState({
        name: user.name || "",
        surname: user.surname || "",
        username: prefill.username || user.username || "",
        email: prefill.email || user.email || ""
      });
    }
  
    componentDidUpdate(prevProps) {
      if (prevProps.errors !== this.props.errors) {
        this.setState({ errors: this.props.errors });
      }
    }
  
    onSubmit(e) {
      e.preventDefault();
  
      const profileData = {
        username: this.state.username,
        name: this.state.name,
        surname: this.state.surname,
        additionalName: this.state.additionalName,
        skills: this.state.skills,
        githubusername: this.state.githubusername,
        bio: this.state.bio,
        jobTitle: this.state.jobTitle,
        city: this.state.city,
        country: this.state.country,
        goal: this.state.goal,
        aboutMe: this.state.aboutMe,
        company: this.state.company,
        position: this.state.position,
        status: this.state.status,
        email: this.state.email
      };
  
      this.props.createProfile(profileData, this.props.history);
    }
  
    onChange(e) {
      this.setState({ [e.target.name]: e.target.value });
    }
  
    render() {
      const { errors } = this.state;

    const jobOptions = [
      { label: "Select Job Title", value: "" },
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
      { label: "What is your goal?", value: "" },
      { label: "Учу программирование", value: "Learning programming" },
      { label: "Работаю программистом", value: "Working as programmer" },
      { label: "Работаю не программистом", value: "Working not as programmer" }
    ];

    return (
        <div className="edit-profile">
          <div className="container">
            <div className="row">
              <div className="col-md-8 m-auto">
                <h1 className="display-4 text-center">Your Profile</h1>
                <form onSubmit={this.onSubmit}>
                  <TextFieldGroup
                    placeholder="* Username"
                    name="username"
                    value={this.state.username}
                    onChange={this.onChange}
                    error={errors.username}
                    info="Enter a unique username for your profile."
                  />
                  <TextFieldGroup
                    placeholder="* Name"
                    name="name"
                    value={this.state.name}
                    onChange={this.onChange}
                    error={errors.name}
                    info="Your first name."
                  />
                  <TextFieldGroup
                    placeholder="* Surname"
                    name="surname"
                    value={this.state.surname}
                    onChange={this.onChange}
                    error={errors.surname}
                    info="Your last name."
                  />
                  <TextFieldGroup
                    placeholder="Additional Name"
                    name="additionalName"
                    value={this.state.additionalName}
                    onChange={this.onChange}
                    error={errors.additionalName}
                    info="Any additional names you may have."
                  />
                  <TextFieldGroup
                    placeholder="Skills"
                    name="skills"
                    value={this.state.skills}
                    onChange={this.onChange}
                    error={errors.skills}
                    info="Please use comma-separated values (e.g., HTML, CSS, JavaScript)."
                  />
                  <TextFieldGroup
                    placeholder="GitHub Username"
                    name="githubusername"
                    value={this.state.githubusername}
                    onChange={this.onChange}
                    error={errors.githubusername}
                    info="Your GitHub username for showcasing repositories."
                  />
                  <TextFieldGroup
                    placeholder="Short Bio"
                    name="bio"
                    value={this.state.bio}
                    onChange={this.onChange}
                    error={errors.bio}
                    info="Tell us a little about yourself."
                  />
                  <SelectListGroup
                    name="jobTitle"
                    value={this.state.jobTitle}
                    onChange={this.onChange}
                    options={jobOptions}
                    error={errors.jobTitle}
                    info="Select your current job title or specialization."
                  />
                  <SelectListGroup
                    name="goal"
                    value={this.state.goal}
                    onChange={this.onChange}
                    options={goalOptions}
                    error={errors.goal}
                    info="Choose your current professional or personal goal."
                  />
                  <TextFieldGroup
                    placeholder="City"
                    name="city"
                    value={this.state.city}
                    onChange={this.onChange}
                    error={errors.city}
                    info="Enter the city you currently live in."
                  />
                  <TextFieldGroup
                    placeholder="Country"
                    name="country"
                    value={this.state.country}
                    onChange={this.onChange}
                    error={errors.country}
                    info="Enter the country you currently live in."
                  />
                  <TextFieldGroup
                    placeholder="Company"
                    name="company"
                    value={this.state.company}
                    onChange={this.onChange}
                    error={errors.company}
                    info="Name of the company you currently work for (if applicable)."
                  />
                  <TextFieldGroup
                    placeholder="Position"
                    name="position"
                    value={this.state.position}
                    onChange={this.onChange}
                    error={errors.position}
                    info="Your current position or role in the company."
                  />
                  <TextFieldGroup
                    placeholder="Current Status (e.g., Employed, Looking for work)"
                    name="status"
                    value={this.state.status}
                    onChange={this.onChange}
                    error={errors.status}
                    info="Your current employment or availability status."
                  />
                  <input type="submit" value="Save" className="btn btn-info btn-block mt-4" />
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
    auth: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired
  };
  
  const mapStateToProps = state => ({
    profile: state.profile,
    auth: state.auth,
    errors: state.errors
  });
  
  export default connect(mapStateToProps, { createProfile })(withRouter(CreateProfile));
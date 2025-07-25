import React, { Component } from "react";
import NavBar from "./NavBar";
import Profiles from "./profiles/Profiles";
class Services extends Component {
  render() {
    return (
      <div>
        {/* Navigation bar */}
        <NavBar />
        {/* breadcrumb removed as requested */}

        {/*====================  service page content ====================*/}
        <div className="page-wrapper section-space--inner--120">
          {/*Service section start*/}
          <div className="service-section">
            <div className="container">
              <Profiles />
            </div>
          </div>
          {/*Service section end*/}
        </div>
        {/*====================  End of service page content  ====================*/}
      </div>
    );
  }
}

export default Services;

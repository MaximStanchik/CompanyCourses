import React, { Component } from "react";
import axios from "../utils/axios";
import NavBar from "../components/NavBar";
class Services extends Component {
  state = {
    data: [],
  };
  async componentDidMount() {
    const response = await axios
      .get("/enrollmentbystudent?id=" + this.props.match.params.id, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((result) => {
        console.log(result.data[0]);
        return result;
      });

    this.setState({
      data: response.data,
    });
  }
  render() {
    let data = this.state.data;
    let Datalist = data.map((val, i) => {
      return (
        <div
          className="col-lg-4 col-md-6 col-12 section-space--bottom--30"
          key={i}
        >
          <div className="service-grid-item">
            <div className="service-grid-item__image">
              <div className="service-grid-item__content">
                <h3 className="title">
                  <a
                    href={
                      `${process.env.PUBLIC_URL}/` +
                      `blog-details-left-sidebar/` +
                      `${val.Course.id}`
                    }
                  >
                    {val.Course.name}
                  </a>
                </h3>
                <p className="subtitle">{val.Course.description}</p>
              </div>
            </div>
          </div>
        </div>
      );
    });

    return (
      <div style={{ overflow: "auto", height: "100vh" }}>
        {/* Navigation bar */}
        <NavBar />
        {/* breadcrumb */}
        {/*====================  breadcrumb area ====================*/}
        <div className="breadcrumb-area breadcrumb-bg">
          <div className="container">
            <div className="row">
              <div className="col">
                <div className="page-banner text-center">
                  <h1>MY COURSES</h1>
                  {/* <ul className="page-breadcrumb">
                                        <li><a href="/">Home</a></li>
                                        <li>Service</li>
                                    </ul> */}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/*====================  End of breadcrumb area  ====================*/}

        {/*====================  service page content ====================*/}
        <div className="page-wrapper section-space--inner--120">
          {/*Service section start*/}
          <div className="service-section">
            <div className="container">
              <div className="row">
                <div className="col-lg-12">
                  <div className="service-item-wrapper">
                    <div className="row">{Datalist}</div>
                  </div>
                </div>
              </div>
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

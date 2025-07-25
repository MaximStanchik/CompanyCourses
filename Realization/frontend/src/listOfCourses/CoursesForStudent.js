import React, { Component } from "react";
import axios from "../utils/axios";
import NavBar from "../components/NavBar";
import i18n from "../i18n";
import Footer from "../components/Footer";
import "../App.css";

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

    const t = i18n.t.bind(i18n);
    return (
      <div className="page-flex-wrapper">
        {/* Navigation bar */}
        <NavBar />
        {/*====================  service page content ====================*/}
        <div className="main-content-flex page-wrapper section-space--inner--120">
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
        <Footer />
      </div>
    );
  }
}

export default Services;

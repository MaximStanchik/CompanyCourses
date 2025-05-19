import React, { useState, useEffect } from "react";
import axios from "../utils/axios";
import NavBar from "../components/NavBar";

const Services = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/courses", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          },
        });
        setData(response.data);
      } catch (error) {
        if (
          (error.response && error.response.status === 401) ||
          (error.response && error.response.status === 403)
        ) {
          window.location.href = "/login";
        } else {
          console.log(error);
        }
      }
    };
    fetchData();
  }, []);

  const Datalist = data.map((val, i) => (
    <div className="col-lg-4 col-md-6 col-12 section-space--bottom--30" key={i}>
      <div className="service-card">
        <div className="service-card__image">
          <div className="service-card__content">
            <h3 className="title">
              <a
                href={`${process.env.PUBLIC_URL}/blog-details-left-sidebar/${val.id}`}
              >
                {val.name}
              </a>
            </h3>
            <p className="subtitle">{val.description}</p>
            <a
              href={`${process.env.PUBLIC_URL}/blog-details-left-sidebar/${val.id}`}
              className="see-more-link"
            >
              SEE MORE
            </a>
          </div>
        </div>
      </div>
    </div>
  ));

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
                <h1>ALL COURSES</h1>
                <ul className="page-breadcrumb">
                  <li>
                    <a href="/">Home</a>
                  </li>
                  <li>Service</li>
                </ul>
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
};

export default Services;

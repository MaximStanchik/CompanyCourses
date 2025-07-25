import React, { Component } from "react";
import axios from "../../utils/axios";

class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      Courses: [],
    };
  }

  componentDidMount() {
    let user = JSON.parse(localStorage.getItem("id"));
    axios
      .get("/courses")
      .then((response) => {
        this.setState({ Courses: response.data });
        console.log(user);
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  render() {
    // Курс-лист
    let courseList = this.state.Courses.map((val, i) => {
      return (
        <li key={i}>
          <a href={`${process.env.PUBLIC_URL}/blog-left-sidebar/${val.id}`}>{val.name}</a>
        </li>
      );
    });

    // Популярные посты
    let popularPostData = [
      {
        postImage: "sidebar-blog-1.jpg",
        postTitle: "Making Sense of React Hooks?",
        postLink: "blog-details-left-sidebar",
        postDate: "30 October 2019",
      },
      {
        postImage: "sidebar-blog-2.jpg",
        postTitle: "Set Up Medium Feed in React",
        postLink: "blog-details-left-sidebar",
        postDate: "30 October 2019",
      },
      {
        postImage: "sidebar-blog-3.jpg",
        postTitle: "Five Things I Didn’t Know About Create-React-App",
        postLink: "blog-details-left-sidebar",
        postDate: "30 October 2019",
      },
    ];

    let popularPostDataList = popularPostData.map((val, i) => {
      return (
        <div className="single-sidebar-blog" key={i}>
          <div className="image">
            <a href={`${process.env.PUBLIC_URL}/${val.postLink}`}>
              <img src={`/assets/img/blog/${val.postImage}`} alt="" />
            </a>
          </div>
          <div className="content">
            <h5>
              <a href={`${process.env.PUBLIC_URL}/${val.postLink}`}>{val.postTitle}</a>
            </h5>
            <span>{val.postDate}</span>
          </div>
        </div>
      );
    });

    // Теги
    let tagData = [
      { tagLink: "blog-left-sidebar", tagName: "Web Development" },
      { tagLink: "blog-left-sidebar", tagName: "Mobile Apps" },
      { tagLink: "blog-left-sidebar", tagName: "Programming Languages" },
      { tagLink: "blog-left-sidebar", tagName: "Game Development" },
      { tagLink: "blog-left-sidebar", tagName: "Databases" },
      { tagLink: "blog-left-sidebar", tagName: "Software Testing" },
      { tagLink: "blog-left-sidebar", tagName: "Software Engineering" },
    ];

    let tagDataList = tagData.map((val, i) => {
      return (
        <li key={i}>
          <a href={`${process.env.PUBLIC_URL}/${val.tagLink}`}>{val.tagName}</a>
        </li>
      );
    });

    return (
      <div>
        <div className="sidebar-wrapper">
          <div className="sidebar">
            <h3 className="sidebar-title">Search</h3>
            <div className="sidebar-search">
              <form action="#">
                <input type="text" placeholder="Search" />
                <button>
                  <i className="ion-ios-search" />
                </button>
              </form>
            </div>
          </div>

          <div className="sidebar">
            <h3 className="sidebar-title">Courses</h3>
            <ul className="sidebar-list">{courseList}</ul>
          </div>

          <div className="sidebar">
            <h3 className="sidebar-title">Popular Post</h3>
            {popularPostDataList}
          </div>

          <div className="sidebar">
            <h3 className="sidebar-title">Popular Tags</h3>
            <ul className="sidebar-tag">{tagDataList}</ul>
          </div>
        </div>
      </div>
    );
  }
}

export default Sidebar;

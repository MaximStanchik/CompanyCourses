import React, { Component } from "react";
import { ToastContainer, toast } from "react-toastify";
import NavBar from "../components/NavBar";
import axios from "axios";
import VideoList from "./VideoList";
import VideoDetail from "./VideoDetail";
import { Fieldset } from "primereact/fieldset";
import "./BlogDetailsLeftSidebar.css";

class BlogDetailsLeftSidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      videos: [],
      user: JSON.parse(localStorage.getItem("userid")),
      userRole: JSON.parse(localStorage.getItem("userRole")),
      selectedVideo: null,
      enrolled: "ADD TO COURSE LIST",
      buttonclass: "btn btn-success",
      showRemoveButton: false,
    };

    this.onClick = this.onClick.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    this.onTextSubmit(this.props.match.params.id);
  }

  // 🔧 ВАЖНО: Обработка смены курса при переходе
  componentDidUpdate(prevProps) {
    if (prevProps.match.params.id !== this.props.match.params.id) {
      this.onTextSubmit(this.props.match.params.id);
    }
  }

  onClick(e) {
    e.preventDefault();
    const newTodo = {
      student: this.state.user,
      course: this.props.match.params.id,
      approved: true,
    };

    if (this.state.buttonclass === "btn btn-success") {
      axios
        .post(
          `https://localhost:9000/enrollmentbystudent/add/${this.props.match.params.id}`,
          newTodo
        )
        .then(() => {
          toast.success("Added successfully");
          this.setState({
            enrolled: "ALREADY ENROLLED",
            buttonclass: "btn btn-danger",
            showRemoveButton: true,
          });
        })
        .catch(() => {
          toast.error("Course not added");
        });
    } else {
      toast.error("Course already added");
    }
  }

  handleClick(e) {
    e.preventDefault();
    axios
      .delete(
        `https://localhost:9000/enrollmentbystudent/delete/${this.props.match.params.id}`
      )
      .then(() => {
        toast.success("Removed successfully");
        this.setState({
          enrolled: "ADD TO COURSE LIST",
          buttonclass: "btn btn-success",
          showRemoveButton: false,
        });
      })
      .catch(() => {
        toast.error("Course not removed");
      });
  }

  onTextSubmit = async (courseId) => {
    if (this.state.userRole === "USER") {
      this.setState({ addcourse: true });
    }

    try {
      const response = await axios.get(`https://localhost:9000/lectures?id=${courseId}`);
      const lectures = response.data;

      if (lectures.length > 0) {
        this.setState({
          videos: lectures,
          selectedVideo: lectures[0],
          status: "loading",
        });
      } else {
        this.setState({
          videos: [],
          selectedVideo: null,
          status: "No lectures found",
        });
      }

      // Enrollment check
      axios
        .get(
          `https://localhost:9000/checkenrollment?id=${this.state.user}&&courseid=${courseId}`
        )
        .then((result) => {
          if (result.data != undefined) {
            this.setState({
              enrolled: "ALREADY ENROLLED",
              buttonclass: "btn btn-danger",
              showRemoveButton: true,
            });
          }
        });
    } catch (error) {
      console.error("Failed to fetch lectures:", error);
    }
  };

  onVideoSelect = (video) => {
    this.setState({ selectedVideo: video });
  };

  render() {
    const { userRole, selectedVideo } = this.state;
    const showRemoveCourseButton = userRole !== "ADMIN";

    return (
      <div>
        <NavBar />

        {/*====================  project details page content ====================*/}
        <div className="page-wrapper section-space--inner--120">
          <div className="project-section">
            <div className="container">
              <div className="row">
                <div className="col-12 section-space--bottom--40">
                  <div className="ui container">
                    <div className="ui grid">
                      <div className="ui row">
                        <div className="eleven wide column">
                          <div className="video-details">
                            {selectedVideo && (
                              <>
                                <h2>{selectedVideo.title}</h2>
                                <VideoDetail video={selectedVideo} />
                                <br />
                                <div className="lecture-content">
                                  <Fieldset
                                    legend={
                                      <span
                                        style={{
                                          color: "#2196f3",
                                          fontSize: "60px",
                                          border: "#2196f3",
                                        }}
                                      >
                                        {` ${selectedVideo.name}`}
                                      </span>
                                    }
                                    toggleable
                                    style={{ padding: "3px" }}
                                  >
                                    <h5 className="lecture-content__text">
                                      {selectedVideo.content}
                                    </h5>
                                  </Fieldset>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="five wide column">
                          <VideoList
                            onVideoSelect={this.onVideoSelect}
                            videos={this.state.videos}
                          />
                          <div className="button-wrapper">
                            <ToastContainer />
                            {showRemoveCourseButton && (
                              <button
                                type="button"
                                style={
                                  this.state.addcourse ? {} : { display: "none" }
                                }
                                className={this.state.buttonclass}
                                onClick={this.onClick}
                              >
                                {this.state.enrolled}
                              </button>
                            )}
                            {this.state.showRemoveButton && (
                              <button
                                className="btn btn-danger"
                                style={{
                                  backgroundColor: "blue",
                                  width: "180px",
                                  height: "43px",
                                  marginTop: "10px",
                                }}
                                onClick={this.handleClick}
                              >
                                REMOVE COURSE
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-8 col-12 section-space--bottom--30 pl-30 pl-sm-15 pl-xs-15">
                  <div className="project-details">
                    <h2>
                      {selectedVideo
                        ? selectedVideo.title
                        : this.state.status}
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default BlogDetailsLeftSidebar;

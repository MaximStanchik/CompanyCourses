import React, { Component } from "react";
import axios from "../utils/axios";
import NavBar from "../components/NavBar";
import { Progress } from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ShowCourse = (props) => (
  <option key={props.todo.name} value={props.todo.name}>
    {props.todo.name}
  </option>
);
export default class Upload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedFile: null,
      loaded: 0,
      content: "",
      Courses: [],
      course: "",
      title: "",
    };
    this.onChangeCourse = this.onChangeCourse.bind(this);
    this.onChangeTitle = this.onChangeTitle.bind(this);
    this.onChangeContent = this.onChangeContent.bind(this);
  }

  componentDidMount() {
    axios
      .get("/courses/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((response) => {
        this.setState({ Courses: response.data });
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  CourseList() {
    const courseList = this.state.Courses.map(function (currentTodo, i) {
      return <ShowCourse todo={currentTodo} key={i} />;
    });
    courseList.unshift(
      <option key="default" value="" disabled>
        Select course...
      </option>
    );
    return courseList;
  }

  onChangeCourse(e) {
    this.setState({
      course: e.target.value,
    });
  }

  onChangeContent(e) {
    this.setState({
      content: e.target.value,
    });
  }

  onChangeTitle(e) {
    this.setState({
      title: e.target.value,
    });
  }

  checkMimeType = (event) => {
    //getting file object
    let files = event.target.files;
    //define message container
    let err = [];
    // list allow mime type
    const types = ["video/mp4", "video/mkv"];
    // loop access array
    for (var x = 0; x < files.length; x++) {
      // compare file type find doesn't matach
      if (types.every((type) => files[x].type !== type)) {
        // create error message and assign to container
        err[x] = files[x].type + " is not a supported format\n";
      }
    }
    for (var z = 0; z < err.length; z++) {
      // if message not same old that mean has error
      // discard selected file
      toast.error(err[z]);
      event.target.value = null;
    }
    return true;
  };
  maxSelectFile = (event) => {
    let files = event.target.files;
    if (files.length > 3) {
      const msg = "Only 3 images can be uploaded at a time";
      event.target.value = null;
      toast.warn(msg);
      return false;
    }
    return true;
  };
  checkFileSize = (event) => {
    let files = event.target.files;
    let size = 2000000000000000;
    let err = [];
    for (var x = 0; x < files.length; x++) {
      if (files[x].size > size) {
        err[x] = files[x].type + "is too large, please pick a smaller file\n";
      }
    }
    for (var z = 0; z < err.length; z++) {
      // if message not same old that mean has error
      // discard selected file
      toast.error(err[z]);
      event.target.value = null;
    }
    return true;
  };
  onChangeHandler = (event) => {
    var files = event.target.files;
    if (
      this.maxSelectFile(event) &&
      this.checkMimeType(event) &&
      this.checkFileSize(event)
    ) {
      // if return true allow to setState
      this.setState({
        selectedFile: files,
        loaded: 0,
      });
    }
  };
  onClickHandler = (event) => {
    event.preventDefault();

    if (this.state.course.trim() === "") {
      toast.error("Please select a course name.");
      return;
    }
    if (this.state.title.trim() === "") {
      toast.error("Please enter a title for the video.");
      return;
    }
    if (this.state.content.trim() === "") {
      toast.error("Please enter a description of the lecture.");
      return;
    }
    if (!this.state.selectedFile) {
      toast.error("Please select a video file.");
      return;
    }

    const form = new FormData();
    form.append("course", this.state.course);
    form.append("name", this.state.title);
    form.append("content", this.state.content);
    form.append("video", this.state.selectedFile[0]);

    axios
      .post(
        "/lecture/add",
        form,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          },
        },
        {
          onUploadProgress: (ProgressEvent) => {
            this.setState({
              loaded: (ProgressEvent.loaded / ProgressEvent.total) * 100,
            });
          },
        }
      )
      .then((res) => {
        toast.success("Upload success!");
      })
      .catch((err) => {
        if (err.response.status === 409) {
          toast.error("Lecture with this name already exists in this course");
        }
        if (
          err.response &&
          (err.response.status === 401 || err.response.status === 403)
        ) {
          window.location.href = "/login";
        } else {
          toast.error("Upload fail");
        }
      });
  };

  render() {
    var message = "You selected " + this.state.course;
    return (
      <div>
        <NavBar />
        <div class="container">
          <div class="row">
            <div class="offset-md-3 col-md-6">
              <form
                action="lectures/localupload"
                method="POST"
                encType="multipart/form-data"
              >
                <br></br>
                <br></br>
                <h1 className="h3 mb-3 font-weight-normal">Add Lecture</h1>
                <div class="form-group files">
                  <div className="form-group">
                    <label>Course name: </label>
                    <select
                      className="form-control"
                      name="course"
                      id="ada"
                      onChange={this.onChangeCourse}
                      value={this.state.course || ""}
                    >
                      {this.CourseList()}
                    </select>
                    <p>{message}</p>
                  </div>
                  <div className="form-group">
                    <label>Lecture title: </label>
                    <input
                      type="text"
                      className="form-control"
                      value={this.state.title}
                      onChange={this.onChangeTitle}
                    />
                  </div>

                  <label>Upload your file: </label>
                  <input
                    type="file"
                    name="file"
                    class="form-control"
                    onChange={this.onChangeHandler}
                  />
                </div>
                <div className="form-group">
                  <label>Content: </label>
                  <textarea
                    className="form-control"
                    value={this.state.content}
                    onChange={this.onChangeContent.bind(this)}
                  ></textarea>
                </div>
                <div class="form-group">
                  <ToastContainer />
                  <Progress max="100" color="success" value={this.state.loaded}>
                    {Math.round(this.state.loaded, 2)}%
                  </Progress>
                </div>

                <button
                  type="button"
                  class="btn btn-success btn-block"
                  onClick={this.onClickHandler}
                >
                  Add a lecture
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

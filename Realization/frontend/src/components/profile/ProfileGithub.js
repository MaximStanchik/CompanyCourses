import React, { Component } from "react";
import PropTypes from "prop-types";

class ProfileGithub extends Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 7,
      sort: "created: asc",
      repos: [],
    };
  }

  componentDidMount() {
    const { username } = this.props;
    const { count, sort } = this.state;
  
    // Очистка от ненужных частей URL
    const cleanUsername = username
      .replace("https://github.com/", "")
      .replace("http://github.com/", "")
      .replace("www.github.com/", "")
      .replace("github.com/", "")
      .trim();
  
    // Теперь используем очищенное имя
    fetch(`https://api.github.com/users/${cleanUsername}/repos?per_page=${count}&sort=${sort}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          this.setState({ repos: data });
        }
      })
      .catch((err) => console.error("GitHub API error:", err));
  }

  render() {
    const { repos } = this.state;

    const repoItems = repos.map((repo) => (
      <div key={repo.id} className="card card-body mb-2">
        <div className="row">
          <div className="col-md-6">
            <h4>
              <a
                href={repo.html_url}
                className="text-info"
                target="_blank"
                rel="noopener noreferrer"
              >
                {repo.name}
              </a>
            </h4>
            <p>{repo.description}</p>
          </div>
          <div className="col-md-6">
            <span className="badge badge-info mr-1">
              Stars: {repo.stargazers_count}
            </span>
            <span className="badge badge-secondary mr-1">
              Watchers: {repo.watchers_count}
            </span>
            <span className="badge badge-success">
              Forks: {repo.forks_count}
            </span>
          </div>
        </div>
      </div>
    ));

    return (
      <div ref="myRef">
        <hr />
        <h3 className="mb-4">Latest Github Repos</h3>
        {repoItems}
      </div>
    );
  }
}

ProfileGithub.propTypes = {
  username: PropTypes.string.isRequired,
};

export default ProfileGithub;

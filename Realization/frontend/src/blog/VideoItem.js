import React from "react";

const VideoItem = ({ video, onVideoSelect, index }) => {
  return (
    <div onClick={() => onVideoSelect(video)} className="item" style={{ cursor: "pointer" }}>
      <div className="content">
        <div className="header">
          #{index + 1} — {video.title}
        </div>
      </div>
    </div>
  );
};


export default VideoItem;

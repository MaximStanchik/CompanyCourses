import React from "react";
import VideoItem from "./VideoItem";

const VideoList = ({ videos, onVideoSelect }) => {  // массив видео, и onVideoSelect - обработчик события выбора видео.
  const renderedList = videos.map((v, index) => (
    <VideoItem
      key={v.id}
      onVideoSelect={onVideoSelect}
      video={v}
      index={index}
    />
  ));
  

  return <div className="ui relaxed divided list">{renderedList}</div>;
};

export default VideoList;
import React from "react";
import "./VideoDetail.css"; // добавь если нужно

function VideoDetail({ video }) {
  if (!video) {
    return <p>Загрузка видео...</p>;
  }

  const videoSrc = `https://localhost:9000${video.videoLink}`;
  console.log("video.videoLink:", video.videoLink);
  console.log("videoSrc:", videoSrc);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h2>{video.title}</h2>
      <video
  key={video.videoLink} // ⬅️ это заставляет <video> пересоздаться при смене видео
  className="video-player"
  controls
  autoPlay
  crossOrigin="anonymous"
  onLoadedData={() => console.log("✅ Видео загружено")}
  onError={(e) => {
    const videoElement = e.target;
    console.error("❌ Ошибка при загрузке видео");
    console.log("source: ", videoElement.currentSrc);
    console.log("error details: ", e);
  }}
>
  <source src={videoSrc} type="video/mp4" />
  Ваш браузер не поддерживает видео.
</video>

    </div>
  );
}

export default VideoDetail;

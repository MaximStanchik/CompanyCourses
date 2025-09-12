import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../utils/axios';
import { getVideoUrl } from '../utils/minioUtils';
import "./VideoDetail.css"; // добавь если нужно

function VideoDetail({ video }) {
  if (!video) {
    return <p>Загрузка видео...</p>;
  }

  const videoSrc = video.videoLink ? getVideoUrl(video.videoLink) : null;
  console.log("video.videoLink:", video.videoLink);
  console.log("videoSrc:", videoSrc);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h2>{video.title}</h2>
      
      {/* Кнопка для тестирования MinIO */}
      <button 
        onClick={() => {
          console.log("🧪 Тестируем MinIO доступ");
          console.log("video.videoLink:", video.videoLink);
          console.log("videoSrc:", videoSrc);
          
          // Попробуем открыть видео в новой вкладке
          if (videoSrc) {
            window.open(videoSrc, '_blank');
          }
        }}
        style={{ 
          marginBottom: '10px', 
          padding: '5px 10px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        🧪 Тест MinIO
      </button>
      
      <video
  key={video.videoLink} // ⬅️ это заставляет <video> пересоздаться при смене видео
  className="video-player"
  controls
  autoPlay
  crossOrigin="anonymous"
  onLoadStart={() => console.log("🚀 Начало загрузки видео:", videoSrc)}
  onProgress={() => console.log("📊 Прогресс загрузки видео")}
  onLoadedData={() => console.log("✅ Видео загружено")}
  onError={(e) => {
    const videoElement = e.target;
    console.error("❌ Ошибка при загрузке видео");
    console.log("source: ", videoElement.currentSrc);
    console.log("error details: ", e);
    console.log("networkState: ", videoElement.networkState);
    console.log("readyState: ", videoElement.readyState);
    console.log("error code: ", videoElement.error?.code);
    console.log("error message: ", videoElement.error?.message);
    
    // Попробуем получить больше информации об ошибке
    if (videoElement.error) {
      const error = videoElement.error;
      console.error("Video error details:", {
        code: error.code,
        message: error.message,
        MEDIA_ERR_ABORTED: error.MEDIA_ERR_ABORTED,
        MEDIA_ERR_NETWORK: error.MEDIA_ERR_NETWORK,
        MEDIA_ERR_DECODE: error.MEDIA_ERR_DECODE,
        MEDIA_ERR_SRC_NOT_SUPPORTED: error.MEDIA_ERR_SRC_NOT_SUPPORTED
      });
    }
  }}
>
  <source src={videoSrc} type="video/mp4" />
  Ваш браузер не поддерживает видео.
</video>

    </div>
  );
}

export default VideoDetail;

import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPause, faPlay, faCheck, faExclamationTriangle, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const FileUploadProgress = ({ 
  file, 
  onUploadComplete, 
  onUploadError, 
  onCancel,
  onSendMessage,
  dark = false 
}) => {
  const { t } = useTranslation();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('uploading'); // uploading, paused, completed, error, cancelled
  const [uploadId, setUploadId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [startTime, setStartTime] = useState(Date.now());
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [caption, setCaption] = useState('');
  const [showSendButton, setShowSendButton] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  
  const abortControllerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const lastProgressUpdateRef = useRef(0);

  // Форматирование размера файла
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Форматирование времени
  const formatTime = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}с`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}м ${Math.round(seconds % 60)}с`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}ч ${minutes}м`;
  };

  // Расчет скорости загрузки и оставшегося времени
  const calculateProgressStats = (currentProgress) => {
    const now = Date.now();
    const elapsed = (now - startTime) / 1000;
    
    if (currentProgress > 0 && elapsed > 0) {
      const bytesPerSecond = (file.size * currentProgress / 100) / elapsed;
      setUploadSpeed(bytesPerSecond);
      
      if (currentProgress < 100) {
        const remainingBytes = file.size * (1 - currentProgress / 100);
        const remainingSeconds = remainingBytes / bytesPerSecond;
        setEstimatedTime(remainingSeconds);
      }
    }
  };

  // Начинаем загрузку файла
  const startUpload = async () => {
    try {
      setUploadStatus('uploading');
      setStartTime(Date.now());
      
      // Показываем уведомление для больших файлов
      if (file.size > 100 * 1024 * 1024) { // Больше 100MB
        console.log(`🚀 Начинаем загрузку большого файла: ${file.name} (${formatFileSize(file.size)})`);
      }
      
      // Создаем AbortController для возможности отмены
      abortControllerRef.current = new AbortController();
      
      const formData = new FormData();
      formData.append('file', file);
      
      // Используем обычный endpoint для загрузки
      const response = await fetch('https://localhost:9000/api/files/upload', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setUploadId(result.uploadId);
      
      // Загрузка завершена
      setUploadStatus('completed');
      setUploadProgress(100);
      setShowSendButton(true);
      setUploadResult(result);
      onUploadComplete && onUploadComplete(result);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        setUploadStatus('cancelled');
        onCancel && onCancel();
      } else {
        console.error('Upload error:', error);
        setUploadStatus('error');
        setErrorMessage(error.message);
        onUploadError && onUploadError(error);
      }
    }
  };

  // Отмена загрузки
  const cancelUpload = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (uploadId) {
      try {
        await fetch(`https://localhost:9000/api/files/upload/${uploadId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Error cancelling upload:', error);
      }
    }
    
    setUploadStatus('cancelled');
    clearInterval(progressIntervalRef.current);
    onCancel && onCancel();
  };

  // Пауза/возобновление загрузки
  const togglePause = () => {
    if (uploadStatus === 'uploading') {
      setUploadStatus('paused');
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    } else if (uploadStatus === 'paused') {
      startUpload(); // Возобновляем загрузку
    }
  };

  // Отправка сообщения с файлом
  const handleSendMessage = () => {
    if (onSendMessage && uploadResult) {
      onSendMessage({
        fileUrl: uploadResult.url,
        fileType: uploadResult.type,
        fileName: uploadResult.name,
        fileSize: uploadResult.size,
        caption: caption.trim()
      });
    }
  };

  // Автоматически начинаем загрузку при монтировании
  useEffect(() => {
    if (file) {
      startUpload();
    }
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [file]);

  // Получаем цвет и иконку для статуса
  const getStatusInfo = () => {
    switch (uploadStatus) {
      case 'uploading':
        return { color: '#2196F3', icon: null, text: t('users.loading') };
      case 'paused':
        return { color: '#FF9800', icon: faPlay, text: t('fileUpload.paused') };
      case 'completed':
        return { color: '#4CAF50', icon: faCheck, text: t('fileUpload.completed') };
      case 'error':
        return { color: '#F44336', icon: faExclamationTriangle, text: t('fileUpload.error') };
      case 'cancelled':
        return { color: '#9E9E9E', icon: faTimes, text: t('fileUpload.cancelled') };
      default:
        return { color: '#2196F3', icon: null, text: t('fileUpload.preparing') };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div style={{
      background: dark ? '#2a2a2a' : '#f8f9fa',
      border: `2px solid ${statusInfo.color}`,
      borderRadius: '12px',
      padding: '16px',
      margin: '12px 0',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Заголовок с именем файла и статусом */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: '600',
            fontSize: '14px',
            color: dark ? '#ffffff' : '#333333',
            marginBottom: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {file.name}
          </div>
          <div style={{
            fontSize: '12px',
            color: dark ? '#cccccc' : '#666666',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{formatFileSize(file.size)}</span>
            {file.size > 100 * 1024 * 1024 && (
              <span style={{
                background: '#FF9800',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '500'
              }}>
                {t('fileUpload.big_file')}
              </span>
            )}
            {uploadStatus === 'uploading' && (
              <span style={{
                background: '#2196F3',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '500'
              }}>
                {t('fileUpload.ready_to_send')}
              </span>
            )}
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            fontSize: '12px',
            color: statusInfo.color,
            fontWeight: '500'
          }}>
            {statusInfo.text}
          </span>
          {statusInfo.icon && (
            <FontAwesomeIcon 
              icon={statusInfo.icon} 
              style={{ color: statusInfo.color, fontSize: '14px' }}
            />
          )}
        </div>
      </div>

      {/* Сообщение об ошибке */}
      {errorMessage && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          background: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#c62828'
        }}>
          {errorMessage}
        </div>
      )}

      {/* Прогресс-бар */}
      <div style={{
        width: '100%',
        height: '8px',
        background: dark ? '#404040' : '#e9ecef',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '12px'
      }}>
        <div style={{
          width: `${uploadProgress}%`,
          height: '100%',
          background: statusInfo.color,
          borderRadius: '4px',
          transition: 'width 0.3s ease',
          position: 'relative'
        }}>
          {/* Анимация загрузки */}
          {uploadStatus === 'uploading' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: 'shimmer 1.5s infinite'
            }} />
          )}
        </div>
      </div>

      {/* Статистика загрузки */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: dark ? '#cccccc' : '#666666',
        marginBottom: '12px'
      }}>
        <span>{Math.round(uploadProgress)}%</span>
        <span>
          {uploadSpeed > 0 && `${formatFileSize(uploadSpeed)}${t('fileUpload.per_second')}`}
        </span>
        <span>
          {estimatedTime && estimatedTime > 0 && `${t('fileUpload.remaining')} ${formatTime(estimatedTime)}`}
        </span>
      </div>

      {/* Информация о загрузке */}
      {uploadStatus === 'uploading' && (
        <div style={{
          background: dark ? '#1a1a1a' : '#e3f2fd',
          border: `1px solid ${dark ? '#404040' : '#2196F3'}`,
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '12px',
          textAlign: 'center'
        }}>
          <FontAwesomeIcon 
            icon={faPlay} 
            style={{ color: '#2196F3', fontSize: '16px', marginRight: '8px' }}
          />
          <span style={{
            fontSize: '14px',
            color: dark ? '#ffffff' : '#1976d2',
            fontWeight: '500'
          }}>
            {t('fileUpload.uploading_to_minio')}
          </span>
        </div>
      )}
        {/* Кнопки управления загрузкой */}
        {(uploadStatus === 'uploading' || uploadStatus === 'paused') && (
          <>
            {/* Показываем кнопку паузы только для файлов меньше 100MB */}
            {file.size <= 100 * 1024 * 1024 && (
              <button
                onClick={togglePause}
                style={{
                  background: uploadStatus === 'uploading' ? '#FF9800' : '#2196F3',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FontAwesomeIcon 
                  icon={uploadStatus === 'uploading' ? faPause : faPlay} 
                  style={{ fontSize: '12px' }}
                />
                {uploadStatus === 'uploading' ? t('fileUpload.pause') : t('fileUpload.continue')}
              </button>
            )}
            
            <button
              onClick={cancelUpload}
              style={{
                background: '#F44336',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <FontAwesomeIcon icon={faTimes} style={{ fontSize: '12px' }} />
              {t('fileUpload.cancel')}
            </button>
          </>
        )}


     {/* Кнопки управления */}
     <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end'
      }}>
        
        {/* Кнопка отправки сообщения */}
        {showSendButton && (
          <button
            onClick={handleSendMessage}
            style={{
              background: '#4CAF50',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: '12px' }} />
            {t('fileUpload.send')}
          </button>
        )}
      </div>

      {/* CSS анимации */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default FileUploadProgress;
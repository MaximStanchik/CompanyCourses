import React, { useEffect, useState } from "react";
import socket from "./../utils/ws";
import axios from "../utils/axios";
import useTheme from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';


function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZone: "Europe/Minsk",
    hour12: false,
  };
  return date.toLocaleString("en-US", options);
}

function NotificationItem({ notification, theme }) {
  const { t } = useTranslation();
  const [translatedTitle, setTranslatedTitle] = useState(notification.title);
  const [translatedMessage, setTranslatedMessage] = useState(notification.content);
  
  useEffect(() => {
    const translateNotification = () => {
      try {
        // Проверяем, является ли заголовок ключом перевода
        const translationKeys = [
          'step_modified', 'step_added', 'step_deleted',
          'lesson_modified', 'lesson_added', 'lesson_deleted',
          'module_modified', 'module_added', 'module_deleted',
          'course_updated', 'profile_updated'
        ];
        
        if (translationKeys.includes(notification.title)) {
          // Это ключ перевода, получаем перевод из translations.json
          const titleKey = `notifications.${notification.title}`;
          const messageKey = `notifications.${notification.title}_message`;
          
          let title = t(titleKey);
          let message = t(messageKey);
          
          // Заменяем параметры в сообщении, если они есть
          if (notification.content) {
            // Извлекаем параметры из оригинального сообщения
            const lessonMatch = notification.content.match(/"([^"]+)"/g);
            if (lessonMatch && lessonMatch.length >= 2) {
              const lessonName = lessonMatch[0].replace(/"/g, '');
              const stepName = lessonMatch[1].replace(/"/g, '');
              
              message = message
                .replace('{lessonName}', lessonName)
                .replace('{stepTitle}', stepName);
            }
          }
          
          setTranslatedTitle(title);
          setTranslatedMessage(message);
        } else {
          // Это обычный текст, оставляем как есть
          setTranslatedTitle(notification.title);
          setTranslatedMessage(notification.content);
        }
      } catch (error) {
        console.error('Error translating notification:', error);
        setTranslatedTitle(notification.title);
        setTranslatedMessage(notification.content);
      }
    };
    
    translateNotification();
  }, [notification, t]);
  
  const formattedDate = formatDate(notification.date);
  const isDark = theme === 'dark';
  
  return (
    <div style={{ overflow: "auto", marginBottom: 50 }}>
      <div
        className="col-lg-10 col-md-6 col-12"
        style={{ margin: "0 auto", textAlign: "center" }}
      >
        <div className="service-grid-item" style={{
          background: isDark ? '#23272a' : '#f2f1f2',
          color: isDark ? '#eaf4fd' : '#23272f',
          padding: '14px',
          borderRadius: 12,
          boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.45)' : '0 2px 8px rgba(0,0,0,0.13)',
          marginBottom: 6,
          transition: 'box-shadow 0.7s ease, background 0.2s',
        }}>
          <div className="service-grid-item__image">
            <div className="service-grid-item__content">
              <h3 className="title" style={{ fontSize: 17, marginBottom: 6 }}>{translatedTitle}</h3>
              <p className="subtitle" style={{ fontSize: 13, color: isDark ? '#b6d4fe' : '#888', margin: 0 }}>{translatedMessage}</p>
              <p className="subtitle" style={{ fontSize: 11, color: isDark ? '#b6d4fe' : '#888', margin: 0, marginTop: 4 }}>{formattedDate}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/notifications");
        setNotifications(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    socket.on("new-notification", (data) => {
      setNotifications((notifications) => [
        ...notifications,
        data.createdNotification,
      ]);
    });
  }, []);

  const notificationList = notifications.map((notification, i) => (
    <NotificationItem key={i} notification={notification} theme={theme} />
  ));

  return <div style={{ background: theme === 'dark' ? '#181a1b' : '#fff', minHeight: '100vh', padding: '16px 0' }}>{notificationList}</div>;
}

export default NotificationList;

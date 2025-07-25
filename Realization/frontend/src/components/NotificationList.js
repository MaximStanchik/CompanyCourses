import React, { useEffect, useState } from "react";
import socket from "./../utils/ws";
import axios from "../utils/axios";
import useTheme from '../hooks/useTheme';

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

function NotificationItem({ content, date, theme }) {
  const formattedDate = formatDate(date);
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
              <h3 className="title" style={{ fontSize: 17, marginBottom: 6 }}>{content}</h3>
              <p className="subtitle" style={{ fontSize: 13, color: isDark ? '#b6d4fe' : '#888', margin: 0 }}>{formattedDate}</p>
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

  const notificationList = notifications.map((val, i) => (
    <NotificationItem key={i} content={val.content} date={val.date} theme={theme} />
  ));

  return <div style={{ background: theme === 'dark' ? '#181a1b' : '#fff', minHeight: '100vh', padding: '16px 0' }}>{notificationList}</div>;
}

export default NotificationList;

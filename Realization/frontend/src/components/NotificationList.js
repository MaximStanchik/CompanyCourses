import React, { useEffect, useState } from "react";
import socket from "./../utils/ws";
import axios from "../utils/axios";

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

function NotificationItem({ content, date }) {
  const formattedDate = formatDate(date);

  return (
    <div style={{ overflow: "auto", height: "17vh" }}>
      <div
        className="col-lg-10 col-md-6 col-12 section-space--bottom--30"
        style={{ margin: "0 auto", textAlign: "center" }}
      >
        <div className="service-grid-item">
          <div className="service-grid-item__image">
            <div className="service-grid-item__content">
              <h3 className="title">{content}</h3>
              <p className="subtitle">{formattedDate}</p>
            </div>
          </div>
        </div>
        <style jsx>{`
          .service-grid-item {
            background-color: #f2f1f2;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            transition: box-shadow 0.7s ease;
          }

          .service-grid-item:hover {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.6);
          }

          .title {
            font-size: 18px;
            margin-bottom: 10px;
          }

          .subtitle {
            font-size: 14px;
            color: #888;
          }
        `}</style>
      </div>
    </div>
  );
}

function NotificationList() {
  const [notifications, setNotifications] = useState([]);

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
    <NotificationItem key={i} content={val.content} date={val.date} />
  ));

  return <>{notificationList}</>;
}

export default NotificationList;

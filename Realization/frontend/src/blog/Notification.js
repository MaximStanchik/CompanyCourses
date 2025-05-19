import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Progress } from "reactstrap";
import NavBar from "../components/NavBar";
import axios from "../utils/axios";
import DataList from "../components/NotificationList";

function Notification() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/notifications");
        setData(response.data);
      } catch (error) {
        // Обработка ошибки получения данных
        console.log(error);
        toast.error("Error fetching notifications");
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {/* Navigation bar */}
      <NavBar />
      {/* breadcrumb */}
      {/*====================  breadcrumb area ====================*/}
      <div className="breadcrumb-area breadcrumb-bg">
        <div className="container">
          <div className="row">
            <div className="col">
              <div className="page-banner text-center">
                <h1>ALL NOTIFICATIONS</h1>
                <ul className="page-breadcrumb">
                  <li>
                    <a href="/">Home</a>
                  </li>
                  <li>Notifications</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/*====================  End of breadcrumb area  ====================*/}

      {/*====================  notifications page content ====================*/}
      <div className="page-wrapper section-space--inner--120">
        {/*Notification section start*/}
        <div className="service-section">
          <div className="container">
            <DataList data={data} />
          </div>
        </div>
        {/*Notification section end*/}
      </div>
      {/*====================  End of notifications page content  ====================*/}
    </div>
  );
}

export default Notification;

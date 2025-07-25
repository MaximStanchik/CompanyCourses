import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Progress } from "reactstrap";
import NavBar from "../components/NavBar";
import axios from "../utils/axios";
import DataList from "../components/NotificationList";
import i18n from "../i18n";
import Footer from "../components/Footer";
import "../App.css"; // Ensure global styles are imported

function Notification() {
  const [data, setData] = useState([]);
  const t = i18n.t.bind(i18n);

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
    <div className="page-flex-wrapper">
      {/* Navigation bar */}
      <NavBar />
      {/*====================  notifications page content ====================*/}
      <div className="main-content-flex page-wrapper section-space--inner--120">
        {/*Notification section start*/}
        <div className="service-section">
          <div className="container">
            <DataList data={data} />
          </div>
        </div>
        {/*Notification section end*/}
      </div>
      {/*====================  End of notifications page content  ====================*/}
      <Footer />
    </div>
  );
}

export default Notification;

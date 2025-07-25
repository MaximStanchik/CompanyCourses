//set default header for axios
import axios from "axios";
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`; // Authorization - это ключ, token - это значение
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};

export default setAuthToken;

import axios from "../utils/axios";
import setAuthToken from "../utils/setAuthToken";
import jwt_decode from "jwt-decode";
import { GET_ERRORS, SET_CURRENT_USER } from "./types";

// Проверка существования email
export const checkEmailExists = (email) => {
    return axios.get(`/auth/check-email?email=${email}`);
};

// Регистрация
export const registerUser = (userData, history) => async (dispatch) => {
  const payload = {
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
      username: userData.username,
      name: userData.name
  };
  console.log("Отправка на регистрацию:", payload);
  try {
      await axios.post("/auth/registration", payload);
      history.push("/email-verification-pending");
  } catch (err) {
      console.error("Ошибка регистрации:", err.response?.data || err.message);
      dispatch({
          type: GET_ERRORS,
          payload: err.response?.data || { error: "Ошибка регистрации" },
      });
  }
};

// Логин
export const loginUser = (userData) => async (dispatch) => {
    try {
        const res = await axios.post("/auth/login", userData);
        const { token } = res.data;
        localStorage.setItem("jwtToken", token);
        setAuthToken(token);
        const decoded = jwt_decode(token);
        dispatch(setCurrentUser(decoded));
    } catch (err) {
        console.error("Ошибка входа:", err.response?.data || err.message);
        dispatch({ type: GET_ERRORS, payload: err.response?.data || { error: "Ошибка входа" } });
    }
};

// Установить текущего пользователя
export const setCurrentUser = (decoded) => ({ type: SET_CURRENT_USER, payload: decoded });

// Выход
export const logoutUser = () => (dispatch) => {
    localStorage.removeItem("jwtToken");
    setAuthToken(false);
    dispatch(setCurrentUser({}));
};
import axios from "../utils/axios";
import setAuthToken from "../utils/setAuthToken";
import jwt_decode from "jwt-decode";
import { GET_ERRORS, SET_CURRENT_USER } from "./types";

export const registerUser = (userData, history) => (dispatch) => {
  axios
    .post("/auth/registration", userData)
    .then((res) => history.push("/login"))
    .catch((err) =>
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data,
      })
    );
};

export const loginUser = (userData) => (dispatch) => {
  axios
    .post("/auth/login", userData)
    .then((res) => {
      const { token } = res.data; // извлекает токен из ответа сервера, если запрос успешный
      const decoded = jwt_decode(token); // декодирует полученный токен
      const { id, roles } = decoded; // извлекает идентификатор пользователя
      localStorage.setItem("jwtToken", token); // сохраняет токен в локальном хранилище
      setAuthToken(token); // устанавливает токен в заголовок аутентификации
      dispatch(setCurrentUser({ id, roles })); // устанавливает текущего пользователя с помощью лишь идентификатора пользователя
      console.log(token);
    })
    .catch((err) => {
      if (err.response && err.response.data) {
        dispatch({
          type: GET_ERRORS,
          payload: err.response.data,
        });
      }
    });
};

export const setCurrentUser = (token) => {
  return {
    type: SET_CURRENT_USER,
    payload: token,
  };
};

export const logoutUser = () => (dispatch) => {
  localStorage.removeItem("jwtToken"); // удаляем токен из local storage
  setAuthToken(false); // очищаем заголовок аутентификации, чтобы указать, что пользователь не аутентифицирован
  dispatch(setCurrentUser({})); // передаем пустой объект в качестве текущего пользователя
};

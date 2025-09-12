import axios from "../utils/axios";

import {
  GET_PROFILE,
  GET_PROFILES,
  PROFILE_LOADING,
  CLEAR_CURRENT_PROFILE,
  GET_ERRORS,
  SET_CURRENT_USER,
} from "./types";

// Get current profile
export const getCurrentProfile = () => (dispatch) => {
  dispatch(setProfileLoading());
  const token = localStorage.getItem("jwtToken");
  console.log("Token being sent:", token);
  
  axios
    .get("/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) =>
      dispatch({
        type: GET_PROFILE,
        payload: res.data,
      })
    )
    .catch((err) => {
      console.error("Error fetching profile:", err.response?.data || err.message);
      
      // Если профиль не найден (404), это нормально - пользователь может его создать
      if (err.response?.status === 404) {
        console.log("Profile not found - user can create one");
        dispatch({
          type: GET_PROFILE,
          payload: {},
        });
      } else {
        // Для других ошибок показываем пустой профиль
        dispatch({
          type: GET_PROFILE,
          payload: {},
        });
      }
    });
};


// Get profile by handle
export const getProfileByHandle = (handle) => (dispatch) => {
  dispatch(setProfileLoading());
  axios
    .get(`/profile/handle/${handle}`)
    .then((res) =>
      dispatch({
        type: GET_PROFILE,
        payload: res.data,
      })
    )
    .catch((err) =>
      dispatch({
        type: GET_PROFILE,
        payload: null,
      })
    );
};

// Create Profile
export const createProfile = (profileData, history) => dispatch => {
  axios.post("/profile", profileData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("jwtToken")}`
    }
  })
    .then(res => {
      dispatch({
        type: GET_PROFILE,
        payload: res.data,
      });

      // Очистка предыдущих ошибок
      dispatch({
        type: GET_ERRORS,
        payload: {}, // очищаем ошибки
      });

      // Остаёмся на текущей странице после сохранения
    })
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data,
      })
    );
};

// Get all profiles
export const getProfiles = () => (dispatch) => {
  dispatch(setProfileLoading());
  axios
    .get("/profile/all")
    .then((res) =>
      dispatch({
        type: GET_PROFILES,
        payload: res.data,
      })
    )
    .catch((err) =>
      dispatch({
        type: GET_PROFILES,
        payload: null,
      })
    );
};

// Profile loading
export const setProfileLoading = () => {
  return {
    type: PROFILE_LOADING,
  };
};

// Clear profile
export const clearCurrentProfile = () => {
  return {
    type: CLEAR_CURRENT_PROFILE,
  };
};

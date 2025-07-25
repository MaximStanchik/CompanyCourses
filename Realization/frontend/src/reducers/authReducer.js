import { SET_CURRENT_USER } from "../actions/types";
import isEmpty from "../validation/is-empty";

//проверяем пустой ли объект
const initialState = {
  isAuthenticated: false, //проверяем авторизован ли пользователь
  users: {},
};

export default function (state = initialState, action) {    //action - это объект который мы получили из authActions.js
  switch (action.type) {
    case SET_CURRENT_USER:
      return {
        ...state,
        isAuthenticated: !isEmpty(action.payload),
        users: action.payload,                              // action.payload - это данные которые мы получили из токена
      };
    default:
      return state;
  }
}

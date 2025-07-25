import { GET_ERRORS, CLEAR_ERRORS } from "../actions/types";

//Initial state for error reducer
const initialState = {};

export const errorReducer = function(state = initialState, action) {
  switch (action.type) {
    case GET_ERRORS:
      return action.payload;
    default:
      return state;
  }
};

export default errorReducer;

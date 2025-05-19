import { createStore, applyMiddleware, compose } from "redux";
import thunk from "redux-thunk"; // Thunk позволяет писать асинхронные действия (actions) в Redux.
import rootReducer from "./reducers"; // index.js file (объединяет все редьюсеры в единый корневой редьюсер)

//initital state for store
const initialState = {};

const middleware = [thunk];

//1st arg: reducer, 2nd arg: state, 3rd: enhancer
const store = createStore(
  rootReducer,
  initialState,

  compose(applyMiddleware(...middleware))
);

export default store;

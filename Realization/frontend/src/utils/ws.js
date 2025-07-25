import { io } from "socket.io-client";

// "undefined" means the URL will be computed from the window.location object
const URL = "https://localhost:9000";
const socket = io(URL);
export default socket;

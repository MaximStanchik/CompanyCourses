import { io } from "socket.io-client";

const URL = "https://localhost:9000";
const socket = io(URL);
export default socket;

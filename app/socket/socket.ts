import { io } from "socket.io-client";
const socketUrl = process.env.EXPRESS_SOCKET_IO_SERVER_URL;
export const socket = io("http://localhost:5000");
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/auth.route.js';
import chatRoutes from './src/routes/chat.route.js';
import { initializeSocket } from './src/services/socket.service.js';
import http from 'http';


connectDB();

dotenv.config();

const app = express();


const corsOptions = {
  origin: "*",
  credentials: true,
}

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(cookieParser());

//create server
const server = http.createServer(app);

//initialize socket
const io= initializeSocket(server);

//apply socket middleware
app.use((req, res, next) => {
  req.io = io;
 req.socketUserMap = io.socketUserMap;
 next();
})


app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
// app.use('/api/status', statusRoutes)

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

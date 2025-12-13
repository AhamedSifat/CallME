import {Server} from "socket.io";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

//map to store online user ->userId, socketId
const onlineUsers = new Map();

//Map to track typing status ->userId -> [conversation]: boolean
const typingUsers = new Map();


const initializeSocket = (server) => {
    const io = new Server(server, {
      cors: {
        origin: "*",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        
      },
      pingTimeout: 60000,
    });


    //when a new socket connection is established
    io.on("connection", (socket) => {
      console.log(`a user is  connected: ${socket.id}`);

      let userId= null;

      //handle user connection and mark user as online
      socket.on("user_connected", async (connectingUserId) => {
       try {

        userId= connectingUserId;
        onlineUsers.set(userId, socket.id);
        socket.join(userId) //join a personal room for direct emit

        //update user status to online
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date()
        });

       //notify all users that this user is online
        io.emit("user_status", {userId, isOnline: true});
        
       } catch (error) {
        console.log(`error handling user connection: ${error}`);
       }
      });

      //return online status of requested User

      socket.on('get_user_status', (requestedUserId, callback) => {
        const isOnline = onlineUsers.has(requestedUserId);
        callback({
          userId: requestedUserId,
          isOnline,
          lastSeen: isOnline ? new Date() : null
        })
        
      })


      //forward message to receiver if online 
      socket.on("send_message", async (message) => {
        try {
          const receiverSocketId = onlineUsers.get(message.receiver?.id);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("receive_message", message);
          }
        } catch (error) {
          console.log(`error forwarding message: ${error}`);
          socket.emit("message_error", {error: "Failed to forward message"});
        }
      })

    


      
     
    });


}
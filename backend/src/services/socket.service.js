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

    
        //update message as read and notify sender
      socket.on("message_read", async (messageIds, senderId) => {
        try {
         await Message.updateMany({_id: {$in: messageIds}}, {$set: {messageStatus: "read"}})

         const senderSocketId = onlineUsers.get(senderId);
         if (senderSocketId) {
          messageIds.forEach((messageId) => {
            io.to(senderSocketId).emit("message_status_update", {
              messageId,
              messageStatus: "read"
            });
          })
         }
        } catch (error) {
         console.log(`error updating message status: ${error}`);
        }
      })

       //handle typing start event and auto-stop typing after 3 second
      socket.on("typing_start", (conversationId, receiverId) => {
        if(!userId || !receiverId || !conversationId) return;

        if(!typingUsers.has(userId)) {
          typingUsers.set(userId, {});
        }

        const userTyping = typingUsers.get(userId);
        userTyping[conversationId] = true;

        //clear any existing timeout 
        if(userTyping[`${conversationId}_timeout`]) {
          clearTimeout(userTyping[`${conversationId}_timeout`]);
        }

        //auto stop typing after 3 second
        userTyping[`${conversationId}_timeout`] = setTimeout(() => {
          userTyping[conversationId] = false;
          io.to(receiverId).emit("user_typing", {
            userId,
            isTyping: false,
            conversationId
          });
        }, 3000);


        //notify receiver that user is typing
        io.to(receiverId).emit("user_typing", {
          userId,
          isTyping: true,
          conversationId
        });


        
        
      })
      
      //handle typing stop event
      socket.on("typing_stop", (conversationId, receiverId) => {
        if(!userId || !receiverId || !conversationId) return;

        const userTyping = typingUsers.get(userId);
        if(userTyping && userTyping[conversationId]) {
          userTyping[conversationId] = false;
          if(userTyping[`${conversationId}_timeout`]) {
            clearTimeout(userTyping[`${conversationId}_timeout`]);
            delete userTyping[`${conversationId}_timeout`];
          }
        }
        
        io.to(receiverId).emit("user_typing", {
          userId,
          isTyping: false,
          conversationId
        });
      })

      //add or update reaction on message
      socket.on("add_reaction", async (messageId, emoji, reactionUserId) => {
        try {
         const message = await Message.findById(messageId);
         if(!message) return;


         const existingIndex = message.reactions.findIndex((reaction) => reaction.user.toString() === reactionUserId);

         if(existingIndex > -1){
          const existingReaction= message.reactions[existingIndex];

          if(existingReaction.emoji === emoji){
            //remove same reaction
            message.reactions.splice(existingIndex, 1);
          } else {
            //change emoji
            message.reactions[existingIndex].emoji = emoji;
          }
         } else {
          //add new reaction
          message.reactions.push({user: reactionUserId, emoji});
         }

         await message.save();
         const populatedMessage = await Message.findById(message._id)
               .populate('sender', 'username profilePicture')
               .populate('receiver', 'username profilePicture').populate('reactions.user', 'username')

               const reactionUpdated = {
                messageId,
                reaction: populatedMessage.reactions
               }

         const receiverSocketId = onlineUsers.get(message.receiver?.id.toString());
         const senderSocketId = onlineUsers.get(message.sender?.id.toString());

         if(receiverSocketId) {
          io.to(receiverSocketId).emit("reaction_update", reactionUpdated);
         }

         if(senderSocketId) {
          io.to(senderSocketId).emit("reaction_update", reactionUpdated);
         }
        
        
         
        } catch (error) {
          console.log(`error adding or updating reaction: ${error}`);
        }
      })

      //handle disconnection and mark user offline
      socket.on("disconnect", async () => {
        try {
          if(userId) {
            onlineUsers.delete(userId);
            if(typingUsers.has(userId)) {
              const userTyping = typingUsers.get(userId);
              Object.keys(userTyping).forEach((key) => {
                if(key.endsWith("_timeout")) {
                  clearTimeout(userTyping[key]);
                }
              })
              typingUsers.delete(userId);
            }
           await User.findByIdAndUpdate(userId, {lastSeen: new Date(), isOnline: false});
          }
          io.emit("user_status", {userId, isOnline: false, lastSeen: new Date()});

          socket.leave(userId);
          console.log(`user ${userId} disconnected`);
        } catch (error) {
          console.log(`error handling disconnection: ${error}`);
        }
      })


      
      


    });


}
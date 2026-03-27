import { error } from "node:console";
import {Server} from "socket.io";

let io:any ;

export const initSocket = (server: any)=>{
    io = new Server(server,{
        cors : {origin : "*"}
    })

    io.on("connection", (socket: any) => {
    const sellerId = socket.handshake.query.sellerId;

    if (sellerId) {
        socket.join(`seller_${sellerId}`);
        console.log(`Seller ${sellerId} connected`);
    }

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);
    });
});


};

export const getIO = ()=>{
    if(!io){
            throw new Error("Socket is not initialized")
    }
    return io;
}




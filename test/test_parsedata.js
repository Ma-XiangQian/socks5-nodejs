import { log } from "console";
import net from "net";

const socket = net.createConnection({port:1080, host:"localhost"},()=>{
    socket.write(Buffer.from([0x01,0x02,0x00,0x02]));
    socket.on("data",function(data){
        log(data);
    });
    socket.on("end",()=>{
        log("end");
    });
    socket.on("close",function(){
        log("close");
    });
});
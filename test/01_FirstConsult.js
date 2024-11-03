/** 
 * 测试客户端首次发送协商的验证方式
 */


import { log } from "console";
import net from "net";

const socket = net.createConnection({port:1080, host:"localhost"},()=>{
    // 发送协商的验证方式
    socket.write(Buffer.from([0x05,0x02,0x00,0x01]));   //正确的协商方式
    // socket.write(Buffer.from([0x04,0x02,0x00,0x02]));   //错误的版本
    // socket.write(Buffer.from([0x05]));   //错误的数据包长度
    // socket.write(Buffer.from([0x05,0x02,0x00,0x02,0x99]));   //正确的协商方式

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
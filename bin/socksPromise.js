import net from "net";
import { parseMethod, handlerConfer, handlerRequest, handlerRelay } from "../utils/handlerSocks.js";

const server_options = {
    host: "0.0.0.0",
    port: 1080,
};

const server = net.createServer(async function(socket){
    const client = {
        address: socket.remoteAddress,
        port: socket.remotePort,
    }
    try{
        // 解析socks5协议
        const method = await parseMethod(socket);
        // 处理协商
        await handlerConfer(socket,method,"auth","root","0328");
        // 解析请求
        const req = await handlerRequest(socket);
        // 处理请求和数据转发
        await handlerRelay(socket,req);
    }catch(err){
        console.log(`Error: ${client.address}:${client.port}`,err);
        socket.end();
    }
    
    socket.on("error",function(err){
        socket.destroy();
        console.log(`Error: ${client.address}:${client.port}`,err);
    });
});

// 连接数达到阈,服务器拒绝连接
server.on("drop",function(data){
    console.log(`拉满了,服务器拒绝连接--> ${data.remoteAddress}:${data.remotePort}`);
});

server.on("error",function(err){
    console.log("tcp服务器异常:",err);
});

server.listen(server_options,function(){
    console.log("SOCKS5 server listening on " + server_options.host + ":" + server_options.port);
});
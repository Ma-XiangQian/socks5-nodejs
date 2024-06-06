import net from "net";
import { FirstConferData,RequestTargetData,ResponseTargetData } from "../utils/parseData.js";
import { HandleConsult } from "../utils/consult.js";

const server_options = {
    host: "0.0.0.0",
    port: 1080,
};

const server = net.createServer(function(socket){
    socket.once("data",function(data){
        try{
            const conferData = new FirstConferData(data);
            const handleResult = new HandleConsult(conferData,"none");
            socket.write(handleResult.toBuffer());
            // 协商失败，关闭连接
            if(!handleResult.status){socket.end();return;};
            // 无验证方式
            if(handleResult.method === "none"){
                socket.once("data",function(data){
                    const targetData = new RequestTargetData(data);
                    if(targetData.cmd !== 0x01){
                        throw new Error("只支持tcp的转发！");
                    }
                    const targetSocket = net.createConnection({
                        host: targetData.dstAddr,
                        port: targetData.dstPort,
                    });
                    targetSocket.on("connect",function(){
                        socket.write(new ResponseTargetData(0x00,0x01,targetSocket.localAddress,targetSocket.localPort).toBuffer());
                        console.log(`连接目标服务器成功--> ${targetData.dstAddr}:${targetData.dstPort}`);
                        socket.pipe(targetSocket).pipe(socket);
                    });
                    targetSocket.setTimeout(6000,()=>{targetSocket.end();socket.end();});
                    targetSocket.on("end",function(){
                        // console.log(`目标服务器关闭连接--> ${targetData.dstAddr}:${targetData.dstPort}`);
                        socket.end();
                    });
                    targetSocket.on("close",function(){
                        socket.end();
                        targetSocket.destroy();
                    });
                    targetSocket.on("error",function(err){
                        console.log(new Date().toLocaleString(),err);
                        targetSocket.destroy();
                        socket.end();
                    });
                    socket.on("end",function(){
                        targetSocket.end();
                    });
                    socket.on("error",function(err){
                        targetSocket.end();
                    });
                });
            }else{
                socket.end();
            }
        }catch(err){
            console.log(`${new Date().toLocaleString()}: ${socket.remoteAddress}:${socket.remotePort} ${err}`);
            socket.end();
            return;
        }
    });
    socket.setTimeout(6000,function(){
        socket.end();
    });
    socket.on("close",function(){
        socket.destroy();
    });
    socket.on("error",function(err){
        console.log(new Date().toLocaleString(),err);
        socket.destroy();
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
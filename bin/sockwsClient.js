import net from "net";
import { FirstConferData,RequestTargetData,ResponseTargetData,PasswordAuthData} from "../utils/parseData.js";
import { HandleConsult } from "../utils/consult.js";
import { WebSocket,createWebSocketStream } from "ws";

const server_options = {
    host: "0.0.0.0",
    port: 1080,
};

const webScoket = {
    host:"ws://38.6.164.52",
    // host:"0.0.0.0",
    // host:"wss://108.61.223.35",
    // host:"wss://熬夜熬到.icu",
    port:8080,
}

const server = net.createServer(function(socket){
    const client = {
        address: socket.remoteAddress,
        port: socket.remotePort,
    }
    socket.once("data",function(data){
        try{
            const conferData = new FirstConferData(data);
            const handleResult = new HandleConsult(conferData,"username-password","root","0328");
            socket.write(handleResult.toBuffer());
            // 协商失败，关闭连接
            if(!handleResult.status){
                console.log(`协商失败:${client.address}:${client.port}`);
                socket.end();return;
            };
            // 无验证方式
            if(handleResult.method === "none"){
                // socket.once("data",function(data){
                //     let targetData = new RequestTargetData(data);
                //     let targetSocket = net.createConnection({
                //         host: targetData.dstAddr,
                //         port: targetData.dstPort,
                //     });
                //     targetSocket.once("connect",function(){
                //         socket.write(new ResponseTargetData(0x00,0x01,targetSocket.localAddress,targetSocket.localPort).toBuffer());
                //         console.log(`代理成功:${client.address}:${client.port} --> ${targetSocket.localAddress}:${targetSocket.localPort} --> ${targetData.dstAddr}:${targetData.dstPort}`);
                //         socket.on("data",function(data){
                //             if(!targetSocket.destroyed||targetSocket.writable){
                //                 targetSocket.write(data);
                //             }
                //         });
                //         targetSocket.on("data",function(data){
                //             if(!socket.destroyed||socket.writable){
                //                 socket.write(data);
                //             }
                //         });
                //     });
                //     targetSocket.setTimeout(6000,()=>{targetSocket.end();});
                //     targetSocket.once("end",function(){
                //         socket.end();
                //     });
                //     targetSocket.once("close",function(){
                //         targetSocket.removeAllListeners("data");
                //         targetSocket.removeAllListeners("error");
                //         targetSocket.removeAllListeners("data");
                //         targetSocket.destroy();
                //         socket.end();
                //     });
                //     targetSocket.once("error",function(err){
                //         console.log(`目标服务器异常:${client.address}:${client.port} --> ${targetSocket.localAddress}:${targetSocket.localPort} --> ${targetData.dstAddr}:${targetData.dstPort}`);
                //         console.log(new Date().toLocaleString(),err);
                //         targetSocket.destroy();
                //     });
                //     socket.on("end",function(){
                //         targetSocket.destroy();
                //     });
                //     socket.on("close",function(){
                //         // console.log(`in-tcp: ${client.address}:${client.port} close!`);
                //         socket.removeAllListeners("data");
                //         socket.removeAllListeners("error");
                //         socket.removeAllListeners("data");
                //         socket.removeAllListeners("close");
                //         targetSocket.destroy();
                //         socket.destroy();
                //     });
                //     socket.on("error",function(err){
                //         console.log(`in-tcp: ${client.address}:${client.port} error!`);
                //         // console.log(new Date().toLocaleString(),err);
                //         socket.destroy();
                //     });
                // });
            }else if(handleResult.method === "username-password"){
                // console.log("验证方式:用户名密码");
                socket.once("data",function(data){
                    let authData = new PasswordAuthData(data);
                    if(!handleResult.passwordAuth(authData)){
                        console.log(`用户名密码验证失败:${client.address}:${client.port}`);
                        socket.write(Buffer.from([0x01,0x01]));
                        socket.end();
                        return;
                    }
                    socket.write(Buffer.from([0x01,0x00]));

                    socket.once("data",function(data){
                        const ws = new WebSocket(`${webScoket.host}:${webScoket.port}`);
                        ws.on('error',function(err){
                            socket.end();
                        });
                        ws.on('open', function(){
                            console.log("WebSocket连接成功");
                            ws.send(data);
                        });
                        ws.once('message', function(data){
                            if(data[1]!=0x00){ws.close();socket.end();return;};
                            socket.write(data);
                            const duplex = createWebSocketStream(ws);
                            socket.pipe(duplex).pipe(socket);

                            duplex.on("error",function(){
                                socket.destroy();
                                ws.close();
                            });
                            // socket.on("data",function(data){
                            //     ws.send(data);
                            // });
                            // ws.on("message",function(data){
                            //     socket.write(data);
                            // });
                        });
                        ws.on("close",function(){
                            socket.end();
                        });
                    });

                });
            }
        }catch(err){
            console.log(`try-catch: ${new Date().toLocaleString()}: ${client.address}:${client.port} ${err}`);
            socket.end();
            return;
        }
    });
    socket.setTimeout(6000,function(){
        socket.destroy();
    });
    socket.on("close",function(){
        // console.log(`out-tcp: ${client.address}:${client.port} close!`);
        socket.destroy();
    });
    socket.on("error",function(err){
        console.log(`tcp: ${client.address}:${client.port} error!`);
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
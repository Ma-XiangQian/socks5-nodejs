import net from "net";
// import { createServer } from 'https';
// import { readFileSync } from 'fs';
import { WebSocketServer,createWebSocketStream} from "ws";
import { RequestTargetData } from "../utils/parseData.js";

// const server = createServer({
//     cert: readFileSync('/root/Hysteria2/ca/cert.pem'),
//     key: readFileSync('/root/Hysteria2/ca/key.pem')
// });

const wss = new WebSocketServer({port:8080});

wss.on('connection', function connection(ws,req) {
    ws.on('error',function(err){
        console.log(err);
        if(ws.readyState==ws.OPEN){
            ws.close();
        }
    });
  
    ws.once('message', function message(data) {
        const targetData = new RequestTargetData(data);
        let targetSocket = net.createConnection({
            host: targetData.dstAddr,
            port: targetData.dstPort,
        });
        targetSocket.once("connect",function(){
            ws.send(Buffer.from([0x05,0x00,0x00,0x01,0x00,0x00,0x00,0x00,0x00,0x00]));
            console.log(`代理成功: ${req.socket.remoteAddress}:${req.socket.remoteAddress} --> ${targetData.dstAddr}:${targetData.dstPort}`);
            const duplex = createWebSocketStream(ws);
            duplex.pipe(targetSocket).pipe(duplex);
            duplex.on("error",function(){
                targetSocket.destroy();
                ws.close();
            });
            // ws.on("message",function(data){
            //     targetSocket.write(data);
            // });
            // targetSocket.on("data",function(data){
            //     ws.send(data);
            // });
        });
        targetSocket.setTimeout(6000,()=>{targetSocket.end();});
        targetSocket.once("close",function(){
            targetSocket.destroy();
            ws.close();
        });
        targetSocket.once("error",function(err){
            targetSocket.destroy();
        });
        ws.once("close",function(){
            targetSocket.end();
        });
    });

});

// server.listen(8080);
// 导入tcp模块，创建tcp服务器
import net from 'net';
import {SocksServerConsult} from '../utils/socksConsult.js';
import { ClientDataToServer } from "../utils/socksData.js";
import { lookup } from "dns";
import { log } from 'console';

// 端口
let port = 1080;

const server = net.createServer();

server.on('connection', function(socket){
    socket.once("data",function(data){
        // 协商认证
        let socksServerConsult = new SocksServerConsult(socket, data);
        // 判断是否协商成功
        if(!socksServerConsult.consult.status)return;

        socket.once("data",function(data){
            const demo = new ClientDataToServer(data);
            console.log(data);
            console.log(demo.ver,demo.cmd,demo.atyp);
            // 当前socks协议只支持tcp连接
            if(demo.ver!= 5 || demo.cmd!= 1 || demo.atyp== 4){
                console.log("不支持的协议");
                socket.end();
                return;
            }

            let {port,domainName} = demo.targetServer;
            if(domainName==""){
                log("域名为空");
                socket.end();
                return;
            }

            let tartgetSocket = new net.Socket();

            lookup(domainName,function(err,address){
                if(err)return;
                tartgetSocket.connect(port,address,function(){
                    console.log("连接目标服务器成功",address,port);
                    const tartgetAddr = tartgetSocket.localAddress;
                    const tartgetPort = tartgetSocket.localPort;
                    const ipBytes = tartgetAddr.split('.').map(byte => parseInt(byte, 10));
                    const portBytes = [(tartgetPort >> 8) & 0xFF, tartgetPort & 0xFF];
                    const buffer = Buffer.concat([Buffer.from([5,0,0,1]),Buffer.from(ipBytes), Buffer.from(portBytes)]);
                    socket.write(buffer);
                    tartgetSocket.pipe(socket);
                    socket.pipe(tartgetSocket);
                });
            });

        });

    });
    socket.on("end",function(){
        // console.log(`客户端 ${client.localAddress}:${client.localPort} 断开连接！`);
    });
});

// 监听端口
server.listen(port, function() {
  console.log('sserver is running at '+ port);
});
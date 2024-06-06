// 导入tcp模块，创建tcp服务器
import net from 'net';
import {SocksServerConsult} from '../utils/socksConsult.js';
import { ClientDataToServer } from "../utils/socksData.js";
import { dataForwarding } from "../utils/dataForwarding.js";
import { lookup } from "dns";

// 端口
let port = 1080;

let clientCount = 0;

const server = net.createServer();

server.on('connection', function(socket){
    let client = {
        address:"",
        port:0,
    }

    socket.once("data",function(data){
        client.address = socket.remoteAddress;
        client.port = socket.remotePort;
        // console.log(`\ntcp客户端 ${client.address}:${client.port} 连接成功！`);
        // 协商认证
        let socksServerConsult = new SocksServerConsult(socket, data);
        // 判断是否协商成功
        if(!socksServerConsult.consult.status)return;

        socket.once("data",function(data){
            const demo = new ClientDataToServer(data);
            // 当前socks协议只支持tcp连接
            if(demo.ver!= 5 || demo.cmd!= 1 || demo.atyp== 4){
                console.log("不支持的协议");
                socket.destroy();
                return;
            }

            let {port,domainName,ipv4} = demo.targetServer;
            if(ipv4==""){
                lookup(domainName, (err, address, family) => {
                    if(err){
                        socket.destroy();
                        return;
                    }
                    dataForwarding(address,port,socket,domainName);
                });
                return;
            }
            dataForwarding(ipv4,port,socket,domainName);
        });

    });
});

// 监听端口
server.listen(port, function() {
  console.log('sserver is running at '+ port);
});
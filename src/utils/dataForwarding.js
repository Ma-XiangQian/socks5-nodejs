import net from 'net';
import { Socket } from "net";

/**
 * 
 * @param {String} address IP地址
 * @param {Number} port     端口号
 * @param {Socket} socket   客户端socket
 * @param {String} domainName   域名
 */
export const dataForwarding = function(address,port,socket,domainName){
    let tartgetSocket = new net.Socket();
    tartgetSocket.connect(port,address,function(){
        tartgetSocket.setTimeout(6000);
        socket.setTimeout(6000);
        const tartgetAddr = tartgetSocket.localAddress;
        const tartgetPort = tartgetSocket.localPort;
        const ipBytes = tartgetAddr.split('.').map(byte => parseInt(byte, 10));
        const portBytes = [(tartgetPort >> 8) & 0xFF, tartgetPort & 0xFF];
        const buffer = Buffer.concat([Buffer.from([5,0,0,1]),Buffer.from(ipBytes), Buffer.from(portBytes)]);
        socket.write(buffer);
        console.log(`目标服务器访问成功：${socket.remoteAddress}:${socket.remotePort} --> ${address}:${port}`);
        // socket.pipe(tartgetSocket);
        // tartgetSocket.pipe(socket);

        socket.on("data",function(msg){
            tartgetSocket.write(msg);
        });

        tartgetSocket.on("data",function(msg){
            socket.write(msg);
        });

        tartgetSocket.on("end",function(){
            socket.end();
            console.log(`目标服务器连接断开：${socket.remoteAddress}:${socket.remotePort} --> ${domainName!=''?domainName+'/':""}${address}:${port}`);
        });

        tartgetSocket.on("timeout",function(){
            tartgetSocket.end();
        });
        tartgetSocket.on("connectionAttemptFailed",function(){
            socket.destroy();
            tartgetSocket.destroy();
            console.log(`目标服务器连接超时：${socket.remoteAddress}:${socket.remotePort} --> ${domainName!=''?domainName+'/':""}${address}:${port}`);
        });
        tartgetSocket.on("close",function(){
            tartgetSocket.destroy();
            socket.destroy();
        });
        socket.on("end",function(){
            tartgetSocket.end();
            socket.destroySoon();
        });
        socket.on("close",function(){
            tartgetSocket.destroy();
            socket.destroy();
        });
        socket.on("timeout",function(){
            socket.end();
            tartgetSocket.end();
        });
        tartgetSocket.on("error",function(err){
            socket.destroy();
            tartgetSocket.destroy();
            console.log(`访问失败：${socket.remoteAddress}:${socket.remotePort} --> ${domainName!=''?domainName+'/':""}${address}:${port}`);
        });
        socket.on("error",function(err){
            socket.destroy();
            tartgetSocket.destroy();
            console.log(`访问失败：${socket.remoteAddress}:${socket.remotePort} --> ${domainName!=''?domainName+'/':""}${address}:${port}`);
        });
        
    });
}
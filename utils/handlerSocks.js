import { Socket } from "net";
import dgram from "dgram";
import { FirstConferData,ResponseConferData,PasswordAuthData,RequestTargetData, ResponseTargetData } from "./parseData.js";

/** 
 * 处理初次协商，解析客户端验证方式
 * @param {Socket} socket 客户端套接字
 * @returns {Promise}
 */
function parseMethod(socket){
    return new Promise((resolve, reject) => {
        // 获取一次数据
        socket.once("data",function(data){
            try{
                const firstConferData = new FirstConferData(data);
                resolve(firstConferData);
            }catch(err){
                reject(err);
            }
        });
    });
}

/** 
 * 处理协商，返回结果 目前仅支持无验证方式和用户名密码验证方式
 * @param {Socket} socket 客户端套接字
 * @param {FirstConferData} data 协商数据
 * @param {string} type 验证方式，默认无验证方式
 * @param {string} uname 用户名
 * @param {string} passwd 密码
 * @returns {Promise}
 */
function handlerConfer(socket,data,type="noauth",uname="",passwd=""){
    return new Promise((resolve, reject) => {
        // 服务器支持的验证方式
        const server_methods = {
            'noauth':0x00, // 无验证方式
            'auth':0x02,    // 用户名密码验证方式
        }
        // 判断传入的type是否在服务器支持的验证方式中
        if(server_methods[type]==undefined){
            reject(`验证方式不支持: type=${type}`);
        }
        // 选择用户名密码验证方式
        if(type === "auth"){
            // 判断用户和密码是否为空
            if(!uname.trim() ||!passwd.trim()){
                reject("服务器配置的用户名或密码为空");
            }
        }
        // 判断客户端的验证方式与服务器端是否一致
        if(!data.methods.includes(server_methods[type])){
            reject(`客户端验证方式不支持: ${data.methods.toString("hex")}`);
        }

        // 给客户端发送验证的方式
        socket.write(ResponseConferData.responseMethod(server_methods[type]));

        // 处理无验证方式
        if(type === "noauth"){
            resolve();
        }

        // 处理用户密码验证方式
        if(type === "auth"){
            // 获取客服端发送的用户名和密码
            socket.once("data",function(data){
                try{
                    const auth = new PasswordAuthData(data);
                    // 判断用户名和密码是否匹配
                    if(auth.uname === uname && auth.passwd === passwd){
                        // 发送验证成功消息
                        socket.write(ResponseConferData.responseAuth());
                        resolve();
                    }else{
                        throw new Error("用户名或密码错误");
                    }
                }catch(err){
                    socket.write(ResponseConferData.responseAuth(false));
                    reject(err);
                }
            });
        }
    });

}


/** 
 * 解析客户端请求的目标服务
 * @param {Socket} socket 客户端套接字
 * @returns {Promise}
 */
function handlerRequest(socket){
    return new Promise((resolve, reject) => {
        // 获取请求数据
        socket.once("data",function(data){
            try{
                const request = new RequestTargetData(data);
                resolve(request);
            }catch(err){
                reject(err);
            }
        });
    });
}

/**
 * 响应客户端请求的目标服务，并进行数据转发
 * @param {Socket} socket 客户端套接字
 * @param {RequestTargetData} request 请求数据
*/
function handlerRelay(socket,request){
    return new Promise((resolve, reject) => {
        // 处理tcp请求
        if(request.cmd === 0x01){
            const targetSocket = new Socket();
            targetSocket.connect(request.dstPort,request.dstAddr,function(){
                console.log(`${socket.remoteAddress}:${socket.remotePort} --> ${request.dstAddr}:${request.dstPort}`);
                socket.write(ResponseTargetData.toLocal(0x00));
                // socket.write(ResponseTargetData.toIPv4(0x00,targetSocket.localAddress,targetSocket.localPort));
                socket.pipe(targetSocket).pipe(socket);
            });
            targetSocket.setTimeout(6000,()=>{targetSocket.end();});
            targetSocket.once("close",function(){
                socket.end();
            });
            targetSocket.once("error",function(err){
                console.log(err);
                targetSocket.destroy();
            });
            socket.on("close",function(){
                targetSocket.destroy();
                // console.log("客户端断开连接");
            });
            resolve();
        }else if(request.cmd === 0x02){
            // 处理bind
            // const udpSocket = new dgram.Socket();
            // udpSocket.connect(request.dstPort,request.dstAddr,function(){

            // });
            // udpSocket.on("close",function(){

            // });
            // udpSocket.on("error",function(err){
            //     console.log(err);
            //     udpSocket.disconnect();
            // });

            reject(`不支持的请求类型: BIND`);
        }else if(request.cmd === 0x03){
            reject(`不支持的请求类型: UDP`);
            
            // 请求目标ip及端口
            // const {dstAddr,dstPort} = request;
            // // 处理udp请求
            // const udpTargetSocket  = new dgram.Socket();
            // udpTargetSocket.connect(dstPort,dstAddr);
            // udpTargetSocket.on("connect",function(){
            //     console.log("udp连接成功！");
            //     socket.write(ResponseTargetData.toLocal(0x00));
            // });
            // socket.on("data",function(data){
            //     udpTargetSocket.send(data,function(err,bytes){
            //         if(err){
            //             console.log(err);
            //         }
            //     });
            // });
            // udpTargetSocket.on("message",function(data,rinfo){
                
            // });

        }
    });
}

export { parseMethod, handlerConfer, handlerRequest, handlerRelay };
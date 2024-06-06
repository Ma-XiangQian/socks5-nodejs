import { Buffer } from 'buffer';
import {Socket} from 'net';

/**
 * 处理socks5客户端和服务端的协商过程的类
 */
export class SocksServerConsult {
    /**
     * 
     * @param {Socket} socket
     * @param {Buffer} dataBuffer 客户端传来的协商数据
     */
    constructor(socket,dataBuffer){
        this.socket = socket;
        this.dataBuffer = dataBuffer;

        // 协商对象
        this.consult={
            "status": false, // true:验证成功，false:验证失败/未验证
            "version": undefined,
            "nmethods":undefined,
            "methods": undefined,
            "username": undefined,
            "password": undefined,
        }

        this.parsingData();
        this.validate();

        if(this.consult.status){
            // 验证成功，发送响应数据
            this.socket.write(Buffer.from([5,0]));
        }else{
            // 验证失败，断开连接
            this.close();
        }
    }

    // 解析数据
    parsingData(){
        this.consult.version = this.dataBuffer.readUInt8(0);
        this.consult.nmethods = this.dataBuffer.readUInt8(1);
        // 从第三个字节开始，读取nmethods个字节，作为methods
        this.consult.methods = this.dataBuffer.slice(2,2+this.consult.nmethods).toString('hex');
    }

    // 校验版本和方法
    validate(){
        this.consult.status = true;
        if(this.consult.version!== 5){
            this.consult.status = false;
            console.log("客服端不支持socks5协议");
        }else if(this.consult.methods!=="00"){
            this.consult.status = false;
            console.log("服务端只支持无密码验证方式");
        }
    }

    // 断开连接
    close(){
        this.socket.destroy();
    }

}
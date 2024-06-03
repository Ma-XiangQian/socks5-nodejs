import { Buffer } from "buffer";

/**
 * 协商成功后，处理客服端发给服务器的数据类
 */
export class ClientDataToServer {

    /**
     * @param {Buffer} msg 需要处理的buffer数据
     */
    constructor(msg){
        this.msg = msg;

        this.ver = this.msg.readUInt8(0);
        this.cmd = this.msg.readUInt8(1);
        this.rsv = this.msg.readUInt8(2);
        this.atyp = this.msg.readUInt8(3);
        this.addr = "";
        // 目标服务器信息
        this.targetServer ={
            domainName:"",
            ipv4:"",
            ipv6:"",
            port:0
        }

        if(this.atyp === 1){
            // IPv4
            this.addr = this.msg.slice(4, 8).join(".");
            this.targetServer.ipv4 = this.addr;
        }else if(this.atyp === 4){
            // IPv6
            this.addr = this.msg.slice(4, 20).toString("hex");
            this.addr = this.addr.padStart(32, "0");
            this.addr = this.addr.match(/../g).map(function(str){
                return parseInt(str, 16);
            }).join(":");
            this.targetServer.ipv6 = this.addr;
        }else if(this.atyp === 3){
            const domainLength = this.msg.readUInt8(4);
            const domainEnd = 5 + domainLength;
            const domain = this.msg.toString('ascii', 5, domainEnd);
            this.addr = domain;
            this.targetServer.domainName = this.addr;
        }

        // 从倒数第二字节开始，截止到最后字节，即为PORT
        this.port = this.msg.slice(-2).readUInt16BE(0);
        this.targetServer.port = this.port;
    }

    show(){
        console.log(this.ver, this.cmd, this.rsv, this.atyp, this.addr, this.port);
    }
}
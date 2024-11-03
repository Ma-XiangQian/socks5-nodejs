import { Buffer } from "buffer";

/**
 * @description 解析校验客户端首次协商数据
 * @description VER：协议版本，其固定长度为1个字节
 * @description NMETHODS：表示第三个字段METHODS的长度，它的长度也是1个字节
 * @description METHODS：客户端的验证方式，长度是1-255个字节
 */
export class FirstConferData {
    /**
     * @param {Buffer} data 客户端发送的首次协商数据
     */
    constructor(data){
        this.verifyData(data);
        this.ver = data[0];
        this.methods = data.subarray(2);
    }

    /**
     * 校验数据是否为合法标准
     * @param {Buffer} data
     */
    verifyData(data){
        if(data.length<3||data.length!==2+data.readUInt8(1)){
            throw new Error("协商数据错误");
        }else if(data[0]!== 0x05){
            throw new Error("协议版本不支持");
        }
    }
}

/** 
 * 返回协商数据的响应报文
 */
export class ResponseConferData{
    /**
     * @description 发送协商验证方式
     * @param {number} method 协商的验证方式
     * @returns {Buffer} 响应报文
    */
    static responseMethod(method){
        return Buffer.from([0x05,method]);
    }

    /**
     * 用户名和密码验证成功的报文
     * @returns {Buffer} 响应报文
     * @param {boolean} ok 是否验证成功
    */
    static responseAuth(ok=true){
        if(ok)return Buffer.from([0x01,0x00]);
        return Buffer.from([0x01,0x01]);
    }

}


/**
 * @description 解析客户端密码认证数据
 * @description VER：协议版本，其固定长度为1个字节
 * @description ULEN：表示用户名的长度，其长度为1个字节
 * @description UNAME：用户名，长度不超过255字节
 * @description PLEN：表示密码的长度，其长度为1个字节
 * @description PASSWD：密码，长度不超过255字节
 */
export class PasswordAuthData{
    /**
     * @param {Buffer} data 客户端发送的密码认证数据
     */
    constructor(data){
        this.ver = undefined;
        this.uname = undefined;
        this.passwd = undefined;
        this.verifyData(data);
        this.parser(data);
    }

    /**
     * @description 解析数据
     * @param {Buffer} data
     */
    parser(data){
        this.ver = data[0];
        let ulen = data.readUInt8(1);
        this.uname = data.subarray(2,2+ulen).toString("utf8");
        this.passwd = data.subarray(3+ulen,data.length).toString("utf8");
    }

    /**
     * 校验数据是否为合法标准
     * @param {Buffer} data
     */
    verifyData(data){
        if(data.length<5){
            throw new Error("密码认证数据有误！");
        }
        let ulen = data.readUInt8(1);
        let plen = data.readUInt8(2+ulen);
        if(data[0]!==0x01||data.length!==3+ulen+plen){
            throw new Error("密码认证数据有误！");
        }
    }
}

/**
 * @description 解析客户端请求目标地址数据
 * @description VER：协议版本，其固定长度为1个字节
 * @description CMD：表示请求的命令，其固定长度为1个字节 0x01-tcp 0x02-bind 0x03-udp
 * @description RSV：保留字段，其固定长度为1个字节
 * @description ATYP：表示目标地址的类型，其固定长度为1个字节 0x01-IPv4 0x03-域名 0x04-IPv6
 * @description DST.ADDR：表示目标地址，其长度根据ATYP的不同而不同  域名的第一个字节表示域名的长度，其后为域名的ASCII码
 * @description DST.PORT：表示目标端口，其长度为2个字节
 */
export class RequestTargetData{
    /**
     * @param {Buffer} data 客户端发送的请求目标地址数据
     */
    constructor(data){
        this.ver = undefined;
        this.cmd = undefined;
        this.rsv = undefined;
        this.atyp = undefined;
        this.dstAddr = undefined;
        this.dstPort = undefined;

        this.verifyData(data);
        this.parser(data);
    }

    /**
     * @description 解析数据
     * @param {Buffer} data
     */
    parser(data){
        this.ver = data[0];
        this.cmd = data[1];
        this.rsv = data[2];
        this.atyp = data[3];
        this.dstPort = data.subarray(-2).readUInt16BE(0);
        // ipv4
        if(this.atyp === 0x01){
            this.dstAddr = data.subarray(4,data.length-2).join(".");
        }else if(this.atyp === 0x03){
            // 域名
            let len = data.readUInt8(4);
            this.dstAddr = data.subarray(5,5+len).toString("ascii");
        }else if(this.atyp === 0x04){
            // ipv6
            this.dstAddr = data.subarray(4,data.length-2).join(":");
        }
    }

    /**
     * @description 校验数据是否为合法标准
     * @param {Buffer} data
     */
    verifyData(data){
        if(data.length<7){
            throw new Error("请求目标数据有误！");
        }else if(data[0]!== 0x05||data[2]!== 0x00||(data[1]!== 0x01&&data[1]!== 0x02&&data[1]!== 0x03)){
            throw new Error("请求目标数据有误！");
        }
    }
}


/**
 * @description 解析服务端响应目标地址数据
 * @description VER：协议版本，其固定长度为1个字节
 * @description REP：表示响应的结果，其固定长度为1个字节
 * @description RSV：保留字段，其固定长度为1个字节
 * @description ATYP：表示目标地址的类型，其固定长度为1个字节 0x01-IPv4 0x03-域名 0x04-IPv6
 * @description BND.ADDR：表示绑定的地址，其长度根据ATYP的不同而不同  域名的第一个字节表示域名的长度，其后为域名的ASCII码
 * @description BND.PORT：表示绑定的端口，其长度为2个字节
 */
// export class ResponseTargetData{
//     constructor(rep,atyp,bndAddr,bndPort){
//         this.ver = 0x05;
//         this.rep = rep;
//         this.rsv = 0x00;
//         this.atyp = atyp;
//         this.bndAddr = bndAddr;
//         this.bndPort = bndPort;
//     }
//     toBuffer(){
//         return Buffer.concat([
//             Buffer.from([this.ver,this.rep,this.rsv,this.atyp]),
//             this.addrToBuffer(),
//             this.portToBuffer()
//         ]);
//     }
//     addrToBuffer(){
//         if(this.atyp === 0x01){
//             return Buffer.from(this.bndAddr.split('.').map(byte => parseInt(byte, 10)));
//         }else if(this.atyp === 0x03){
//             return Buffer.concat([
//                 Buffer.from([this.bndAddr.length]),
//                 Buffer.from(this.bndAddr,"ascii")
//             ]);
//         }
//     }
//     portToBuffer(){
//         return Buffer.from([(this.bndPort >> 8) & 0xFF, this.bndPort & 0xFF]);
//     }
// }


/**
 * @description 响应转发服务器的信息
 * @description VER：协议版本，其固定长度为1个字节
 * @description REP：表示响应的结果，其固定长度为1个字节
 * @description RSV：保留字段，其固定长度为1个字节
 * @description ATYP：表示目标地址的类型，其固定长度为1个字节 0x01-IPv4 0x03-域名 0x04-IPv6
 * @description BND.ADDR：表示绑定的地址，其长度根据ATYP的不同而不同  域名的第一个字节表示域名的长度，其后为域名的ASCII码
 * @description BND.PORT：表示绑定的端口，其长度为2个字节
 */

export class ResponseTargetData{

    /**
     * 
     * @param {number} rep 响应的结果
     * @param {string} ip 绑定的地址
     * @param {number} port 绑定的端口
     */
    static toIPv4(rep,ip,port){
        const before = Buffer.from([0x05,rep,0x00,0x01]);
        const portBuf = Buffer.from([(port >> 8) & 0xFF, port & 0xFF]);
        const ipBuf = Buffer.from(ip.split('.').map(byte => parseInt(byte, 10)));
        return Buffer.concat([before,ipBuf,portBuf]);
    }


    /**
     * 响应转发服务器的域名
     * @param {number} rep 响应状态
     * @param {String} domain 域名
     * @param {number} port 端口
     */
    static toDomain(rep,domain,port){
        const before = Buffer.from([0x05,rep,0x00,0x03]);
        const domainBuf = Buffer.from(domain);
        const domainLen = domainBuf.length;
        const portBuf = Buffer.from([(port >> 8) & 0xFF, port & 0xFF]);
        return Buffer.concat([before,domainLen,domainBuf,portBuf]);
    }

    /**
     * socks服务器与relay服务器是同一台机器
     * @param {number} rep 
     * @returns {Buffer} 响应报文
     */
    static toLocal(rep){
        return Buffer.from([0x05,rep,0x00,0x01,0x00,0x00,0x00,0x00,0x00,0x00]);
    }

    /** 
     * 返回ipv6地址的响应报文
     * @param {string} ip ip地址
     * @param {number} port  端口
     * @param {number} rep  响应状态
     */
    static toIPv6(rep,ip,port){
        const before = Buffer.from([0x05,rep,0x00,0x03]);
        const portBuf = Buffer.from([(port >> 8) & 0xFF, port & 0xFF]);
    }
}
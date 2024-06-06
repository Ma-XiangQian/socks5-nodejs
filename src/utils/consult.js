import { FirstConferData } from "./parseData.js";

/**
 * @description 协商连接方式的处理模块，目前只支持无验证方式和用户名密码验证方式
 */
export class HandleConsult {
    /**
     * @description 构造函数
     * @param {FirstConferData} firstConferData 协商数据
     * @param {string} method 服务器验证的方法
     * @param {string} username 用户名
     * @param {string} password 密码
     * @param {boolean} status 是否有支持的协商方式
     */
    constructor(firstConferData,method='none',username='',password='') {
        this.firstConferData = firstConferData;
        this.method = method.toLowerCase();
        this.username = username;
        this.password = password;
        this.methods={
            'none':0x00,
            'username-password':0x02,
            "no":0xFF
        }
        this.status = this.isSupportMethod();
    }

    // 判断是否支持协商连接方式
    isSupportMethod(){
        return this.firstConferData.methods.includes(this.methods[this.method]);
    }

    // 返回协商数据
    toBuffer(){
        if(this.status){
            return Buffer.from([0x05,this.methods[this.method]]);
        }
        return Buffer.from([0x05,0xFF]);
    }
}
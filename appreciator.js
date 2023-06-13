import plugin from '../../lib/plugins/plugin.js'
import fs from 'fs'
import { segment } from "oicq";
import fetch from "node-fetch"
import lodash from 'lodash'
import common from '../../lib/common/common.js'
import path from 'path'
import { createRequire } from "module";
const require = createRequire(import.meta.url)

if (!fs.existsSync("plugins/example/appreciator/")) {
    fs.mkdirSync("plugins/example/appreciator/");
}

export class example extends plugin {
    constructor() {
        super({
            name: '鉴赏',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^#?鉴赏帮助$',
                    fnc: 'appreciate_help'
                },
                {
                    reg: '^#?((不|免|无)(加权|权重))?鉴赏.*$',
                    fnc: 'appreciate'
                }
            ]
        })
    }
    
    async appreciate(e) {
        await e.reply("别急，在鉴赏了……");
        if (e.source) {
          // console.log(e);
          let reply;
          if (e.isGroup) {
            reply = (await e.group.getChatHistory(e.source.seq, 1)).pop()?.message;
          } else {
            reply = (await e.friend.getChatHistory(e.source.time, 1)).pop()?.message;
          }
          if (reply) {
            for (let val of reply) {
              if (val.type == "image") {
                e.img = [val.url];
                break;
              }
            }
          }
        }
        if (!e.img) {
            await this.reply("未包含图片，请回复图片或带图片再发送命令");
            // return true;
            return false;
        }
        const regex = /\d+\.\d+/; // 匹配文本中的数字
        const match = e.msg.match(regex);
        const limit = match ? parseFloat(match[0]) : 0.6;
        var imageURL=e.img[0];
        /*
        let data = {
          "fn_index": 0,
          "data": ['', 0.5],
        };
        fetch(imageURL)
          .then(res => res.blob())
          .then(async (blob) => {
            const buffer = await blob.arrayBuffer();
            const base64 = buffer.toString('base64');
            const mimeType = res.headers.get('content-type');
            const dataURI = `data:${mimeType};base64,${base64}`;
            data.data[0] = dataURI;
          })
          .catch(error => console.error(error));
        */
        
        try {
            var url = `https://nsfwtag.azurewebsites.net/api/tag?limit=${limit}&url=${imageURL}`
            const response = await fetch(url, { method: "GET", headers: { 'Content-Type': 'application/json' }, timeout: 10000});
            var jsonobj = await response.json();
            console.log(JSON.stringify(jsonobj));
        }
        catch(error) {
            console.error(error); // 记录错误信息
            e.reply("鉴赏失败，可能是与api通信异常："+error)
            return false; // 返回 false
        }
        
        //await this.reply(JSON.stringify(jsonobj.results))
        
        let result_data = jsonobj;
        
        try {
            if (e.msg.search(/((不|免|无)(加权|权重))/s) == -1){
                let output = "";
                for (let key in result_data) {
                  if (key.startsWith("rating:")) continue;
                  const tag = key.replaceAll("_", " ");
                  const value = result_data[key].toFixed(2);
                  output += `${tag}: ${value}, `;
                }
                output = output.slice(0, -1).slice(0, -1); // 去除最后一个逗号
                await this.reply(`以下是加权后的tag分析结果：\n${output}`)
            }
            else{
                let output = "";
                for (let key in result_data) {
                  if (key.startsWith("rating:")) continue;
                  const tag = key.replaceAll("_", " ");
                  output += `${tag}, `;
                }
                output = output.slice(0, -1).slice(0, -1); // 去除最后一个逗号
                await this.reply(`以下是不含加权的tag分析结果：\n${output}`)
            }
        }
        catch(error) {
            console.error(error); // 记录错误信息
            e.reply("鉴赏失败，解析tag时发生异常："+error)
            return false; // 返回 false
        }
    }
    
    async appreciate_help(e) {
        e.reply("发送命令 #鉴赏 或 #无权重鉴赏 即可获取图片可能包含的tag\n在命令后加0~1之间的浮点数可自定义返回的tag的权重最低值（该值未设定时默认为0.6）");
    }
}

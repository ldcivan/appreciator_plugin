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
                    reg: '^#?(鉴赏|鉴黄)帮助$',
                    fnc: 'appreciate_help'
                },
                {
                    reg: '^#?(((不|免|无)(加权|权重))?鉴赏)|鉴黄.*$',
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
            const url_regex = /(https?|ftp):\/\/[^\s/$.?#].[^\s]*/g;
            const urls = e.msg.match(url_regex);
            if(!urls){
                await this.reply("未包含图片，请回复图片、携带图片或携带图片链接再发送命令");
                // return true;
                return false;
            }
            else {
                e.img = urls;
            }
        }
        const num_regex = /^\d+(\.\d+)?$/; // 匹配文本中的数字
        const num_match = e.msg.match(num_regex);
        const limit = num_match ? parseFloat(num_match[0]) : 0.6;
        let version= "v2/tag";
        if (e.msg.includes('v1')) {
            version = 'v1/tag';
        } else if (e.msg.includes('v2')) {
            version = 'v2/tag';
        } else if (e.msg.includes('v3')) {
            version = 'v3/tag';
        } else if (e.msg.includes('nsfw')||e.msg.includes('鉴黄')) {
            version = 'v1/nsfw';
        }
        var imageURL=e.img[0];
        const ero_threshold = 0.6; //鉴黄，色图阈值
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
            var url;
            if (version != 'v1/nsfw') {
                url = `https://savor.pro-ivan.cn/api/${version}?limit=${limit}&url=${imageURL}`
            }
            else {
                const image_dim = num_match ? parseFloat(num_match[0]) : 224;
                url = `https://savor.pro-ivan.cn/api/${version}?image_dim=${image_dim}&urls=${e.img}`
            }
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
        
        if (version != 'v1/nsfw') {
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
        else {
            try {
                let output = "";
                let sorted_keys;
                const tag_map = {"neutral": "中立内容", "drawings": "绘画内容", "sexy": "不适合内容", "hentai": "动漫色情", "porn": "写实色情"};
                for(let index = 0; index < result_data.length; index++) {
                    sorted_keys = await this.sortKeys(result_data[index])
                    output += `${index+1}. ${result_data[index]['sexy']+result_data[index]['porn']+result_data[index]['hentai']>ero_threshold?'我超太涩了(//// ^ ////)快撤回别让狗管理看见！':'哼，一般，不要小瞧色图啊！'}\n`;
                    for(let rank = 0; rank < sorted_keys.length; rank++) {
                        output += `${tag_map[sorted_keys[rank]]}：${(result_data[index][sorted_keys[rank]]*100).toFixed(2)}%\n`;
                    }
                    output += '\n';
                }
                await e.reply(output);
            }
            catch(error) {
                console.error(error); // 记录错误信息
                e.reply("鉴赏失败，解析色情成分时发生异常："+error)
                return false; // 返回 false
            }
        }
    }
    
    async appreciate_help(e) {
        e.reply("1. 回复图片、在消息尾部携带图片或图片链接后（图片优先于链接），使用命令 '#鉴赏' 或 '#无权重鉴赏' 即可获取图片可能包含的tag\n2. 在命令后加0~1之间的浮点数可自定义返回的tag的权重最低值（该值未设定时默认为0.6）\n3. 现在可以在命令中注明要使用的功能模型，现在支持：v1-第一代tag鉴赏 v2-第二代tag鉴赏 nsfw-图片色情程度鉴定，默认值为v2（nsfw可直接用 '#鉴黄'+图片 触发）\n例子：'#无权重鉴赏 v1 0.75' Bot会参考v1模型返回图片的不带权重值的tag，且返回的tag的权重值都是大于0.75的");
    }
    
    async sortKeys(result_data) {
      const keys = Object.keys(result_data);
    
      keys.sort(function(a, b) {
        return result_data[b] - result_data[a];
      });
    
      return keys;
    }
}

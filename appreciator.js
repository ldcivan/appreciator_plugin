// 本插件已因api结构更改而作废，请不要再使用
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
                    reg: '^#?((不|免|无)(加权|权重))?鉴赏$',
                    fnc: 'appreciate'
                },
                {
                    reg: '^#?鉴赏帮助$',
                    fnc: 'appreciate_help'
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
        var imageURL=e.img[0];
        
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
        
        var url = 'https://hysts-deepdanbooru.hf.space/api/predict'
        const response = await fetch(url, { method: "POST", headers: { 'Content-Type': 'application/json' }, body: data, timeout: 10000});
        var jsonobj = await response.json();
        console.log(JSON.stringify(response));
        
        //await this.reply(JSON.stringify(jsonobj.results))
        
        let result_data = jsonobj.data[0].confidences
        
        if (e.msg.search(/((不|免|无)(加权|权重))/s) == -1){
            const output = result_data
              .filter(item => !item.label.startsWith("rating:"))
              .map(item => `(${item.label.replace(/_/g, ' ')}: ${((item.confidence-0.5)*2+0.5).toFixed(2)})`)
              .join(", ");
            await this.reply(`以下是加权后的tag分析结果：\n${output}`)
        }
        else{
            const output = result_data
              .filter(item => !item.label.startsWith("rating:"))
              .map(item => `${item.label.replace(/_/g, ' ')}`)
              .join(", ");
            await this.reply(`以下是不含加权的tag分析结果：\n${output}`)
        }
    }
    


}

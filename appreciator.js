import plugin from '../../lib/plugins/plugin.js'
import fs from 'fs'
import { segment } from "oicq";
import fetch from "node-fetch"
import lodash from 'lodash'
import common from '../../lib/common/common.js'
import path from 'path'
import { createRequire } from "module";
const require = createRequire(import.meta.url)


export class example extends plugin {
    constructor() {
        super({
            name: '鉴赏',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^#?鉴赏$',
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
            await this.cancel(e);
            // return true;
            return false;
        }
        var imageURL=e.img[0];
        
        
        const puppeteer = require('puppeteer');

        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-setuid-sandbox',
                '--no-first-run',
                '--no-sandbox',
                '--no-zygote',
                '--single-process'
              ]
        });
        const page = await browser.newPage();
        await page.goto(imageURL, {
           timeout: 30 * 1000,
           waitUntil: [
               'load',                       //等待 “load” 事件触发
               'domcontentloaded',  //等待 “domcontentloaded” 事件触发
               'networkidle0',          //在 500ms 内没有任何网络连接
               'networkidle2'           //在 500ms 内网络连接个数不超过 2 个
           ]
        });

        
        function tob64(file) {
            let filePath = path.resolve(file); // 原始文件地址
         
            // 读取文件数据
            let data = fs.readFileSync(filePath);
            data = Buffer.from(data).toString('base64');
         
            return data;
        }
        //Usage example using await:
        await await page.screenshot({
            path: `./plugins/example/appreciate.jpeg`,
            fullPage: true
        })
        
        let img_b64 = await tob64(`./plugins/example/appreciate.jpeg`) ;
        //console.log(img_b64);

        
    
        await browser.close();
        
        
        var url = 'https://hysts-deepdanbooru.hf.space/api/predict'
        let data = {
            "fn_index": 0,
            "data": [`data:image/jpeg;base64,${img_b64}`, 0.5],
        }
        const response = await fetch(url, { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), timeout: 10000});
        var jsonobj = await response.json();
        
        //await this.reply(JSON.stringify(jsonobj.results))
        
        let result_data = jsonobj.data[0].confidences
        
        const output = result_data
          .map(item => `${item.label}: ${item.confidence.toFixed(4)}`)
          .join(", ");
        
        await this.reply(`${output}`)
    }
    


}
# appreciator_plugin
## Notice：由于无法修复的未知错误，api可能经常出现服务器内部错误的提示，因此现暂不推荐使用本项目
图片Tag鉴赏/鉴黄，可将图片转写为Tag方便AI作画或鉴定图片的色情属性  为原生Yunzai设计

## 使用方法
使用`#鉴赏`或`#无权重鉴赏`并回复一张图片/附带一张图片/附带一条图片链接即可

进阶的，在作Tag鉴赏时，你也可以在上述命令后增加一个0至1之间的小数，来限定返回的Tag权重的最低值

现在支持自定义使用的功能模型：v1-第一版Tag鉴赏 v2-第二版Tag鉴赏 nsfw-鉴黄（鉴黄可直接用`#鉴黄`触发）

例如，`#无权重鉴赏 v1 0.75`代表从v1版模型中获取权重大于0.75的Tag，且返回的Tag后不带权重

你可使用`#鉴赏帮助`从bot获取更多帮助

## 鸣谢
核心代码改写自 [nonebot-plugin-savor](https://github.com/A-kirami/nonebot-plugin-savor)

api来自：[@synodriver/unit_strange_code](https://github.com/synodriver/unit_strange_code)

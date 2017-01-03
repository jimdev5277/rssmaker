//引入 `superagent` 库
const superagent = require('superagent');
//json 2 xml
const json2xml = require('json2xml');
// 定时抓取
const schedule = require('node-schedule');
// 写入文件操作
const fs = require('fs');

superagent.get('https://zhuanlan.zhihu.com/api/columns/study-fe/posts?limit=20')
    .end(function (err, sres) {
        // 常规的错误处理
        if (err) {
        }
        let content = sres.text;
        content = eval('(' + content + ')');
        var items = [];
        for (let contenItem of content) {
            // console.log('图片                     ' + contenItem.content.replace(/src=\\?"(.*?)\.(jpg|png|jpeg|bmp|gif)\\?"/g, 'src="https://pic1.zhimg.com/' + '$1' + '.' + '$2' + '"'));
            let detailc = '<![CDATA[' + '<img border="none" src="' + contenItem.titleImage + '">' + contenItem.content.replace(/src=\\?"(.*?)\.(jpg|png|jpeg|bmp|gif)\\?"/g, 'src="https://pic1.zhimg.com/' + '$1' + '.' + '$2' + '"') + ']]>';;
            items.push({
                title: contenItem.title,
                link: config.link + '/' +contenItem.href.replace(/\/api\/posts\/(.*)/, '$1') + '?refer=' + config.id,
                author: contenItem.author.name,
                pubDate: contenItem.publishedTime,
                description: detailc
            })
        }
        // console.log('items的长度'+items.length);
        for (var itemx = 0; itemx < items.length; itemx++) {
            var desc = items[itemx].description;
            delete items[itemx].description;
            var xmlItems = {
                item: items[itemx]
            };
            desc = '<description>' + desc + '</description>' + '</item>'
            rssXml = rssXml + json2xml(xmlItems).replace('</item>', '') + desc;
            // console.log(json2xml(xmlItems));
        }
        sendDo();
    });
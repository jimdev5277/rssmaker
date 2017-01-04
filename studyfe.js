//引入superagent库
const superagent = require('superagent');
//json 2 xml
const convert = require('data2xml')({
    attrProp: '@',
    valProp: '#',
    cdataProp: '%'
});
// 定时抓取
const schedule = require('node-schedule');
// 写入文件操作
const fs = require('fs');

superagent.get('https://zhuanlan.zhihu.com/api/columns/study-fe/posts?limit=20')
    .end(function (err, sres) {
        // 常规的错误处理
        if (err || !sres.ok) {
        }
        let content = sres.text;
        content = eval('(' + content + ')');
        let items = [];
        //拼接RSS的item数组内容
        for (let contenItem of content) {
            //拼接封面图
            let detailc = '<![CDATA[' + '<img border="none" src="' + contenItem.titleImage + '">' + contenItem.content.replace(/src=\\?"(.*?)\.(jpg|png|jpeg|bmp|gif)\\?"/g, 'src="https://pic1.zhimg.com/' + '$1' + '.' + '$2' + '"') + ']]>';
            items.push({
                title: contenItem.title,
                link: 'https://zhuanlan.zhihu.com/study-fe' + '/' + contenItem.url + '?refer=' + 'study-fe',
                author: contenItem.author.name,
                pubDate: contenItem.publishedTime,
                description: detailc
            })
        }
        console.info(items);//打印查看数组数据
    });
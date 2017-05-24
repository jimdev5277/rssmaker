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
const async = require('async');

let config = require('./config.json');
// config = config.group[0].sundry;

const grabWeb = (configItem, callback) => {

    let getItems = new Promise(function (resolve, reject) {
        superagent.get('https://zhuanlan.zhihu.com/api/columns/' + configItem.id + '/posts?limit=20')
            .end(function (err, sres) {
                // 常规的错误处理
                if (err || !sres.ok) {
                    console.log('网络错误!请检查');
                    reject(err);
                    callback(null, '失败');
                } else {
                    let content = sres.text;
                    content = eval('(' + content + ')');
                    let items = [];
                    //拼接RSS的item数组内容
                    for (let contenItem of content) {
                        //拼接封面图
                        let titleImage = contenItem.titleImage == '' ? '' : '<img border="none" src="' + contenItem.titleImage + '">';
                        let detailc = titleImage + contenItem.content.replace(/src=\\?"(.*?)\.(jpg|png|jpeg|bmp|gif)\\?"/g, 'src="https://pic1.zhimg.com/' + '$1' + '.' + '$2' + '"');
                        items.push({
                            title: contenItem.title,
                            link: 'https://zhuanlan.zhihu.com' + contenItem.url + '?refer=' + configItem.id,
                            author: contenItem.author.name,
                            pubDate: contenItem.publishedTime,
                            description: detailc
                        })
                    }
                    // console.info(items);//打印查看数组数据
                    //aryToXml(items);
                    resolve(items);
                }
            });
    });
    //获得基础信息
    getItems.then(function (items) {
        superagent.get('https://zhuanlan.zhihu.com/api/columns/' + configItem.id)
            .end(function (err, sres) {
                if (err || !sres.ok) {
                    console.log('网络错误!请检查');
                    callback(null, '失败');
                } else {
                    let content = sres.text;
                    content = eval('(' + content + ')');
                    // console.info('rss的标题 ' + content.name);
                    // console.info('rss的描述为 ' + content.description);
                    content.icourl = content.avatar.template.replace('{size}', 'r').replace('{id}', content.avatar.id);
                    // console.info('rss的图片的地址 ' + content.icourl);
                    aryToXml(items, content, configItem, callback);
                }
            })
    })
};

const aryToXml = (items, baseInfo, configItem, callback) => {
    let xlink = 'https://zhuanlan.zhihu.com/' + configItem.id;
    let rs = convert(
        'rss', {
            '@': {
                version: '2.0'
            },
            channel: {
                'title': baseInfo.name,
                'link': xlink,
                'description': baseInfo.description ? baseInfo.description : '',
                'generator': baseInfo.name,
                'image': {
                    'url': baseInfo.icourl ? baseInfo.icourl : 'https://static.zhihu.com/static/favicon.ico',
                    'title': baseInfo.name,
                    'link': xlink
                },
                item: items
            }
        });

    fs.writeFile(configItem.dist, rs, function (err) {
        if (err) throw err;
        callback(null, "成功了");
        // console.log('It\'s saved!'); //文件被保存
    });
};

let j = schedule.scheduleJob('*/3 * * * *', function () {
    async.mapLimit(config.group, 5, function (elem, callback) {
        grabWeb(elem.summary, callback);
    }, function (err, result) {
        if (err) {
            throw new Error(err);
        }
        console.log('final!');
    });

});
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

let config = require('./config.json');
config = config.group[0].sundry;

const grabWeb = function () {

    let getItems = new Promise(function (resolve, reject) {
        superagent.get('https://zhuanlan.zhihu.com/api/columns/' + config.id + '/posts?limit=20')
            .end(function (err, sres) {
                // 常规的错误处理
                if (err || !sres.ok) {
                    console.log('网络错误!请检查');
                    reject(err);
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
                            link: 'https://zhuanlan.zhihu.com' + contenItem.url + '?refer=' + config.id,
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
        superagent.get('https://zhuanlan.zhihu.com/api/columns/' + config.id)
            .end(function (err, sres) {
                if (err || !sres.ok) {
                    console.log('网络错误!请检查');
                } else {
                    let content = sres.text;
                    content = eval('(' + content + ')');
                    // console.info('rss的标题 ' + content.name);
                    // console.info('rss的描述为 ' + content.description);
                    content.icourl = content.avatar.template.replace('{size}', 'r').replace('{id}', content.avatar.id);
                    // console.info('rss的图片的地址 ' + content.icourl);
                    aryToXml(items, content);
                }
            })
    })
};

const aryToXml = function (items, baseInfo) {
    let xlink = 'https://zhuanlan.zhihu.com/' + config.id;
    let rs = convert(
        'rss', {
            '@': {
                version: '2.0'
            },
            channel: {
                'title': baseInfo.name,
                'link': xlink,
                'description': baseInfo.description,
                'generator': baseInfo.name,
                'image': {
                    'url': baseInfo.icourl,
                    'title': baseInfo.name,
                    'link': xlink
                },
                item: items
            }
        });

    fs.writeFile(config.dist, rs, function (err) {
        if (err) throw err;
        // console.log('It\'s saved!'); //文件被保存
    });
};

let j = schedule.scheduleJob('*/3 * * * *', function () {
    grabWeb();
});
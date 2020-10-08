const fs = require('fs');
const https = require('https');
const iconv = require("iconv-lite");
const puppeteer = require('puppeteer-core');
const cheerio = require('cheerio');
const PDFMerger = require('pdf-merger-js');
const process = require('process');
const chromePath = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";

class Pdf {
    constructor(options) {
        this.chapterEntries = []; //目录名和地址
        this.chapterCount = 0;
        this.debug = false;
        this.default_options = {
            pdfEntry: '', //PDF文件访问URL入口
            pdfName: '', //需要打印的PDF文件名
            urlPrefix: '',//URL前缀，
            removePrintCss: false,//时候移除打印CSS
            printContainer: '',//打印的区域包裹的容器
            menuContainer: '',//打印的菜单容器
            dirtyInnerElements: [],//容器里面的元素
            dirtyOuterElements: [],//容器外面的元素
        };
        this.options = Object.assign(this.default_options, options);
        this.cacheFile = this.options.pdfName + '.json'
    }
    run() {
        if (fs.existsSync(this.cacheFile)) {
            let data = fs.readFileSync(this.cacheFile, 'utf-8');
            this.chapterEntries = JSON.parse(data);
            this.onFinishPdfEntry(null, this);
        } else {
            this.visitEntry(this.onFinishPdfEntry);
        }
        let launchOptions = {
            executablePath: chromePath,
            devtools: false
        };
        puppeteer.launch(launchOptions).then(async browser => {
            await this.printChapters(browser, this.chapterEntries);
            await browser.close();
        }).then(() => {
            return;
            this.mergePartPdfFiles(this.chapterEntries, this.options.pdfName);
            console.log("+++++ finish merge file ", this.options.pdfName + ".pdf");
        });

    }
    sleep(time = 0) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, time);
        })
    }

    async onFinishPdfEntry(result, that) {
        if (typeof result === 'string') {
            that.parsePdfMenu(result, that);
            that.saveCacheFile();
        }
        that.chapterCount = that.chapterEntries.length;
        console.log("page count: ", that.chapterCount);
    }
    async printChapters(browser, chapters) {
        for (let i = 0; i < chapters.length; i++) {
            let url = chapters[i].href;
            if (url == '') {
                continue;
            }
            let regex = /\//g; //解决特殊字符问题
            let chapter_name = chapters[i].name.replace(regex, "_")
            await this.printPage(browser, url, chapter_name, i);
            await this.sleep(1000);
            break;
        }
    }
    async printPage(browser, url, filename, chapterNo) {
        console.log(">>>>> 正在打印 " + filename + "_" + chapterNo + ".pdf");
        const page = await browser.newPage();
        await page.setViewport({
            width: 1920,
            height: 1080,
            // deviceScaleFactor: 1,
        });
        await page.goto(url, { waitUntil: 'networkidle0' });
        await page.emulateMediaType('print');
        await page.evaluate((removePrintCss, printContainer, dirtyInnerElements, dirtyOuterElements) => {
            //移除打印样式
            if (removePrintCss) {
                console.log("REMOVE PRINT CSS");
                for (var i = document.styleSheets[0].rules.length - 1; i > 0; i--) {
                    if (document.styleSheets[0].rules[i].cssText.indexOf("@media print") != -1) {
                        document.styleSheets[0].deleteRule(i);
                    }
                }
            }
            //移除脏元素
            if (printContainer != 'body') {
                const elements = document.querySelector('body').children;
                let isId = printContainer.substr(0, 1) == '#' ? true : false;
                let printContainerId = printContainer.substring(1);
                for (let i = 0; i < elements.length; i++) {
                    if (isId) {
                        if (elements[i].id != printContainerId) {
                            elements[i].style.display = 'none';
                            console.log("REMOVE UNUSED ELEMENT");
                        } else {

                        }
                    }
                }
            }
            for (let j = 0; j < dirtyInnerElements.length; j++) {
                const innerNodes = document.querySelectorAll(dirtyInnerElements[j]);
                innerNodes.forEach(function (node) {
                    node.remove();
                });
            }
            for (let j = 0; j < dirtyOuterElements.length; j++) {
                const outerNodes = document.querySelectorAll(dirtyOuterElements[j]);
                outerNodes.forEach(function (node) {
                    node.remove();
                });
            }
        }, this.options.removePrintCss, this.options.printContainer, this.options.dirtyInnerElements, this.options.dirtyOuterElements);
        page.on('console', msg => console.log(msg.text()));
        await page.pdf({
            path: "./temp/" + filename + "_" + chapterNo + '.pdf',
            format: 'A4',
            printBackground: true,
        });
    }

    async mergePartPdfFiles(data, fileName) {
        console.log("++++++++++ 合并 " + fileName + ".pdf ++++++++++");
        var merger = new PDFMerger();
        for (let i = 0; i < data.length; i++) {
            if (data[i].name == 'Index') {
                continue;
            }
            if (data[i].href == '') {
                continue;
            }
            let regex = /\//g; //解决特殊字符问题
            let chapter_name = data[i].name.replace(regex, "_")
            merger.add("./temp/" + chapter_name + "_" + i + '.pdf');
        }
        await merger.save('./ebooks/' + fileName + '.pdf');
    }

    //移除打印样式
    removePrintCss() {

    }

    //解析网站目录
    async visitEntry(callback) {
        let that = this;
        const req = https.get(this.options.pdfEntry, (res) => {
            let html = [];
            let size = 0;
            res.on('data', (data) => {
                html.push(data);
                size += data.length;
            });
            res.on("end", function () {
                let buf = Buffer.concat(html, size);
                let result = iconv.decode(buf, "utf8");//转码//var result = buff.toString();//不需要转编码,直接tostring
                if (typeof callback === 'function') {
                    callback(result, that);
                }
            });
        });
        req.on('error', (e) => {
            console.error(e);
        });
    }
    //解析菜单
    parsePdfMenu(data, that) {
        let $ = cheerio.load(data);
        let $container = $(that.options.menuContainer);
        let $a = $container.find('a');
        $a.each((index, item) => {
            let href = $(item).attr('href');
            if (href != '' && href != undefined) {
                if (href.substr(0, 4) != 'http') {
                    href = that.options.urlPrefix + href;
                }
                let title = '';
                let hasChildrenNode = $(item).children().length == 0 ? false : true;
                if (!hasChildrenNode) {
                    title = $(item).text();
                } else {
                    title = $(item).find('span').text();
                }
                title = $(item).text();
                let regex = /\n\s+/g;
                title = title.replace(regex, '');
                that.chapterEntries.push({ 'href': href, 'name': title });
            }
        });
    }

    saveCacheFile() {
        let data = JSON.stringify(this.chapterEntries, null, 4);
        fs.writeFileSync(this.cacheFile, data);
        console.log(data);
    }
}

module.exports = Pdf;
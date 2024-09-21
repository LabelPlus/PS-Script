// LabelPlus专用格式TextReader
/// <reference path="legacy.d.ts" />

namespace LabelPlus {

export interface LpLabel {
    x: number;
    y: number;
    contents: string;
    group: string;
};

export type LpLabelDict = {
    [key: string]: LpLabel[]
};

export interface LpFile {
    path: string;
	groups: string[];
	images: LpLabelDict;
};

export function lpTextParser(path: string): LpFile | null
{
    var f = new File(path);
    if (!f || !f.exists) {
        log_err("LabelPlusTextReader: file " + path + " not exists");
        return null;
    }

    // 打开
    f.open("r");
    f.encoding = 'UTF-8';

    // json格式读取
    if (path.substring(path.lastIndexOf("."), path.length) == '.json') {
        f.open("r", "TEXT", "????");
        f.lineFeed = "unix";
        f.encoding = 'UTF-8';
        var json = f.read();
        var data = (new Function('return ' + json))();
        f.close();
        return data;
    }

    // 分行读取
    var state = 'start'; //'start','filehead','context'
    var notDealStr;
    var notDealLabelheadMsg;
    var nowFilename;
    var labelData = new Array();
    var filenameList = new Array();
    var groupData;
    var lineMsg;

    for (var i = 0; !f.eof; i++) {
        var lineStr = f.readln();
        lineMsg = judgeLineType(lineStr);
        switch (lineMsg.Type) {
            case 'filehead':
                if (state == 'start') {
                    //处理start blocks
                    var result = readStartBlocks(notDealStr);
                    if (!result) {
                        log_err("readStartBlocks fail");
                        return null;
                    }
                    groupData = result.Groups;
                }
                else if (state == 'filehead') {
                }
                else if (state == 'context') {
                    //保存label
                    labelData[nowFilename].push(
                        {
                            LabelheadValue: notDealLabelheadMsg.Values,
                            LabelString: notDealStr.trim()
                        }
                    );
                }

                //新建文件项
                labelData[lineMsg.Title] = new Array();
                filenameList.push(lineMsg.Title);
                nowFilename = lineMsg.Title;
                notDealStr = "";
                state = 'filehead';
                break;

            case 'labelhead':
                if (state == 'start') {
                    log_err("start-filehead not found...");
                    return null;
                }
                else if (state == 'filehead') {
                }
                else if (state == 'context') {
                    labelData[nowFilename].push(
                        {
                            LabelheadValue: notDealLabelheadMsg.Values,
                            LabelString: notDealStr.trim()
                        }
                    );
                }

                notDealStr = "";
                notDealLabelheadMsg = lineMsg;
                state = 'context';
                break;

            case 'unknown':
                notDealStr += "\r" + lineStr;
                break;
        }
    }

    if (state == 'context' && lineMsg.Type == 'unknown') {
        labelData[nowFilename].push(
            {
                LabelheadValue: notDealLabelheadMsg.Values,
                LabelString: notDealStr.trim()
            }
        );
    }

    // output
    let label_dict: LpLabelDict = {};
    for (let i = 0; i < filenameList.length; i++) {
        let img_name = filenameList[i];
        let labels_of_image: LpLabel[] = new Array();
        for (let j = 0; j < labelData[img_name].length; j++) {
            let data = labelData[img_name][j];
            let l: LpLabel = {
                x: data.LabelheadValue[0],
                y: data.LabelheadValue[1],
                group: groupData[data.LabelheadValue[2] - 1],
                contents: data.LabelString,
            };
            labels_of_image.push(l);
        }
        label_dict[img_name] = labels_of_image;
    }
    let dat: LpFile = {
        path:   <string> path,
        groups: <string[]> groupData,
        images: label_dict,
    };
    return dat;
};

//
// 判断字符串行类型 'filehead','labelhead','unknown'
// filehead:    >>>>>>[filename]<<<<<<
// labelhead:   ------[num]------[value, list]
//
function judgeLineType(str: string) {
    let index = 0;
    var result = {
        Type: 'unknown',
        Title: '',
        Values: [''],
    };

    // FIXME handle invalid string format error
    str = str.trim();
    if (str.substr(0, 6) == '>>>>>>') { // assumed to be a file name
        str = str.slice(2 + str.indexOf(">["));
        if ((index = str.search(/\]<{6,}$/)) < 0)
            return result;
        result.Title = str.substring(0, index);
        result.Type = 'filehead';
    } else if (str.substr(0, 6) == '------') { // assumed to be a label
        str = str.slice(2 + str.indexOf("-["));
        if ((index = str.search(/\]-{6,}\[/)) < 0)
            return result;
        result.Title = str.substring(0, index);
        str = str.slice(2 + str.indexOf("-["))
        if ((index = str.search(/\]$/)) < 0)
            return result;
        str = str.substring(0, index);
        result.Values = str.split(',');
        result.Type = 'labelhead';
    }

    return result;
};

function readStartBlocks(str: string) {
    var blocks = str.split("-");
    if (blocks.length < 3) {
        log_err("Start blocks format error!");
        return null;
    }

    //block1 文件头
    var filehead = blocks[0].split(",");
    if (filehead.length < 2) {
        log_err("filehead format error!");
        return null;
    }
    var first_version = parseInt(filehead[0]);
    var last_version = parseInt(filehead[1]);

    //block2 分组信息
    var groups = blocks[1].trim().split("\r");
    for (var i = 0; i < groups.length; i++)
        groups[i] = groups[i].trim();

    //block末
    var comment = blocks[blocks.length - 1];

    return {
        FirstVer: first_version,
        LastVer: last_version,
        Groups: groups,
        Comment: comment,
    };
};

} // namespace LabelPlus

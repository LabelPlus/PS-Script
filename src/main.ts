//
//   LabelPlus_Ps_Script.jsx
//   This is a Input Text Tool for LabelPlus Text File.
//
// Copyright 2015, Noodlefighter
// Released under GPL License.
//
// License: http://noodlefighter.com/label_plus/license
//

import "./xtools/xlib/stdlib.js";
declare var Stdlib: any;
declare function isMac(): any;
declare function toBoolean(n: any): boolean;
declare var Error: any;

import "./xtools/xlib/GenericUI.jsx";
declare var GenericUI: any;

import "my_action.js"
declare var MyAction: any;

import "text_reader.js"
declare var LabelPlusTextReader: any;

/// <reference path="i18n.ts" />
/// <reference path="version.ts" />

// Operating System related
let dirSeparator = $.os.search(/windows/i) === -1 ? '/' : '\\';

let GetScriptPath = function (): string {
    return <string>$.fileName;
}

let GetScriptFolder = function (): string {
    return (new Folder(GetScriptPath())).path;
}

function FileIsExists(path: string): boolean {
    return (new File(path)).exists;
}

function Emit(func: Function): void {
    if (func !== undefined)
        func();
}

//
// 初始设置
//

enum OptionDocTemplete { Auto, No, Custom }; // 自动选择模板、不使用模板、自定义模板文件
enum OptionTextDirection { Keep, Horizontal, Vertical };
class LabelPlusInputOptions {
    constructor(obj: Object) {
        let self = this;
        Stdlib.copyFromTo(obj, self);
    }

    source: string = ""; // 图源文件夹
    target: string = ""; // 输出文件夹
    labelFilename: string = ""; // 翻译文本的文件名
    labelFilePath: string = ""; // 翻译文本所在文件夹
    imageSelected: { text: string, index: number }[] = []; // 被选中的图片列表
    groupSelected: string[] = []; // 被选中的分组列表

    // ------------------------------------可保存设置，均为string
    docTemplete: OptionDocTemplete = OptionDocTemplete.Auto; // 模板设置
    docTempleteCustomPath: string = "";  // 自定义模板文件路径

    ignoreImgFileName: boolean = false; // 按文件顺序输出，忽略翻译文件中的图片文件名，便于更换图源
    sourceFileType: string = ""; // 更改图源文件类型，用于更换图源，为空时不更改
    outputNoSignPsd: boolean = true; // 是否输出未标号的图片
    layerNotGroup: boolean = false; // 图层不分组
    notClose: boolean = false; // 导入图片后不关闭文档

    font: string = ""; // 设置的字体，为空时不设置
    fontSize: number = 0; // 字体大小，为0时不设置
    textLeading: number = 0; // 行距值，百分比，为0时不设置
    textReplace: string = ""; // 文本替换规则，为空时不替换
    outputLabelNumber: boolean = false; // 是否输出标号
    horizontalText: OptionTextDirection = OptionTextDirection.Keep; // 输出文本的阅读方向

    runActionGroup: string = ""; // 导入文本图层后执行的动作组的名字
    overloayGroup: string = ""; // 执行简易涂白的分组
};

//
// 用户UI
//
class LabelPlusInput extends GenericUI {
    constructor() {
        super();

        let self = this;
        self.saveIni = false;
        self.hasBorder = true;
        self.optionsClass = LabelPlusInputOptions;
        self.settingsPanel = false; //有自己创建的设置面板

        self.winRect = {          // the size of our window
            x: 200,
            y: 200,
            w: 875,
            h: 685
        };

        self.title = i18n.APPNAME + " " + Global.VER;	// our window title
        self.notesSize = 75;
        self.notesTxt = i18n.TIP_TITLE;
        self.documentation = i18n.TIP_TEXT;

        self.processTxt = i18n.BUTTON_RUN;
        self.cancelTxt = i18n.BUTTON_CANCEL;
    }
}

//
// 用户界面构建
//
LabelPlusInput.prototype.createPanel = function (pnl: any, ini: any) {
    let self = this;
    let opts = new LabelPlusInputOptions(ini);// default values

    // window's location
    self.moveWindow(100, 100);

    let xOfs = 10;
    let yOfs = 10;
    let xx = xOfs;
    let yy = yOfs;

    //------------------自己创建的配置面板------------------

    pnl.settingsPnl = pnl.add('panel',
        [xOfs, yy, pnl.size.width - xOfs, yy + 60]);

    createSettingsPanel(pnl.settingsPnl, ini);

    xx = xOfs;
    yy += 75;
    yOfs = yy;
    //------------------LabelPlus文件区------------------

    // LabelPlus文本文件输入
    pnl.lpTextFileLabel = pnl.add('statictext', [xx, yy, xx + 120, yy + 20],
        i18n.LABEL_TEXTFILE);
    xx += 120;
    pnl.lpTextFileTextBox = pnl.add('edittext', [xx, yy, xx + 170, yy + 20], '');
    pnl.lpTextFileTextBox.enabled = false;
    xx += 175;
    pnl.lpTextFileBrowseButton = pnl.add('button', [xx, yy, xx + 30, yy + 20], '...');

    pnl.lpTextFileBrowseButton.onClick = function () {
        try {
            let pnl = this.parent;
            let fmask = "*.txt;*.json";
            let f = File.openDialog(i18n.LABEL_TEXTFILE, fmask);

            if (f && f.exists) {
                pnl.lpTextFileTextBox.text = decodeURI(f.fsName);

                //图源、输出文件夹赋上目录
                let fl = new Folder(f.path);
                pnl.sourceTextBox.text = decodeURI(fl.fsName);
                pnl.targetTextBox.text = decodeURI(fl.fsName) + dirSeparator + 'output';

            }
            else {
                return;        //取消
            }

            pnl.chooseImageListBox.removeAll();
            pnl.chooseGroupListBox.removeAll();

            // 读取LabelPlus文件
            let labelFile;
            try {
                labelFile = new LabelPlusTextReader(pnl.lpTextFileTextBox.text);
            }
            catch (err) {
                alert(err);
                return;
            }

            // 填充图片选择列表
            let iarr = labelFile.ImageList;
            if (iarr) {
                for (let i = 0; i < iarr.length; i++) {
                    pnl.chooseImageListBox[i] = pnl.chooseImageListBox.add('item', iarr[i], i);
                    pnl.chooseImageListBox[i].selected = true;
                }
            }

            // 填充分组选择列表
            let garr = labelFile.GroupData;
            if (garr) {
                for (let i = 0; i < garr.length; i++) {
                    if (garr[i] == "")
                        continue;
                    pnl.chooseGroupListBox[i] = pnl.chooseGroupListBox.add('item', garr[i], i);
                    pnl.chooseGroupListBox[i].selected = true;

                    // 涂白 指定分组文本框若空 填第一个分组
                    if (pnl.overlayGroupTextBox.text == "") {
                        pnl.overlayGroupTextBox.text = garr[i];
                    }
                }
            }

            pnl.labelFile = labelFile;  //返回LabelPlusTextReader对象

        } catch (e) {
            alert(Stdlib.exceptionMessage(e));
        }
    };


    //------------------图片选择区------------------
    yy = yOfs + 35;
    xx = xOfs;

    // 选择需要导入的图片
    pnl.chooseImageLabel = pnl.add('statictext', [xx, yy, xx + 150, yy + 22], i18n.LABEL_SELECTIMAGE);
    yy += 20;
    pnl.chooseImageListBox = pnl.add('listbox', [xx, yy, xx + 150, yy + 285], [], { multiselect: true });

    //------------------分组选择区------------------
    yy = yOfs + 35;
    xOfs += 170;
    xx = xOfs;

    //选择需要导入的分组
    pnl.chooseGroupLabel = pnl.add('statictext', [xx, yy, xx + 150, yy + 22], i18n.LABEL_SELECTGROUP);
    yy += 20;
    pnl.chooseGroupListBox = pnl.add('listbox', [xx, yy, xx + 150, yy + 285], [], { multiselect: true });

    //------------------设置区------------------
    yy = yOfs;
    xOfs = 10 + 345;
    xx = xOfs;

    // >>>>>文件 预处理
    pnl.add('statictext', [xx, yy, xx + 120, yy + 20], i18n.LABEL_TIP_FILE);
    yy += 20;
    // 图源文件夹
    pnl.sourceLabel = pnl.add('statictext', [xx, yy, xx + 120, yy + 20], i18n.LABEL_SOURCE);
    xx += 120;
    pnl.sourceTextBox = pnl.add('edittext', [xx, yy, xx + 300, yy + 20], '');
    xx += 305;
    pnl.sourceBrowse = pnl.add('button', [xx, yy, xx + 30, yy + 20], '...');

    pnl.sourceBrowse.onClick = function () {
        try {
            let pnl = this.parent;
            let def :string = (pnl.sourceTextBox.text ?
                pnl.sourceTextBox.text : Folder.desktop);
            let f = Stdlib.selectFolder(i18n.LABEL_SOURCE, def);
            if (f) {
                pnl.sourceTextBox.text = decodeURI(f.fsName);
                if (!pnl.targetTextBox.text) {
                    pnl.targetTextBox.text = pnl.sourceTextBox.text;
                }
            }
        } catch (e) {
            alert(Stdlib.exceptionMessage(e));
        }
    };

    xx = xOfs;
    yy += 25;

    // 输出目录
    pnl.targetLabel = pnl.add('statictext', [xx, yy, xx + 120, yy + 20], i18n.LABEL_TARGET);
    xx += 120;
    pnl.targetTextBox = pnl.add('edittext', [xx, yy, xx + 300, yy + 20], '');
    xx += 305;
    pnl.targetBrowse = pnl.add('button', [xx, yy, xx + 30, yy + 20], '...');

    pnl.targetBrowse.onClick = function () {
        try {
            let pnl = this.parent;
            let f;
            let def = pnl.targetTextBox.text;
            if (!def) {
                if (pnl.sourceTextBox.text) {
                    def = pnl.sourceTextBox.text;
                } else {
                    def = Folder.desktop;
                }
            }
            f = Stdlib.selectFolder(i18n.LABEL_TARGET, def);

            if (f) {
                pnl.targetTextBox.text = decodeURI(f.fsName);
            }
        } catch (e) {
            alert(Stdlib.exceptionMessage(e));
        }
    };

    xx = xOfs;
    yy += 25;

    // 无视LabelPlus文本中的图源文件名
    pnl.ignoreImgFileNameCheckBox = pnl.add('checkbox', [xx, yy, xx + 250, yy + 22], i18n.CHECKBOX_AutoMatchImgFile);
    pnl.ignoreImgFileNameCheckBox.onClick = function () {
        pnl.setSourceFileTypeCheckBox.value = false;	// 与指定图源互斥
        pnl.ignoreImgFileNameTestButton.enabled = pnl.ignoreImgFileNameCheckBox.value;
    }
    xx += 260;
    pnl.ignoreImgFileNameTestButton = pnl.add('button', [xx, yy - 5, xx + 80, yy + 20], i18n.BUTTON_AutoMatchImgFilePreview);
    pnl.ignoreImgFileNameTestButton.enabled = false;

    // 预览无视文件名效果
    pnl.ignoreImgFileNameTestButton.onClick = function () {
        let originFileNameList = getFilesListOfPath(pnl.sourceTextBox.text);
        let selectedImgFileNameList = getSelectedItemsText(pnl.chooseImageListBox);

        let preview_list_string = '';
        for (let i = 0; i < selectedImgFileNameList.length; i++) {
            if (i >= 10) {
                break;
            }
            if (!originFileNameList[i]) {
                break;
            }
            preview_list_string = preview_list_string + selectedImgFileNameList[i].text + " -> "
                + originFileNameList[selectedImgFileNameList[i].index] + "\n";
        }
        alert(preview_list_string);
    }

    xx = xOfs;
    yy += 20;

    // 使用指定类型图源
    pnl.setSourceFileTypeCheckBox = pnl.add('checkbox', [xx, yy, xx + 250, yy + 22], i18n.CHECKBOX_SetSourceType);
    pnl.setSourceFileTypeCheckBox.onClick = function () {
        pnl.ignoreImgFileNameCheckBox.value = false;	//与无视图源文件名互斥
        pnl.setSourceFileTypeList.enabled = pnl.setSourceFileTypeCheckBox.value;
    }
    xx += 260;
    let setSourceFileTypeListItems = [".psd", ".png", ".jpg", ".jpeg", ".tif", ".tiff"];
    pnl.setSourceFileTypeList = pnl.add('dropdownlist', [xx, yy, xx + 70, yy + 22],
        setSourceFileTypeListItems);
    pnl.setSourceFileTypeList.selection = pnl.setSourceFileTypeList.find(".psd");
    pnl.setSourceFileTypeList.enabled = false;

    xx = xOfs;
    yy += 20;

    // 文本替换(例:"A->B|C->D")
    pnl.textReplaceCheckBox = pnl.add('checkbox', [xx, yy, xx + 250, yy + 22], i18n.CHECKBOX_TextReplace);
    pnl.textReplaceCheckBox.onClick = function () {
        pnl.textReplaceTextBox.enabled = pnl.textReplaceCheckBox.value;
    };
    xx += 260;
    pnl.textReplaceTextBox = pnl.add('edittext', [xx, yy, xx + 180, yy + 20]);
    pnl.textReplaceTextBox.text = "！？->!?|...->…";
    pnl.textReplaceTextBox.enabled = false;
    xx = xOfs;
    yy += 20;


    // >>>>>脚本行为
    yy += 5;
    pnl.add('statictext', [xx, yy, xx + 120, yy + 20], i18n.LABEL_TIP_Behavior);
    yy += 20;

    // 处理无标号文档
    pnl.outputNoSignPsdCheckBox = pnl.add('checkbox', [xx, yy, xx + 250, yy + 22], i18n.CHECKBOX_OUTPUTNOSIGNPSD);
    pnl.outputNoSignPsdCheckBox.value = true;
    xx += 250;

    // 导入后不关闭文档
    pnl.notCloseCheckBox = pnl.add('checkbox', [xx, yy, xx + 250, yy + 22], i18n.CHECKBOX_NOTCLOSE);
    xx = xOfs;
    yy += 20;

    // 导出标号选项
    pnl.outputLabelNumberCheckBox = pnl.add('checkbox', [xx, yy, xx + 250, yy + 22], i18n.CHECKBOX_OUTPUTLABELNUMBER);
    xx += 250;

    // 不对图层进行分组
    pnl.layerNotGroupCheckBox = pnl.add('checkbox', [xx, yy, xx + 250, yy + 22], i18n.CHECKBOX_LAYERNOTGROUP);
    yy += 20;

    // >>>>>格式 / 自动化
    xx = xOfs;
    yy += 5;
    pnl.add('statictext', [xx, yy, xx + 120, yy + 20], i18n.LABEL_TIP_STYLE_AUTO);
    yy += 20;

    // 文档模板设置
    pnl.docTempletePnl = pnl.add('panel', [xx, yy, xx + 480, yy + 65], i18n.PANEL_DocTempleteSetting);
    {
        let pnll: any = pnl.docTempletePnl;
        let xxxOfs: number = 5;
        let xxx: number = xxxOfs;
        let yyy: number = 5;
        pnll.autoTempleteRb = pnll.add('radiobutton',  [xxx, yyy, xxx + 200, yyy + 22], i18n.RB_AutoTemplete); xxx += 200;
        pnll.autoTempleteRb.value = true;
        pnll.noTempleteRb = pnll.add('radiobutton',  [xxx, yyy, xxx + 200, yyy + 22], i18n.RB_NoTemplete); xxx += 200;
        xxx = xxxOfs;
        yyy += 22;
        pnll.customTempleteRb = pnll.add('radiobutton', [xxx, yyy, xxx + 120, yyy + 22], i18n.RB_CustomTemplete); xxx += 120;
        pnll.customTempleteTextbox = pnll.add('edittext', [xxx, yyy, xxx + 180, yyy + 22]); xxx += 185;
        pnll.customTempleteTextButton = pnll.add('button', [xxx, yyy, xxx + 30, yyy + 22], '...'); xxx += 30;
        let rbclick = function () {
            let custom_enable: boolean = pnll.customTempleteRb.value;
            pnll.customTempleteTextbox.enabled = custom_enable;
            pnll.customTempleteTextButton.enabled = custom_enable;
        };
        pnll.autoTempleteRb.onClick = rbclick;
        pnll.noTempleteRb.onClick = rbclick;
        pnll.customTempleteRb.onClick = rbclick;
        rbclick();

        pnll.customTempleteTextButton.onClick = function () {
            try {
                let def: string;
                if (pnll.customTempleteTextbox.text !== "") {
                    def = pnll.customTempleteTextbox.text;
                } else if (pnl.sourceTextBox.text !== "") {
                    def = pnl.sourceTextBox.text;
                } else {
                    def = Folder.desktop.path;
                }
                let f = Stdlib.selectFileOpen(i18n.RB_CustomTemplete, "*.psd;*.tif;*.tiff", def);
                if (f)
                    pnll.customTempleteTextbox.text = decodeURI(f.fsName);
            } catch (e) {
                alert(Stdlib.exceptionMessage(e));
            }
        };
    }
    xx = xOfs;
    yy += 65;

    // 使用自定义字体设置
    pnl.setFontCheckBox = pnl.add('checkbox', [xx, yy, xx + 250, yy + 22], i18n.CHECKBOX_SetFont);
    pnl.setFontCheckBox.onClick = function () {
        let value = pnl.setFontCheckBox.value;
        pnl.font.family.enabled = value;
        pnl.font.style.enabled = value;
        pnl.font.fontSize.enabled = value;
    }
    xx = xOfs;
    yy += 25;
    // 字体
    pnl.font = pnl.add('group', [xx, yy, xx + 400, yy + 25]);
    self.createFontPanel(pnl.font, ini);
    pnl.font.label.text = " ";
    pnl.font.family.enabled = false;
    pnl.font.style.enabled = false;
    pnl.font.fontSize.enabled = false;
    pnl.font.family.selection = pnl.font.family.find("SimSun");

    xx = xOfs;
    yy += 25;

    // 自定义行距
    pnl.setTextLeadingCheckBox = pnl.add('checkbox', [xx, yy, xx + 120, yy + 20], i18n.CHECKBOX_SetLeading);
    pnl.setTextLeadingCheckBox.onClick = function () {
        pnl.textLeadingTextBox.enabled = pnl.setTextLeadingCheckBox.value;
    }
    xx += 120
    pnl.textLeadingTextBox = pnl.add('edittext', [xx, yy, xx + 50, yy + 20]);
    pnl.textLeadingTextBox.enabled = false;
    pnl.textLeadingTextBox.text = "120";
    xx += 55;
    pnl.add('statictext', [xx, yy, xx + 40, yy + 20], "%");
    xx = xOfs;
    yy += 20;

    // 输出横排文字
    pnl.outputHorizontalCheckBox = pnl.add('checkbox', [xx, yy, xx + 250, yy + 22], i18n.CHECKBOX_OutputHorizontalText);
    xx = xOfs;
    yy += 20;

    // 执行动作GroupN
    pnl.runActionGroupCheckBox = pnl.add('checkbox', [xx, yy, xx + 500, yy + 22],
        i18n.CHECKBOX_RUNACTION);
    pnl.runActionGroupCheckBox.onClick = function () {
        pnl.runActionGroupList.enabled = pnl.runActionGroupCheckBox.value;
    }
    xx = xOfs + 30;
    yy += 20;
    let ary = Stdlib.getActionSets();
    pnl.runActionGroupList = pnl.add('dropdownlist', [xx, yy, xx + 180, yy + 22], ary);
    pnl.runActionGroupList.selection = pnl.runActionGroupList.find("LabelPlusAction");
    if (pnl.runActionGroupList.selection == undefined) {
        pnl.runActionGroupList.selection = pnl.runActionGroupList[0];
    }
    pnl.runActionGroupList.enabled = false;

    xx = xOfs;
    yy += 20;

    // 涂白功能选项
    pnl.overlayCheckBox = pnl.add('checkbox', [xx, yy, xx + 300, yy + 22], i18n.CHECKBOX_OVERLAY);
    pnl.overlayCheckBox.onClick = function () {
        pnl.overlayGroupTextBox.enabled = pnl.overlayCheckBox.value;
    }
    xx += 300;

    pnl.overlayGroupTextBox = pnl.add('edittext', [xx, yy, xx + 180, yy + 20]);
    pnl.overlayGroupTextBox.enabled = false;

    //------------------读取配置区------------------
    //note: opts由外部传入，可能为undefined，必须检验

    //文本替换
    if (opts.textReplace !== undefined) {
        pnl.textReplaceCheckBox.value = (opts.textReplace !== "");
        pnl.textReplaceTextBox.text = opts.textReplace;
        Emit(pnl.textReplaceCheckBox.onClick);
    }
    // 文档模板
    if (opts.docTemplete !== undefined) {
        pnl.docTempletePnl.autoTempleteRb = false;
        pnl.docTempletePnl.noTempleteRb.value = false;
        pnl.docTempletePnl.customTempleteRb = false;
        switch (opts.docTemplete) {
        case OptionDocTemplete.No:
            pnl.docTempletePnl.noTempleteRb.value = true;
            break;
        case OptionDocTemplete.Custom:
            pnl.docTempletePnl.customTempleteRb.value = true;
            pnl.docTempletePnl.customTempleteTextbox.text = opts.docTempleteCustomPath;
            break;
        case OptionDocTemplete.Auto:
        default:
            pnl.docTempletePnl.autoTempleteRb.value = true;
            break;
        }
        Emit(pnl.docTempletePnl.autoTempleteRb.onClick);
    }
    // 字体
    if (opts.font !== undefined) {
        if (opts.font === "") {
            pnl.setFontCheckBox.value = false;
        } else {
            pnl.setFontCheckBox.value = true;
            pnl.font.setFont(opts.font, opts.fontSize);
        }
        Emit(pnl.setFontCheckBox.onClick);
    }
    // 行距
    if (opts.textLeading !== undefined) {
        if (opts.textLeading === 0) {
            pnl.setTextLeadingCheckBox.value = false;
        } else {
            pnl.setTextLeadingCheckBox.value = true;
            pnl.textLeadingTextBox.text = opts.textLeading;
        }
        Emit(pnl.setTextLeadingCheckBox.onClick);
    }
    // 导出标号选项
    if (opts.outputLabelNumber !== undefined) {
        pnl.outputLabelNumberCheckBox.value = opts.outputLabelNumber;
        Emit(pnl.outputLabelNumberCheckBox.onClick);
    }
    // 输出横排文字
    if (opts.horizontalText !== undefined) {
        pnl.outputHorizontalCheckBox.value = opts.horizontalText;
        Emit(pnl.outputHorizontalCheckBox.onClick);
    }
    // 处理无标号文档
    if (opts.outputNoSignPsd !== undefined) {
        pnl.outputNoSignPsdCheckBox.value = opts.outputNoSignPsd;
        Emit(pnl.outputNoSignPsdCheckBox.onClick);
    }
    // 无视LabelPlus文本中的图源文件名
    if (opts.ignoreImgFileName !== undefined) {
        pnl.ignoreImgFileNameCheckBox.value = opts.ignoreImgFileName;
        Emit(pnl.ignoreImgFileNameCheckBox.onClick);
    }
    // 使用指定类型图源
    if (opts.sourceFileType !== undefined) {
        pnl.setSourceFileTypeCheckBox.value = (opts.sourceFileType !== "");
        pnl.setSourceFileTypeList.selection.text = opts.sourceFileType;
        Emit(pnl.setSourceFileTypeCheckBox.onClick);
    }
    // 执行动作GroupN
    if (opts.runActionGroup !== undefined) {
        pnl.runActionGroupCheckBox.value = (opts.runActionGroup !== "");
        let item = pnl.runActionGroupList.find(opts.runActionGroup);
        if (item !== undefined)
            pnl.runActionGroupList.selection = item;
        Emit(pnl.runActionGroupCheckBox.onClick);
    }
    // 导入后不关闭文档
    if (opts.notClose !== undefined) {
        pnl.notCloseCheckBox.value = opts.notClose;
        Emit(pnl.notCloseCheckBox.onClick);
    }

    // 不对图层进行分组
    if (opts.layerNotGroup !== undefined) {
        pnl.layerNotGroupCheckBox.value = opts.layerNotGroup;
        Emit(pnl.layerNotGroupCheckBox.onClick);
    }

    // 涂白
    if (opts.overloayGroup !== undefined) {
        pnl.overlayCheckBox.value = (opts.overloayGroup !== "");
        pnl.overlayGroupTextBox.text = opts.overloayGroup;
        Emit(pnl.overlayCheckBox.onClick);
    }

    return pnl;
};

//
// 自定义读取配框
//
let createSettingsPanel = function (pnl: any, ini: any) {
    let win = GenericUI.getWindow(pnl.parent);

    pnl.text = i18n.LABEL_SETTING;
    pnl.win = win;

    pnl.fileMask = "INI Files: *.ini, All Files: *.*";
    pnl.loadPrompt = "Read Setting";
    pnl.savePrompt = "Save Setting";
    pnl.defaultFile = undefined;

    let w = pnl.bounds[2] - pnl.bounds[0];
    let offsets = [w * 0.2, w * 0.5, w * 0.8];
    let y = 15;
    let bw = 90;

    let x = offsets[0] - (bw / 2);
    pnl.load = pnl.add('button', [x, y, x + bw, y + 20], i18n.BUTTON_LOAD);
    x = offsets[1] - (bw / 2);
    pnl.save = pnl.add('button', [x, y, x + bw, y + 20], i18n.BUTTON_SAVE);
    x = offsets[2] - (bw / 2);
    pnl.reset = pnl.add('button', [x, y, x + bw, y + 20], i18n.BUTTON_RESET);

    pnl.load.onClick = function () {
        let pnl = this.parent;
        let win = pnl.win;
        let mgr = win.mgr;
        let def = pnl.defaultFile;

        if (!def) {
            if (mgr.iniFile) {
                def = GenericUI.iniFileToFile(mgr.iniFile);
            } else {
                def = GenericUI.iniFileToFile("~/settings.ini");
            }
        }

        let f;
        let prmpt = pnl.loadPrompt;
        let sel = Stdlib.createFileSelect(pnl.fileMask);
        if (isMac()) {
            sel = undefined;
        }
        f = Stdlib.selectFileOpen(prmpt, sel, def);
        if (f) {
            win.ini = readIni(f);
            win.close(4);

            if (pnl.onLoad) {
                pnl.onLoad(f);
            }
        }
    };

    pnl.save.onClick = function () {
        let pnl = this.parent;
        let win = pnl.win;
        let mgr = win.mgr;
        let def = pnl.defaultFile;

        if (!def) {
            if (mgr.iniFile) {
                def = GenericUI.iniFileToFile(mgr.iniFile);
            } else {
                def = GenericUI.iniFileToFile("~/settings.ini");
            }
        }

        let f;
        let prmpt = pnl.savePrompt;
        let sel = Stdlib.createFileSelect(pnl.fileMask);

        if (isMac()) {
            sel = undefined;
        }
        f = Stdlib.selectFileSave(prmpt, sel, def);

        if (f) {
            let mgr = win.mgr;
            let res = mgr.validatePanel(win.appPnl, win.ini, true);

            if (typeof (res) != 'boolean') {
                writeIni(f, res);

                if (pnl.onSave) {
                    pnl.onSave(f);
                }
            }
        }
    };

    pnl.reset.onClick = function () {
        let pnl = this.parent;
        let win = pnl.win;
        let mgr = win.mgr;

        if (mgr.defaultIniFile) {
            win.ini = mgr.readIniFile(mgr.defaultIniFile);

        } else if (mgr.ini) {
            win.ini = mgr.ini;
        }

        win.close(4);
        if (pnl.onReset) {
            pnl.onReset();
        }
    };
};

//
// 读出用户UI数据
//
LabelPlusInput.prototype.validatePanel = function (pnl: any, ini: any, tofile: boolean) :LabelPlusInputOptions {
    let self = this;
    let opts = new LabelPlusInputOptions(ini);

    let f: any;

    // 写配置项时无需存储这些
    if (!tofile) {
        // 图源文件夹
        if (pnl.sourceTextBox.text) {
            f = new Folder(pnl.sourceTextBox.text);
        }
        else {
            return self.errorPrompt(i18n.ERROR_NOTFOUNDSOURCE);
        }

        if (!f || !f.exists) {
            return self.errorPrompt(i18n.ERROR_NOTFOUNDSOURCE);
        }
        opts.source = decodeURI(f.fsName)

        // 输出目录
        if (pnl.targetTextBox.text) {
            f = new Folder(pnl.targetTextBox.text);
            if (!f.exists) {
                if (!f.create()) {
                    return self.errorPrompt(i18n.ERROR_CANNOTBUILDNEWFOLDER);
                }
            }
        }
        else {
            return self.errorPrompt(i18n.ERROR_NOTFOUNDTARGET);
        }


        if (!f || !f.exists) {
            return self.errorPrompt(i18n.ERROR_NOTFOUNDTARGET);
        }
        opts.target = decodeURI(f.fsName)

        // LabelPlus文本
        f = new File(pnl.lpTextFileTextBox.text);
        if (!f || !f.exists) {
            return self.errorPrompt(i18n.ERROR_NOTFOUNLABELTEXT);
        }
        opts.labelFilename = pnl.lpTextFileTextBox.text;

        let fl = new Folder(f.path);
        opts.labelFilePath = decodeURI(fl.fsName)

        // Image选择
        if (!pnl.chooseImageListBox.selection || pnl.chooseImageListBox.selection.length == 0)
            return self.errorPrompt(i18n.ERROR_NOTCHOOSEIMAGE);
        else {
            let sortedImgSelection = pnl.chooseImageListBox.selection.sort();
            opts.imageSelected = [];

            for (let i = 0; i < sortedImgSelection.length; i++) {
                opts.imageSelected[i] = {
                    text: sortedImgSelection[i].text,
                    index: sortedImgSelection[i].index
                };
            }
        }
        // 分组选择
        if (!pnl.chooseGroupListBox.selection || pnl.chooseGroupListBox.selection.length == 0)
            return self.errorPrompt(i18n.ERROR_NOTCHOOSEGROUP);
        else {
            opts.groupSelected = [];
            for (let i = 0; i < pnl.chooseGroupListBox.selection.length; i++)
                opts.groupSelected[i] = pnl.chooseGroupListBox.selection[i].text;
        }

    }

    //----------------------可配置
    // 文本替换
    opts.textReplace = (pnl.textReplaceCheckBox.value) ? pnl.textReplaceTextBox.text : "";
    // 文档模板
    opts.docTemplete =
    pnl.docTempletePnl.autoTempleteRb.value ? OptionDocTemplete.Auto : (
        pnl.docTempletePnl.noTempleteRb.value ? OptionDocTemplete.No : (
            pnl.docTempletePnl.customTempleteRb.value ? OptionDocTemplete.Custom : OptionDocTemplete.Auto
        )
    );
    opts.docTempleteCustomPath = pnl.docTempletePnl.customTempleteTextbox.text;
    // 字体
    if (pnl.setFontCheckBox.value) {
        let font = pnl.font.getFont()
        opts.font = font.font;
        opts.fontSize = font.size;
    } else {
        opts.font = "";
        opts.fontSize = 0;
    }
    // 行距
    opts.textLeading = (pnl.setTextLeadingCheckBox.value) ? pnl.textLeadingTextBox.text : 0;
    // 导出标号选项
    opts.outputLabelNumber = pnl.outputLabelNumberCheckBox.value;
    // 输出横排文字
    opts.horizontalText = pnl.outputHorizontalCheckBox.value;
    // 处理无标号文档
    opts.outputNoSignPsd = pnl.outputNoSignPsdCheckBox.value;
    // 无视LabelPlus文本中的图源文件名
    opts.ignoreImgFileName = pnl.ignoreImgFileNameCheckBox.value
    // 使用指定类型图源
    opts.sourceFileType = (pnl.setSourceFileTypeCheckBox.value) ? pnl.setSourceFileTypeList.selection.text : "";
    // 执行动作GroupN
    opts.runActionGroup = (pnl.runActionGroupCheckBox.value) ? pnl.runActionGroupList.selection.text : "";
    // 导入后不关闭文档
    opts.notClose = pnl.notCloseCheckBox.value;
    // 不对图层进行分组
    opts.layerNotGroup = pnl.layerNotGroupCheckBox.value;
    // 涂白
    opts.overloayGroup = (pnl.overlayCheckBox.value)? pnl.overlayGroupTextBox.text : "";

    return opts;
};

LabelPlusInput.prototype.doAction = function (action, actionSet) {

    if (Stdlib.hasAction(action, actionSet.toString())) {
        app.doAction(action, actionSet.toString());
    }
}

//
// 执行用户UI功能
//
LabelPlusInput.prototype.process = function (opts: LabelPlusInputOptions, doc) {
    let self = this;
    let errorMsg = "";

    Stdlib.log.setFile(opts.labelFilePath + dirSeparator + "LabelPlusInputer.log");//LabelPlusInputOptions.LOG_FILE);
    Stdlib.log("Start");
    Stdlib.log("Properties:");
    Stdlib.log(Stdlib.listProps(opts));

    //读取图源文件夹文件列表
    let originFileList = getFilesListOfPath(opts.source);

    //解析LabelPlus文本
    let lpFile = new LabelPlusTextReader(opts.labelFilename);

    //读取文本替换配置
    let textReplace: any;
    if (opts.textReplace)
        textReplace = textReplaceReader(opts.textReplace);

    // 确定doc模板文件
    let templete_path: string = "";
    switch (opts.docTemplete) {
    case OptionDocTemplete.Custom:
        templete_path = opts.docTempleteCustomPath;
    case OptionDocTemplete.Auto:
        let tempdir = GetScriptFolder() + dirSeparator + "ps_script_res" + dirSeparator;
        let tempname = app.locale.split("_")[0].toLocaleLowerCase() + ".psd"; // such as "zh_CN" -> zh.psd

        let try_list: string[] = [
            tempdir + tempname,
            tempdir + "en.psd"
        ];
        for (let i = 0; i < try_list.length; i++) {
            if (FileIsExists(try_list[i])) {
                templete_path = try_list[i];
                break;
            }
        }
        if (templete_path === "") {
            let errmsg = "error: " + i18n.ERROR_NotAutoMatchTemplete;
            Stdlib.log(errmsg);
            throw errmsg;
        }
        break;
    default:
    }

    //遍历所选图片 导入数据= =
    for (let i = 0; i < opts.imageSelected.length; i++) {
        let originName :string = opts.imageSelected[i].text; // 翻译文件中的图片文件名
        let filename :string; // 实际打开的图片文件名
        let filetype :string; // 实际的图片类型，如“.psd”
        let labelData = lpFile.LabelData[originName];
        let gourpData = lpFile.GroupData;

        // 根据sourceFileType替换文件后缀名 && 忽略原始图片名
        if (opts.sourceFileType) {
            filename = originName.substring(0, originName.lastIndexOf(".")) + opts.sourceFileType;
            filetype = opts.sourceFileType;
        }
        else if (opts.ignoreImgFileName) {
            filename = originFileList[opts.imageSelected[i].index];
            filetype = filename.substring(filename.lastIndexOf("."), filename.length);
        }
        else {
            filename = originName;
            filetype = originName.substring(originName.lastIndexOf("."), originName.length);
        }
        Stdlib.log("open filename: " + filename);
        Stdlib.log("open filetype: " + filetype);

        // 不处理无标号文档
        if (!opts.outputNoSignPsd && labelData.length == 0)
            continue;

        // 打开图片文件
        let bgFile = new File(opts.source + dirSeparator + filename);
        if (!bgFile || !bgFile.exists) {
            let msg = "Image " + filename + " Not Found.";
            Stdlib.log(msg);
            errorMsg = errorMsg + msg + "\r\n";
            continue;
        }

        // 在PS中打开图片文件，如果是PS专用格式（PSD/TIFF）则直接打开；否则根据配置使用PSD模板或新建PSD，再将图片导入为bg图层
        let doc: Document;
        let textTempleteLayer: ArtLayer | undefined;
        try {
            if ((filetype == ".psd") || (filetype == ".tif") || ((filetype == ".tiff"))) {
                doc = app.open(bgFile);
            }
            else {
                let bg :Document = app.open(bgFile);
                bg.selection.selectAll();
                bg.selection.copy();

                if (opts.docTemplete == OptionDocTemplete.No) {
                    doc = app.documents.add(bg.width, bg.height, bg.resolution, bg.name, NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
                } else {
                    let docFile = new File(templete_path);
                    doc = app.open(docFile);
                    doc.resizeImage(undefined, undefined, bg.resolution);
                    doc.resizeCanvas(bg.width, bg.height);
                }

                // 选中bg图层，将图片粘贴进去
                let bgLayer :ArtLayer;
                try {
                    bgLayer = doc.artLayers.getByName("bg");
                }
                catch {
                    Stdlib.log("bg templete layer not found, copy one.");
                    bgLayer = doc.artLayers.add();
                    bgLayer.name = "bg";
                }
                doc.activeLayer = bgLayer;
                doc.paste();
                bg.close(SaveOptions.DONOTSAVECHANGES);
            }

            // 寻找文本模板，即名为text的图层；若text图层不存在，复制一个文本图层
            try { textTempleteLayer = doc.artLayers.getByName("text"); }
            catch {
                Stdlib.log("text templete layer not found, copy one.");
                for (let i = 0; i < doc.artLayers.length; i++) {
                    let layer: ArtLayer = <ArtLayer> doc.artLayers[i];
                    if (layer.kind == LayerKind.TEXT) {
                        /// @ts-ignore ts声明文件有误，duplicate()返回ArtLayer对象，而不是void
                        textTempleteLayer = <ArtLayer> textLayer.duplicate();
                        textTempleteLayer.textItem.contents = "text";
                        textTempleteLayer.name = "text";
                        break;
                    }
                }
            }

        } catch (e) {
            let msg = "open file " + filename + " fail";
            Stdlib.log(msg);
            errorMsg = errorMsg + msg + "\r\n";
            continue;
        }

        // 若文档类型为索引色模式 更改为RGB模式
        if (doc.mode == DocumentMode.INDEXEDCOLOR) {
            doc.changeMode(ChangeMode.RGB);
        }

        let layerGroups = new Array();

        // 文件打开时执行一次动作"_start"
        if (opts.runActionGroup) {
            try {
                doc.activeLayer = doc.layers[doc.layers.length - 1];
                this.doAction("_start", opts.runActionGroup);
            }
            catch (e) { }
        }

        // 涂白
        if (opts.overloayGroup) {
            let labelArr = new Array();

            // 找出需要涂白的标签
            for (let j = 0; j < labelData.length; j++) {
                let labelX = labelData[j].LabelheadValue[0];
                let labelY = labelData[j].LabelheadValue[1];
                let labelXY = { x: labelX, y: labelY };
                let labelGroup = gourpData[labelData[j].LabelheadValue[2]];

                if (labelGroup == opts.overloayGroup) {
                    labelArr.push(labelXY);
                }
            }

            //执行涂白
            MyAction.lp_dialogClear(labelArr, doc.width, doc.height, 16, 1);
        }

        // 遍历LabelData
        for (let j = 0; j < labelData.length; j++) {
            let labelNum = j + 1;
            let labelX = labelData[j].LabelheadValue[0];
            let labelY = labelData[j].LabelheadValue[1];
            let labelGroup = gourpData[labelData[j].LabelheadValue[2]];
            let labelString = labelData[j].LabelString;
            let artLayer;

            // 所在分组是否需要导入
            if (opts.groupSelected.indexOf(labelGroup) == -1)
                continue;

            // 创建分组
            if (!opts.layerNotGroup && !layerGroups[labelGroup]) {
                layerGroups[labelGroup] = doc.layerSets.add();
                layerGroups[labelGroup].name = labelGroup;
            }
            if (opts.outputLabelNumber && !layerGroups["_Label"]) {
                layerGroups["_Label"] = doc.layerSets.add();
                layerGroups["_Label"].name = "Label";
            }

            // 导出标号
            if (opts.outputLabelNumber) {
                let o = new TextInputOptions();
                o.templete = textTempleteLayer;
                o.font = "Arial";
                o.size = (opts.fontSize !== 0) ? UnitValue(opts.fontSize, "pt") : undefined;
                o.group = layerGroups["_Label"];
                newTextLayer(doc, String(labelNum), labelX, labelY, o);
            }

            // 替换文本
            if (textReplace) {
                for (let k = 0; k < textReplace.length; k++) {
                    while (labelString.indexOf(textReplace[k].From) != -1)
                        labelString = labelString.replace(textReplace[k].From, textReplace[k].To);
                }
            }

            // 导出文本，设置的优先级大于模板，无模板时做部分额外处理
            if (labelString && labelString != "") {
                let o = new TextInputOptions();
                o.templete = textTempleteLayer;
                o.font = (opts.font != "") ? opts.font : undefined;
                if (opts.fontSize !== 0) {
                    o.size = UnitValue(opts.fontSize, "pt");
                } else if (opts.docTemplete !== OptionDocTemplete.No) {
                    o.size = UnitValue(doc.height.as("pt") / 90.0, "pt");
                } else {
                    o.size = undefined;
                }
                o.size = (opts.fontSize !== 0) ?  new UnitValue(opts.fontSize, "pt") : undefined;
                o.direction = opts.horizontalText ? Direction.HORIZONTAL : Direction.VERTICAL;
                o.group = opts.layerNotGroup ? undefined : layerGroups[labelGroup];
                o.lending = opts.textLeading ? opts.textLeading : undefined;
                artLayer = newTextLayer(doc, labelString, labelX, labelY, o);
            }

            // 执行动作,名称为分组名
            if (opts.runActionGroup) {
                try {
                    doc.activeLayer = artLayer;
                    this.doAction(labelGroup, opts.runActionGroup);
                }
                catch (e) {
                    Stdlib.log("DoAction " + labelGroup +
                        " in " + opts.runActionGroup +
                        " Error: \r\n" + e);
                }
            }
        }

        // 如果text模板存在，删除
        if (textTempleteLayer !== undefined)
            textTempleteLayer.remove();

        // 文件关闭时执行一次动作"_end"
        if (opts.runActionGroup) {
            try {
                doc.activeLayer = doc.layers[doc.layers.length - 1];
                this.doAction("_end", opts.runActionGroup);
            }
            catch (e) { }
        }

        // 保存文件
        let fileOut = new File(opts.target + "//" + filename);
        let options = PhotoshopSaveOptions;
        let asCopy = false;
        let extensionType = Extension.LOWERCASE;
        doc.saveAs(fileOut, options, asCopy, extensionType);

        // 关闭文件
        if (!opts.notClose)
            doc.close();
    }
    alert(i18n.COMPLETE);
    if (errorMsg != "") {
        alert("error:\r\n" + errorMsg);
    }
    Stdlib.log("Complete!");
};

class TextInputOptions {
    templete: ArtLayer | undefined;     // 文本图层模板
    font: string | undefined;
    size: UnitValue | undefined;
    direction: Direction | undefined;
    group: LayerSet | undefined;
    lending: number | undefined;        // 自动行距
};

//
// 创建文本图层，参数为undefined时表示不设置该项
//
function newTextLayer(doc: Document, text: string, x: number, y: number, topts: TextInputOptions): ArtLayer
{
    let artLayerRef: ArtLayer;
    let textItemRef: TextItem;

    // 不使用选项时，创建一个全为undefined的opts
    if (!topts)
        topts = new TextInputOptions();

    // 从模板创建，可以保证图层的所有格式与模板一致
    if (topts.templete) {
        /// @ts-ignore ts声明文件有误，duplicate()返回ArtLayer对象，而不是void
        artLayerRef = <ArtLayer> topts.templete.duplicate();
        textItemRef = artLayerRef.textItem;
    }
    else {
        artLayerRef = doc.artLayers.add();
        artLayerRef.kind = LayerKind.TEXT;
        textItemRef = artLayerRef.textItem;
    }

    if (topts.size)
        textItemRef.size = topts.size;

    if (topts.font)
        textItemRef.font = topts.font;

    if (topts.direction)
        textItemRef.direction = topts.direction;

    textItemRef.position = Array(UnitValue(doc.width.as("px") * x, "px"), UnitValue(doc.height.as("px") * y, "px"));

    if (topts.group)
        artLayerRef.move(topts.group, ElementPlacement.PLACEATBEGINNING);

    if ((topts.lending) && (topts.lending != 0)) {
        textItemRef.useAutoLeading = true;
        textItemRef.autoLeadingAmount = topts.lending;
    }

    artLayerRef.name     = text;
    textItemRef.contents = text;

    return artLayerRef;
}

//
// 文本替换字符串解析程序
//
let textReplaceReader = function (str: string) {
    let arr = new Array();
    let strs = str.split('|');
    if (!strs)
        return; //解析失败

    for (let i = 0; i < strs.length; i++) {
        if (!strs[i] || strs[i] == "")
            continue;

        let strss = strs[i].split("->");
        if ((strss.length != 2) || (strss[0] == ""))
            return; //解析失败

        arr.push({
            From: strss[0],
            To: strss[1],
        });
    }

    if (arr.length != 0)
        return arr;
    else
        return;
}

//
// 写入配置
//
let iniToString = function (ini) {
    var str = '';
    for (var idx in ini) {
        if (idx.charAt(0) == '_') {         // private stuff
            continue;
        }
        if (idx == 'typename') {
            continue;
        }
        if (idx == "noUI") {                // GenericUI property
            continue;
        }
        var val = ini[idx];

        if (val == undefined) {
            continue;
        }

        if (val.constructor == String) {
            str += (idx + ": \"" + val.toString() + "\"\n");
        }
        else if (val.constructor == Number || val.constructor == Boolean) {
            str += (idx + ": " + val.toString() + "\n");
        }
    }
    return str;
};

let writeIni = function (iniFile: string, ini: any) {
    //$.level = 1; debugger;
    if (!ini || !iniFile) {
        return;
    }
    let file = GenericUI.iniFileToFile(iniFile);

    if (!file) {
        Error.runtimeError(9001, Error("Bad ini file specified: \"" + iniFile + "\"."));
    }

    if (file.open("w", "TEXT", "????")) {
        file.lineFeed = "unix";
        file.encoding = 'UTF-8';
        let str = iniToString(ini);
        file.write(str);
        file.close();
    }
    return ini;
};

//
// 读出配置
//
let readIni = function (iniFile: string, ini ?: any): LabelPlusInputOptions {
    //$.level = 1; debugger;

    if (!ini) {
        ini = new LabelPlusInputOptions(ini);
    }
    if (!iniFile) {
        return ini;
    }
    let file = GenericUI.iniFileToFile(iniFile);

    if (!file) {
        Error.runtimeError(9001, Error("Bad ini file specified: \"" + iniFile + "\"."));
    }

    if (!file.exists) {
        //
        // XXX Check for an ini path .ini file in the script's folder.
        //
    }

    if (file.exists && file.open("r", "TEXT", "????")) {
        file.lineFeed = "unix";
        file.encoding = 'UTF-8';
        let str = file.read();
        str = str.replace(/\n/g, ',');
        ini = (Function('return {' + str + '}'))(); // note: 不使用GenericUI.iniFileToFile是因为它的实现读出的项均为string类型
        file.close();
    }

    return ini;
};

//
// 获取文件夹下文件的文件名字符串列表
//
let getFilesListOfPath = function (path: string): string[] {
    let folder = new Folder(path);
    if (!folder.exists) {
        return new Array<string>();
    }

    let fileList = folder.getFiles();
    let fileNameList = new Array();

    for (let i = 0; i < fileList.length; i++) {
        let file = fileList[i];
        if (file instanceof File) {
            let short_name = file.toString().split("/");
            fileNameList.push(short_name[short_name.length - 1]);
        }
    }

    return fileNameList.sort();
}

//
// 获取ListBox选中项目text及index
//
let getSelectedItemsText = function (listBox) {
    let selectedItems = new Array();

    for (let i = 0; i < listBox.children.length; i++) {
        if (listBox[i].selected)
            selectedItems.push({ text: listBox[i].text, index: listBox[i].index });
    }
    return selectedItems;
}

let ui = new LabelPlusInput();
ui.exec();

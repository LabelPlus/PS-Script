//todo: 以下标记可能被typescript过滤掉，需要找个更妥当的办法导入js
//@include "./xtools/xlib/stdlib.js";
//@include "./xtools/xlib/GenericUI.jsx";
//@include  "my_action.js"

/// <reference path="legacy.d.ts" />
/// <reference path="i18n.ts" />
/// <reference path="version.ts" />
/// <reference path="custom_options.ts" />
/// <reference path="importer.ts" />
/// <reference path="text_parser.ts" />
/// <reference path="common.ts" />

namespace LabelPlus {

//
// 用户UI
//
class LabelPlusInput extends GenericUI {
    constructor() {
        super();

        let self = this;
        self.saveIni = false;
        self.hasBorder = true;
        self.optionsClass = CustomOptions;
        self.settingsPanel = false; //有自己创建的设置面板

        self.winRect = {          // the size of our window
            x: 200,
            y: 200,
            w: 875,
            h: 685
        };

        self.title = i18n.APPNAME + " " + VERSION;	// our window title
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
    let opts = new CustomOptions(ini);// default values

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
            let lpFile = lpTextParser(pnl.lpTextFileTextBox.text);
            if (lpFile === null) {
                alert(i18n.ERROR_READLABELTEXTFILEFAILL);
                return;
            }

            // 填充图片选择列表
            for (let key in lpFile.images) {
                // let count = 0;
                let item = pnl.chooseImageListBox.add('item', key);//, count++);
                item.selected = true;
            }

            // 填充分组选择列表
            for (let i = 0; i < lpFile.groups.length; i++) {
                let g = lpFile.groups[i];
                pnl.chooseGroupListBox[i] = pnl.chooseGroupListBox.add('item', g, i);
                pnl.chooseGroupListBox[i].selected = true;

                // 涂白 指定分组文本框若空 填第一个分组
                if (pnl.overlayGroupTextBox.text == "") {
                    pnl.overlayGroupTextBox.text = g;
                }
            }

            pnl.labelFile = lpFile;  //返回LabelPlusTextReader对象

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
    pnl.chooseImageListBox = pnl.add('listbox', [xx, yy, xx + 150, yy + 320], [], { multiselect: true });

    //------------------分组选择区------------------
    yy = yOfs + 35;
    // xOfs += 170;
    xx = xOfs + 170;

    //选择需要导入的分组
    pnl.chooseGroupLabel = pnl.add('statictext', [xx, yy, xx + 150, yy + 22], i18n.LABEL_SELECTGROUP);
    yy += 20;
    pnl.chooseGroupListBox = pnl.add('listbox', [xx, yy, xx + 150, yy + 320], [], { multiselect: true });
    xx = xOfs;
    yy += 325;

    // 列表框没有复选框功能，这里提示使用方法
    pnl.add('statictext', [xx, yy, xx + 320, yy + 44], i18n.LABEL_SelectTip, { multiline: true });

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
        if (pnl.ignoreImgFileNameCheckBox.value) {
            pnl.setSourceFileTypeCheckBox.value = false;	// 与指定图源互斥
            Emit(pnl.setSourceFileTypeCheckBox.onClick);
        }
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
        if (pnl.setSourceFileTypeCheckBox.value) {
            pnl.ignoreImgFileNameCheckBox.value = false;	//与无视图源文件名互斥
            Emit(pnl.ignoreImgFileNameCheckBox.onClick);
        }
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
    yy += 70;

    // 设置文字方向
    pnl.textDirLabel = pnl.add('statictext', [xx, yy, xx + 100, yy + 20], i18n.LABEL_TextDirection);
    xx += 100;
    pnl.textDirList = pnl.add('dropdownlist', [xx, yy, xx + 100, yy + 22], i18n.LIST_SetTextDirItems);
    pnl.textDirList.selection = pnl.textDirList.find(i18n.LIST_SetTextDirItems[0]);
    xx = xOfs;
    yy += 20;

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
        pnl.textReplaceTextBox.text = (opts.textReplace !== "") ? opts.textReplace : "！？->!?|...->…";
        Emit(pnl.textReplaceCheckBox.onClick);
    }
    // 文档模板
    if (opts.docTemplete !== undefined) {
        pnl.docTempletePnl.autoTempleteRb = false;
        pnl.docTempletePnl.noTempleteRb.value = false;
        pnl.docTempletePnl.customTempleteRb.value = false;
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
    // 文字方向
    if (opts.textDirection !== undefined) {
        pnl.textDirList.selection = pnl.textDirList.find(i18n.LIST_SetTextDirItems[opts.textDirection]);
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
LabelPlusInput.prototype.validatePanel = function (pnl: any, ini: any, tofile: boolean) :CustomOptions {
    let self = this;
    let opts = new CustomOptions(ini);
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
                    file: sortedImgSelection[i].text,
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
    // 文字方向
    opts.textDirection = <OptionTextDirection> i18n.LIST_SetTextDirItems.indexOf(pnl.textDirList.selection.text);
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

//
// 执行用户UI功能
//
LabelPlusInput.prototype.process = function (opts: CustomOptions, doc) {
    importFiles(opts);
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
        throw "Bad ini file specified: \"" + iniFile + "\"."
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
let readIni = function (iniFile: string, ini ?: any): CustomOptions {
    //$.level = 1; debugger;

    if (!ini) {
        ini = new CustomOptions(ini);
    }
    if (!iniFile) {
        return ini;
    }
    let file = GenericUI.iniFileToFile(iniFile);

    if (!file) {
        throw "Bad ini file specified: \"" + iniFile + "\".";
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
// 获取ListBox选中项目text及index
//
function getSelectedItemsText (listBox) {
    let selectedItems = new Array();

    for (let i = 0; i < listBox.children.length; i++) {
        if (listBox[i].selected)
            selectedItems.push({ text: listBox[i].text, index: listBox[i].index });
    }
    return selectedItems;
}

let ui = new LabelPlusInput();
ui.exec();

} // namespace LabelPlus

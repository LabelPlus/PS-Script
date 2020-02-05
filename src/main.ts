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
        self.iniFile = DEFAULT_INI_PATH;

        try {
            self.opts = readIni(DEFAULT_INI_PATH, self.ini)
        } catch {
            self.opts = new CustomOptions(self.ini); // default values
        }
        self.hasBorder = true;
        self.optionsClass = CustomOptions;
        self.settingsPanel = false; //有自己创建的设置面板

        self.winRect = {          // the size of our window
            x: 200,
            y: 200,
            w: 875,
            h: 725
        };

        self.title = I18n.APP_NAME + " " + VERSION;	// our window title
        self.notesSize = 75;
        self.notesTxt = I18n.TIP_TITLE;
        self.documentation = I18n.TIP_TEXT;

        self.processTxt = I18n.BUTTON_RUN;
        self.cancelTxt = I18n.BUTTON_CANCEL;
    }
}

//
// 用户界面构建
//
LabelPlusInput.prototype.createPanel = function (pnl: any, ini: any) {
    let self = this;
    let opts: CustomOptions = self.opts;

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
    pnl.lpTextFileLabel = pnl.add('statictext', [xx, yy, xx + 120, yy + 20], I18n.LABEL_TEXT_FILE);
    xx += 120;
    pnl.lpTextFileTextBox = pnl.add('edittext', [xx, yy, xx + 170, yy + 20], '');
    pnl.lpTextFileTextBox.enabled = false;
    xx += 175;
    pnl.lpTextFileBrowseButton = pnl.add('button', [xx, yy - 2, xx + 30, yy + 20], '...');

    pnl.lpTextFileBrowseButton.onClick = function () {
        try {
            let pnl = this.parent;
            let fmask = "*.txt;*.json";
            let f = File.openDialog(I18n.LABEL_TEXT_FILE, fmask);

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
                alert(I18n.ERROR_PARSER_LPTEXT_FAIL);
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

                // dialog overlay
                if (pnl.overlayGroupTextBox.text == "") { // first group
                    pnl.overlayGroupTextBox.text = g;
                }
                pnl.overlayGroupAddGroupList[i] = pnl.overlayGroupAddGroupList.add('item', g, i);
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
    pnl.chooseImageLabel = pnl.add('statictext', [xx, yy, xx + 150, yy + 20], I18n.LABEL_SELECT_IMG);
    yy += 23;
    pnl.chooseImageListBox = pnl.add('listbox', [xx, yy, xx + 150, yy + 320], [], { multiselect: true });

    //------------------分组选择区------------------
    yy = yOfs + 35;
    // xOfs += 170;
    xx = xOfs + 170;

    //选择需要导入的分组
    pnl.chooseGroupLabel = pnl.add('statictext', [xx, yy, xx + 150, yy + 20], I18n.LABEL_SELECT_GROUP);
    yy += 23;
    pnl.chooseGroupListBox = pnl.add('listbox', [xx, yy, xx + 150, yy + 320], [], { multiselect: true });
    xx = xOfs;
    yy += 325;

    // 列表框没有复选框功能，这里提示使用方法
    pnl.add('statictext', [xx, yy, xx + 320, yy + 44], I18n.LABEL_SELECT_TIP, { multiline: true });

    //------------------设置区------------------
    yy = yOfs;
    xOfs = 10 + 345;
    xx = xOfs;

    // >>>>>文件 预处理
    pnl.add('statictext', [xx, yy, xx + 120, yy + 20], I18n.LABEL_TIP_FILE);
    yy += 23;
    // 图源文件夹
    pnl.sourceLabel = pnl.add('statictext', [xx, yy, xx + 120, yy + 20], I18n.LABEL_SOURCE);
    xx += 120;
    pnl.sourceTextBox = pnl.add('edittext', [xx, yy, xx + 300, yy + 20], '');
    xx += 305;
    pnl.sourceBrowse = pnl.add('button', [xx, yy - 2, xx + 30, yy + 20], '...');

    pnl.sourceBrowse.onClick = function () {
        try {
            let pnl = this.parent;
            let def :string = (pnl.sourceTextBox.text ?
                pnl.sourceTextBox.text : Folder.desktop);
            let f = Stdlib.selectFolder(I18n.LABEL_SOURCE, def);
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
    pnl.targetLabel = pnl.add('statictext', [xx, yy, xx + 120, yy + 20], I18n.LABEL_TARGET);
    xx += 120;
    pnl.targetTextBox = pnl.add('edittext', [xx, yy, xx + 300, yy + 20], '');
    xx += 305;
    pnl.targetBrowse = pnl.add('button', [xx, yy - 2, xx + 30, yy + 20], '...');

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
            f = Stdlib.selectFolder(I18n.LABEL_TARGET, def);

            if (f) {
                pnl.targetTextBox.text = decodeURI(f.fsName);
            }
        } catch (e) {
            alert(Stdlib.exceptionMessage(e));
        }
    };

    xx = xOfs;
    yy += 25;

    // match image file by order
    {
        pnl.matchImgByOrderCheckBox = pnl.add('checkbox', [xx, yy, xx + 250, yy + 20], I18n.CHECKBOX_MATCH_IMG_BY_ORDER);
        pnl.matchImgByOrderCheckBox.onClick = function () {
            if (pnl.matchImgByOrderCheckBox.value) {
                pnl.replaceImgSuffixCheckBox.value = false; // incompatible to "replace image suffix"
                Emit(pnl.replaceImgSuffixCheckBox.onClick);
            }
            pnl.matchImgByOrderPreviewButton.enabled = pnl.matchImgByOrderCheckBox.value;
        }
        xx += 260;
        pnl.matchImgByOrderPreviewButton = pnl.add('button', [xx, yy - 2, xx + 80, yy + 20], I18n.BUTTON_MATCH_IMG_BY_ORDER_PREVIEW);
        pnl.matchImgByOrderPreviewButton.onClick = function () { // preview button
            let originFileNameList = getFilesListOfPath(pnl.sourceTextBox.text);
            let selectedImgFileNameList = getSelectedItemsText(pnl.chooseImageListBox);
            let preview_list_string = '';
            for (let i = 0; i < selectedImgFileNameList.length; i++) {
                if (!originFileNameList[i]) break;
                let src = selectedImgFileNameList[i].text;
                let dst = originFileNameList[selectedImgFileNameList[i].index];
                preview_list_string += src + " -> " + dst + "\n";
                if (i >= 20) {
                    alert(preview_list_string);
                    preview_list_string = "";
                }
            }
            if (preview_list_string !== "") {
                alert(preview_list_string);
            }
        }
        xx = xOfs;
        yy += 25;
    }

    // replace image suffix
    {
        pnl.replaceImgSuffixCheckBox = pnl.add('checkbox', [xx, yy, xx + 250, yy + 20], I18n.CHECKBOX_REPLACE_IMG_SUFFIX);
        pnl.replaceImgSuffixCheckBox.onClick = function () {
            if (pnl.replaceImgSuffixCheckBox.value) {
                pnl.matchImgByOrderCheckBox.value = false; // incompatible to "match image file by order"
                Emit(pnl.matchImgByOrderCheckBox.onClick);
            }
            let enable = pnl.replaceImgSuffixCheckBox.value;
            pnl.replaceImgSuffixTextbox.enabled = enable;
            pnl.setSourceFileTypeList.enabled = enable;
        }
        xx += 260;
        pnl.replaceImgSuffixTextbox = pnl.add('edittext', [xx, yy, xx + 120, yy + 20]);
        xx += 130;
        let type_list = ["", ".psd", ".png", ".jpg", ".jpeg", ".tif", ".tiff"];
        pnl.setSourceFileTypeList = pnl.add('dropdownlist', [xx, yy - 1, xx + 50, yy + 21], type_list);
        let func = function () {
            pnl.replaceImgSuffixTextbox.text = pnl.setSourceFileTypeList.selection.text;
            pnl.setSourceFileTypeList.onChange = undefined;
            pnl.setSourceFileTypeList.selection = pnl.setSourceFileTypeList.find("");
            pnl.setSourceFileTypeList.onChange = func;
        }
        pnl.setSourceFileTypeList.onChange = func;
        xx = xOfs;
        yy += 23;
    }

    // text replacing(example:"A->B|C->D")
    pnl.textReplaceCheckBox = pnl.add('checkbox', [xx, yy, xx + 250, yy + 20], I18n.CHECKBOX_TEXT_REPLACE);
    pnl.textReplaceCheckBox.onClick = function () {
        pnl.textReplaceTextBox.enabled = pnl.textReplaceCheckBox.value;
    };
    xx += 260;
    pnl.textReplaceTextBox = pnl.add('edittext', [xx, yy, xx + 180, yy + 20]);
    xx = xOfs;
    yy += 23;


    // >>>>> Script Behavior
    yy += 5;
    pnl.add('statictext', [xx, yy, xx + 120, yy + 20], I18n.LABEL_TIP_BEHAVIOR);
    yy += 23;

    // ignore images with no label
    pnl.ignoreNoLabelImgCheckBox = pnl.add('checkbox', [xx, yy, xx + 250, yy + 20], I18n.CHECKBOX_IGNORE_NO_LABEL_IMG);
    pnl.ignoreNoLabelImgCheckBox.value = true;
    xx += 250;

    // do not close image document after importing complete
    pnl.notCloseCheckBox = pnl.add('checkbox', [xx, yy, xx + 250, yy + 20], I18n.CHECKBOX_NOT_CLOSE);
    xx = xOfs;
    yy += 23;

    // output label index as text layer
    pnl.outputLabelIndexCheckBox = pnl.add('checkbox', [xx, yy, xx + 250, yy + 20], I18n.CHECKBOX_OUTPUT_LABEL_INDEX);
    xx += 250;

    // do not create layer group
    pnl.noLayerGroupCheckBox = pnl.add('checkbox', [xx, yy, xx + 250, yy + 20], I18n.CHECKBOX_NO_LAYER_GROUP);
    yy += 23;

    // >>>>> Style / Automation
    xx = xOfs;
    yy += 5;
    pnl.add('statictext', [xx, yy, xx + 120, yy + 20], I18n.LABEL_TIP_STYLE_AUTO);
    yy += 23;

    // 文档模板设置
    pnl.docTempletePnl = pnl.add('panel', [xx, yy, xx + 480, yy + 65], I18n.PANEL_TEMPLETE_SETTING);
    {
        let pnll: any = pnl.docTempletePnl;
        let xxxOfs: number = 5;
        let xxx: number = xxxOfs;
        let yyy: number = 5;
        pnll.autoTempleteRb = pnll.add('radiobutton',  [xxx, yyy, xxx + 200, yyy + 20], I18n.RB_TEMPLETE_AUTO); xxx += 200;
        pnll.autoTempleteRb.value = true;
        pnll.noTempleteRb = pnll.add('radiobutton',  [xxx, yyy, xxx + 200, yyy + 20], I18n.RB_TEMPLETE_NO); xxx += 200;
        xxx = xxxOfs;
        yyy += 23;
        pnll.customTempleteRb = pnll.add('radiobutton', [xxx, yyy, xxx + 120, yyy + 20], I18n.RB_TEMPLETE_CUSTOM); xxx += 120;
        pnll.customTempleteTextbox = pnll.add('edittext', [xxx, yyy, xxx + 180, yyy + 20]); xxx += 185;
        pnll.customTempleteTextButton = pnll.add('button', [xxx, yyy - 2, xxx + 30, yyy + 20], '...'); xxx += 30;
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
                let f = Stdlib.selectFileOpen(I18n.RB_TEMPLETE_CUSTOM, "*.psd;*.tif;*.tiff", def);
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
    pnl.textDirLabel = pnl.add('statictext', [xx, yy, xx + 100, yy + 20], I18n.LABEL_TEXT_DIRECTION);
    xx += 100;
    pnl.textDirList = pnl.add('dropdownlist', [xx, yy, xx + 100, yy + 20], I18n.LIST_TEXT_DIT_ITEMS);
    pnl.textDirList.selection = pnl.textDirList.find(I18n.LIST_TEXT_DIT_ITEMS[0]);
    xx = xOfs;
    yy += 23;

    // set font
    {
        pnl.setFontCheckBox = pnl.add('checkbox', [xx, yy, xx + 50, yy + 20], I18n.CHECKBOX_SET_FONT);
        pnl.setFontCheckBox.onClick = function () {
            let value = pnl.setFontCheckBox.value;
            pnl.font.family.enabled = value;
            pnl.font.style.enabled = value;
            pnl.font.fontSize.enabled = value;
        }
        xx += 60;
        pnl.font = pnl.add('group', [xx, yy + 2, xx + 400, yy + 25]);
        self.createFontPanel(pnl.font, ini);
        pnl.font.label.text = " ";
        pnl.font.family.enabled = false;
        pnl.font.style.enabled = false;
        pnl.font.fontSize.enabled = false;
        pnl.font.family.selection = pnl.font.family.find("SimSun");
        xx = xOfs;
        yy += 25;
    }

    // 自定义行距
    pnl.setTextLeadingCheckBox = pnl.add('checkbox', [xx, yy, xx + 120, yy + 20], I18n.CHECKBOX_SET_LEADING);
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
    yy += 23;

    // 执行动作GroupN
    pnl.runActionGroupCheckBox = pnl.add('checkbox', [xx, yy, xx + 500, yy + 20],
        I18n.CHECKBOX_RUN_ACTION);
    pnl.runActionGroupCheckBox.onClick = function () {
        pnl.runActionGroupList.enabled = pnl.runActionGroupCheckBox.value;
    }
    xx = xOfs + 30;
    yy += 23;
    let ary = Stdlib.getActionSets();
    pnl.runActionGroupList = pnl.add('dropdownlist', [xx, yy, xx + 180, yy + 20], ary);
    pnl.runActionGroupList.selection = pnl.runActionGroupList.find("LabelPlusAction");
    if (pnl.runActionGroupList.selection == undefined) {
        pnl.runActionGroupList.selection = pnl.runActionGroupList[0];
    }
    pnl.runActionGroupList.enabled = false;

    xx = xOfs;
    yy += 23;

    // dialog overlay
    {
        pnl.dialogOverlayCheckBox = pnl.add('checkbox', [xx, yy, xx + 300, yy + 20], I18n.CHECKBOX_DIALOG_OVERLAY);
        pnl.dialogOverlayCheckBox.onClick = function () {
            let enable = pnl.dialogOverlayCheckBox.value;
            pnl.overlayGroupTextBox.enabled = enable;
            pnl.overlayGroupAddGroupList.enabled = enable;
        }
        xx = xOfs + 30;
        yy += 23;
        pnl.overlayGroupTextBox = pnl.add('edittext', [xx, yy, xx + 250, yy + 20]);
        xx += 255;
        let arr = [""];
        pnl.overlayGroupAddGroupList = pnl.add('dropdownlist', [xx, yy - 1, xx + 100, yy + 21], arr);
        let func = function () {
            pnl.overlayGroupTextBox.text += "," + pnl.overlayGroupAddGroupList.selection.text;
            pnl.overlayGroupAddGroupList.onChange = undefined;
            pnl.overlayGroupAddGroupList.selection = pnl.overlayGroupAddGroupList.find("");
            pnl.overlayGroupAddGroupList.onChange = func;
        }
        pnl.overlayGroupAddGroupList.onChange = func;
    }

    // read options to UI panel
    // note: opts generated from externel file, can be undefined
    if (opts.textReplace !== undefined) {
        pnl.textReplaceCheckBox.value = (opts.textReplace !== "");
        pnl.textReplaceTextBox.text = (opts.textReplace !== "") ? opts.textReplace : "！？->!?|...->…";
        Emit(pnl.textReplaceCheckBox.onClick);
    }
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
    if (opts.textDirection !== undefined) {
        pnl.textDirList.selection = pnl.textDirList.find(I18n.LIST_TEXT_DIT_ITEMS[opts.textDirection]);
    }
    if (opts.font !== undefined) {
        if (opts.font === "") {
            pnl.setFontCheckBox.value = false;
        } else {
            pnl.setFontCheckBox.value = true;
            pnl.font.setFont(opts.font, opts.fontSize);
        }
        Emit(pnl.setFontCheckBox.onClick);
    }
    if (opts.textLeading !== undefined) {
        if (opts.textLeading === 0) {
            pnl.setTextLeadingCheckBox.value = false;
        } else {
            pnl.setTextLeadingCheckBox.value = true;
            pnl.textLeadingTextBox.text = opts.textLeading;
        }
        Emit(pnl.setTextLeadingCheckBox.onClick);
    }
    if (opts.outputLabelIndex !== undefined) {
        pnl.outputLabelIndexCheckBox.value = opts.outputLabelIndex;
        Emit(pnl.outputLabelIndexCheckBox.onClick);
    }
    if (opts.ignoreNoLabelImg !== undefined) {
        pnl.ignoreNoLabelImgCheckBox.value = opts.ignoreNoLabelImg;
        Emit(pnl.ignoreNoLabelImgCheckBox.onClick);
    }
    if (opts.matchImgByOrder !== undefined) {
        pnl.matchImgByOrderCheckBox.value = opts.matchImgByOrder;
        Emit(pnl.matchImgByOrderCheckBox.onClick);
    }
    if (opts.replaceImgSuffix !== undefined) {
        pnl.replaceImgSuffixCheckBox.value = (opts.replaceImgSuffix !== "");
        pnl.replaceImgSuffixTextbox.text = opts.replaceImgSuffix;
        Emit(pnl.replaceImgSuffixCheckBox.onClick);
    }
    if (opts.actionGroup !== undefined) {
        pnl.runActionGroupCheckBox.value = (opts.actionGroup !== "");
        let item = pnl.runActionGroupList.find(opts.actionGroup);
        if (item !== undefined)
            pnl.runActionGroupList.selection = item;
        Emit(pnl.runActionGroupCheckBox.onClick);
    }
    if (opts.notClose !== undefined) {
        pnl.notCloseCheckBox.value = opts.notClose;
        Emit(pnl.notCloseCheckBox.onClick);
    }
    if (opts.noLayerGroup !== undefined) {
        pnl.noLayerGroupCheckBox.value = opts.noLayerGroup;
        Emit(pnl.noLayerGroupCheckBox.onClick);
    }
    if (opts.dialogOverlayLabelGroups !== undefined) {
        pnl.dialogOverlayCheckBox.value = (opts.dialogOverlayLabelGroups !== "");
        pnl.overlayGroupTextBox.text = opts.dialogOverlayLabelGroups;
        Emit(pnl.dialogOverlayCheckBox.onClick);
    }
    return pnl;
};

//
// 自定义读取配框
//
let createSettingsPanel = function (pnl: any, ini: any) {
    let win = GenericUI.getWindow(pnl.parent);

    pnl.text = I18n.LABEL_SETTING;
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
    pnl.load = pnl.add('button', [x, y, x + bw, y + 20], I18n.BUTTON_LOAD);
    x = offsets[1] - (bw / 2);
    pnl.save = pnl.add('button', [x, y, x + bw, y + 20], I18n.BUTTON_SAVE);
    x = offsets[2] - (bw / 2);
    pnl.reset = pnl.add('button', [x, y, x + bw, y + 20], I18n.BUTTON_RESET);

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

// validate user panel, generate CustomOptions
// tofile: if it is saving config to file
LabelPlusInput.prototype.validatePanel = function (pnl: any, ini: any, tofile: boolean) :CustomOptions | boolean {
    let self = this;
    let opts = new CustomOptions(ini);
    let f: Folder | File;

    // not saved options
    if (!tofile) {
        // image source folder
        f = new Folder(pnl.sourceTextBox.text);
        if (!f || !f.exists) {
            alert(I18n.ERROR_NOT_FOUND_SOURCE);
            return false;
        }
        opts.source = decodeURI(f.fsName)

        // image target folder
        f = new Folder(pnl.targetTextBox.text);
        if (!f.exists) {
            if (!f.create()) {
                alert(I18n.ERROR_CREATE_NEW_FOLDER);
                return false;
            }
        }
        opts.target = decodeURI(f.fsName)

        // labeplus text file
        f = new File(pnl.lpTextFileTextBox.text);
        if (!f || !f.exists) {
            alert(I18n.ERROR_NOT_FOUND_LPTEXT);
            return false;
        }
        let lpFile = lpTextParser(pnl.lpTextFileTextBox.text);
        if (lpFile == null) {
            alert(I18n.ERROR_PARSER_LPTEXT_FAIL);
            return false;
        }
        opts.lpTextFilePath = pnl.lpTextFileTextBox.text;

        // images
        if (!pnl.chooseImageListBox.selection || pnl.chooseImageListBox.selection.length == 0) {
            alert(I18n.ERROR_NO_IMG_CHOOSED);
            return false;
        }
        opts.imageSelected = [];
        let items = pnl.chooseImageListBox.selection.sort();
        for (let i = 0; i < items.length; i++) {
            opts.imageSelected[i] = { file: items[i].text, index: items[i].index };
        }

        // label groups
        if (!pnl.chooseGroupListBox.selection || pnl.chooseGroupListBox.selection.length == 0) {
            alert(I18n.ERROR_NO_LABEL_GROUP_CHOOSED);
            return false;
        }
        opts.groupSelected = [];
        for (let i = 0; i < pnl.chooseGroupListBox.selection.length; i++) {
            opts.groupSelected[i] = pnl.chooseGroupListBox.selection[i].text;
        }
    }

    // saved options
    opts.textReplace = (pnl.textReplaceCheckBox.value) ? pnl.textReplaceTextBox.text : "";
    opts.docTemplete =
    pnl.docTempletePnl.autoTempleteRb.value ? OptionDocTemplete.Auto : (
        pnl.docTempletePnl.noTempleteRb.value ? OptionDocTemplete.No : (
            pnl.docTempletePnl.customTempleteRb.value ? OptionDocTemplete.Custom : OptionDocTemplete.Auto
        )
    );
    opts.docTempleteCustomPath = pnl.docTempletePnl.customTempleteTextbox.text;
    if (pnl.setFontCheckBox.value) {
        let font = pnl.font.getFont()
        opts.font = font.font;
        opts.fontSize = font.size;
    } else {
        opts.font = "";
        opts.fontSize = 0;
    }
    opts.textLeading = (pnl.setTextLeadingCheckBox.value) ? pnl.textLeadingTextBox.text : 0;
    opts.outputLabelIndex = pnl.outputLabelIndexCheckBox.value;
    opts.textDirection = <OptionTextDirection> I18n.LIST_TEXT_DIT_ITEMS.indexOf(pnl.textDirList.selection.text);
    opts.ignoreNoLabelImg = pnl.ignoreNoLabelImgCheckBox.value;
    opts.matchImgByOrder = pnl.matchImgByOrderCheckBox.value
    opts.replaceImgSuffix = (pnl.replaceImgSuffixCheckBox.value) ? pnl.replaceImgSuffixCheckBox.text : "";
    opts.actionGroup = (pnl.runActionGroupCheckBox.value) ? pnl.runActionGroupList.selection.text : "";
    opts.notClose = pnl.notCloseCheckBox.value;
    opts.noLayerGroup = pnl.noLayerGroupCheckBox.value;
    opts.dialogOverlayLabelGroups = (pnl.dialogOverlayCheckBox.value)? pnl.overlayGroupTextBox.text : "";
    return opts;
};

//
// 执行用户UI功能
//
LabelPlusInput.prototype.process = function (opts: CustomOptions, doc)
{
    // auto save ini
    writeIni(DEFAULT_INI_PATH, opts);
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

// get text/index info from listbox ojbect
function getSelectedItemsText(listBox: any): { text: string, index: number }[]
{
    let item_list = new Array();
    for (let i = 0; i < listBox.children.length; i++) {
        let item = listBox.children[i];
        if (item.selected) {
            item_list.push({ text: item.text, index: item.index });
        }
    }
    return item_list;
}

let ui = new LabelPlusInput();
ui.exec();

} // namespace LabelPlus

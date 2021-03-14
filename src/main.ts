//todo: 以下标记可能被typescript过滤掉，需要找个更妥当的办法导入js
//@include "./xtools/xlib/GenericUI.jsx";
//@include "./xtools/xlib/LogWindow.js";
//@include  "my_action.js"
//@include "./jam/jamJSON.jsxinc"

/// <reference path="legacy.d.ts" />
/// <reference path="i18n.ts" />
/// <reference path="version.ts" />
/// <reference path="custom_options.ts" />
/// <reference path="importer.ts" />
/// <reference path="text_parser.ts" />
/// <reference path="common.ts" />

namespace LabelPlus {

interface CustomOptionsPicker { (opts: CustomOptions, toFile?: boolean): CustomOptions | null };
interface PanelDesc {
    x?: number,
    y?: number,
    getOption?: CustomOptionsPicker,
}

class LabelPlusInput extends GenericUI {
    private opts: CustomOptions;
    private lpFile: LpFile | null = null;

    private settingsPnl: any;
    private inputPnl: any;
    private outputPnl: any;
    private stylePnl: any;
    private automationPnl: any;
    private HelpPnl: any;

    constructor() {
        super();
        this.saveIni = false;
        this.hasBorder = false;
        this.settingsPanel = false;
        this.winRect = { x: 200, y: 200, w: 875, h: 590 };
        this.center = true;
        this.title = I18n.APP_NAME + " " + VERSION;
        this.notesSize = 0;
        this.processTxt = I18n.BUTTON_RUN;
        this.cancelTxt = I18n.BUTTON_CANCEL;

        try {
            this.opts = readIni(DEFAULT_INI_PATH); // try to load auto saved ini
            log("read option from " + DEFAULT_INI_PATH + "OK");
        } catch {
            this.opts = new CustomOptions();
            log("read option from " + DEFAULT_INI_PATH + "failed");
        }
    }

    private optPickers: CustomOptionsPicker[] = [];
    private addToPickerList = (picker?: CustomOptionsPicker) => {
        if (picker)
            this.optPickers[this.optPickers.length] = picker;
    }

    private uiLpTextSelect = (pnl: any): PanelDesc => {
        let xx: number = 10, yy: number = 10;
        pnl.lpTextFileLabel = pnl.add('statictext', [xx, yy, xx + 120, yy + 20], I18n.LABEL_TEXT_FILE);
        xx += 120;
        pnl.lpTextFileTextBox = pnl.add('edittext', [xx, yy, xx + 300, yy + 20], '');
        pnl.lpTextFileTextBox.enabled = false;
        xx += 305;
        pnl.lpTextFileBrowseButton = pnl.add('button', [xx, yy - 2, xx + 30, yy + 20], '...');
        xx += 30;
        yy += 20;
        pnl.lpTextFileBrowseButton.onClick = () => {
            let inputPnl = this.inputPnl;
            let outputPnl = this.outputPnl;
            let automationPnl = this.automationPnl;

            let fmask = "*.txt;*.json";
            let f = File.openDialog(I18n.LABEL_TEXT_FILE, fmask);
            if (f && f.exists) {
                pnl.lpTextFileTextBox.text = f.fsName;
                let fl = new Folder(f.path);
                inputPnl.sourceTextBox.text = fl.fsName;
                outputPnl.targetTextBox.text = fl.fsName + dirSeparator + 'output';
            } else {
                return {};        // cancel by user
            }

            // load lptext file
            let lpFile = lpTextParser(f.fsName);
            if (lpFile === null) {
                alert(I18n.ERROR_PARSER_LPTEXT_FAIL);
                return {};
            }
            this.lpFile = lpFile;
            this.allPanelEnable(true);

            // fill ui elements
            inputPnl.chooseImageListBox.removeAll();
            inputPnl.chooseGroupListBox.removeAll();
            for (let key in lpFile.images) {
                let item = inputPnl.chooseImageListBox.add('item', key);
                item.selected = true;
            }
            for (let i = 0; i < lpFile.groups.length; i++) {
                let g = lpFile.groups[i];
                inputPnl.chooseGroupListBox[i] = inputPnl.chooseGroupListBox.add('item', g, i);
                inputPnl.chooseGroupListBox[i].selected = true;

                // dialog overlay
                if (automationPnl.overlayGroupTextBox.text == "") { // first group
                    automationPnl.overlayGroupTextBox.text = g;
                }
                automationPnl.overlayGroupAddGroupList[i] = automationPnl.overlayGroupAddGroupList.add('item', g, i);
            }
            return {};
        };

        let getOption = (opts: CustomOptions, toFile: boolean): CustomOptions | null => {
            if (!toFile) {
                // labeplus text file
                let f = new File(pnl.lpTextFileTextBox.text);
                if (!f || !f.exists) {
                    alert(I18n.ERROR_NOT_FOUND_LPTEXT);
                    return null;
                }
                let lpFile = lpTextParser(pnl.lpTextFileTextBox.text);
                if (lpFile == null) {
                    alert(I18n.ERROR_PARSER_LPTEXT_FAIL);
                    return null;
                }
                opts.lpTextFilePath = pnl.lpTextFileTextBox.text;
            }

            return opts;
        }

        return {x: xx, y:yy, getOption: getOption};
    }

    private uiSettingsPanel = (pnl: any): PanelDesc => {
        let win = GenericUI.getWindow(pnl.parent);

        pnl.text = I18n.LABEL_SETTING;

        pnl.fileMask = "INI Files: *.ini, All Files: *.*";
        pnl.loadPrompt = "Read Setting";
        pnl.savePrompt = "Save Setting";
        pnl.defaultFile = DEFAULT_INI_PATH;

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

        pnl.load.onClick = () => {
            let def = pnl.defaultFile;
            let prmpt = pnl.loadPrompt;
            let sel = Stdlib.createFileSelect(pnl.fileMask);
            if (isMac()) {
                sel = undefined;
            }
            let f = Stdlib.selectFileOpen(prmpt, sel, def);
            if (f) {
                this.opts = readIni(f);
                win.close(4);
            }
        };
        pnl.save.onClick = () => {
            let def = pnl.defaultFile;
            let prmpt = pnl.savePrompt;
            let sel = Stdlib.createFileSelect(pnl.fileMask);

            if (isMac()) {
                sel = undefined;
            }

            let f = Stdlib.selectFileSave(prmpt, sel, def);
            if (f) {
                let mgr = win.mgr;
                let res = mgr.validatePanel(win.appPnl, win.ini, true);

                if (typeof (res) != 'boolean') {
                    writeIni(f, res);
                }
            }
        };
        pnl.reset.onClick = () => {
            this.opts = new CustomOptions();
            this.lpFile = null;
            win.close(4);
        };

        return { };
    };

    private uiInputPanel = (pnl: any): PanelDesc => {
        let xOfs = 10, yOfs = 20;
        let xx = xOfs,  yy = yOfs;

        pnl.text = I18n.PANEL_INPUT;

        // image source folder select
        pnl.sourceLabel = pnl.add('statictext', [xx, yy, xx + 80, yy + 20], I18n.LABEL_SOURCE);
        xx += 90;
        pnl.sourceTextBox = pnl.add('edittext', [xx, yy, xx + 205, yy + 20], '');
        xx += 210;
        pnl.sourceBrowse = pnl.add('button', [xx, yy - 2, xx + 30, yy + 20], '...');
        pnl.sourceBrowse.onClick = () => {
            try {
                let def :string = (pnl.sourceTextBox.text ?
                    pnl.sourceTextBox.text : Folder.desktop);
                let f = Stdlib.selectFolder(I18n.LABEL_SOURCE, def);
                if (f) {
                    pnl.sourceTextBox.text = f.fsName;
                }
            } catch (e) {
                alert(Stdlib.exceptionMessage(e));
            }
        };
        xx = xOfs;
        yy += 25;

        // match image file by order
        pnl.matchImgByOrderCheckBox = pnl.add('checkbox', [xx, yy, xx + 190, yy + 20], I18n.CHECKBOX_MATCH_IMG_BY_ORDER);
        pnl.matchImgByOrderCheckBox.onClick = () => {
            if (pnl.matchImgByOrderCheckBox.value) {
                pnl.replaceImgSuffixCheckBox.value = false; // incompatible to "replace image suffix"
                Emit(pnl.replaceImgSuffixCheckBox.onClick);
            }
            pnl.matchImgByOrderPreviewButton.enabled = pnl.matchImgByOrderCheckBox.value;
        }
        xx += 195;
        pnl.matchImgByOrderPreviewButton = pnl.add('button', [xx, yy - 2, xx + 80, yy + 20], I18n.BUTTON_MATCH_IMG_BY_ORDER_PREVIEW);
        pnl.matchImgByOrderPreviewButton.onClick = () => { // preview button
            let originFileNameList = getFilesListOfPath(pnl.sourceTextBox.text);
            let selectedImgFileNameList = getSelectedItemsText(pnl.chooseImageListBox);
            var logwin = new LogWindow(I18n.BUTTON_MATCH_IMG_BY_ORDER_PREVIEW);
            for (let i = 0; i < selectedImgFileNameList.length; i++) {
                if (!originFileNameList[i]) break;
                let src = selectedImgFileNameList[i].text;
                let dst = originFileNameList[selectedImgFileNameList[i].index];
                logwin.append(src + " -> " + dst);
            }
            logwin.show();
        }
        xx = xOfs;
        yy += 25;

        // replace image suffix
        pnl.replaceImgSuffixCheckBox = pnl.add('checkbox', [xx, yy, xx + 190, yy + 20], I18n.CHECKBOX_REPLACE_IMG_SUFFIX);
        pnl.replaceImgSuffixCheckBox.onClick = () => {
            if (pnl.replaceImgSuffixCheckBox.value) {
                pnl.matchImgByOrderCheckBox.value = false; // incompatible to "match image file by order"
                Emit(pnl.matchImgByOrderCheckBox.onClick);
            }
            let enable = pnl.replaceImgSuffixCheckBox.value;
            pnl.replaceImgSuffixTextbox.enabled = enable;
            pnl.setSourceFileTypeList.enabled = enable;
        }
        xx += 195;
        pnl.replaceImgSuffixTextbox = pnl.add('edittext', [xx, yy, xx + 80, yy + 20]);
        xx += 85;
        let type_list = ["", ".psd", ".png", ".jpg", ".jpeg", ".tif", ".tiff"];
        pnl.setSourceFileTypeList = pnl.add('dropdownlist', [xx, yy - 1, xx + 50, yy + 21], type_list);
        let func = () => {
            pnl.replaceImgSuffixTextbox.text = pnl.setSourceFileTypeList.selection.text;
            pnl.setSourceFileTypeList.onChange = undefined;
            pnl.setSourceFileTypeList.selection = pnl.setSourceFileTypeList.find("");
            pnl.setSourceFileTypeList.onChange = func;
        }
        pnl.setSourceFileTypeList.onChange = func;
        xx = xOfs;
        yy += 23;

        // selct img
        yOfs = yy;
        pnl.chooseImageLabel = pnl.add('statictext', [xx, yy, xx + 150, yy + 20], I18n.LABEL_SELECT_IMG);
        yy += 23;
        pnl.chooseImageListBox = pnl.add('listbox', [xx, yy, xx + 150, yy + 265], [], { multiselect: true });

        // select label group
        yy = yOfs;
        xx = xOfs + 175;
        pnl.chooseGroupLabel = pnl.add('statictext', [xx, yy, xx + 150, yy + 20], I18n.LABEL_SELECT_GROUP);
        yy += 23;
        pnl.chooseGroupListBox = pnl.add('listbox', [xx, yy, xx + 150, yy + 265], [], { multiselect: true });
        xx = xOfs;
        yy += 270;

        // tip for multiple selection
        pnl.add('statictext', [xx, yy, xx + 330, yy + 44], I18n.LABEL_SELECT_TIP, { multiline: true });

        let opts = this.opts;
        if (opts.matchImgByOrder !== undefined) {
            pnl.matchImgByOrderCheckBox.value = opts.matchImgByOrder;
            Emit(pnl.matchImgByOrderCheckBox.onClick);
        }
        if (opts.replaceImgSuffix !== undefined) {
            pnl.replaceImgSuffixCheckBox.value = (opts.replaceImgSuffix !== "");
            pnl.replaceImgSuffixTextbox.text = opts.replaceImgSuffix;
            Emit(pnl.replaceImgSuffixCheckBox.onClick);
        }

        let getOption = (opts: CustomOptions, toFile: boolean): CustomOptions | null => {
            if (!toFile) {
                // image source folder
                let f = new Folder(pnl.sourceTextBox.text);
                if (!f || !f.exists) {
                    alert(I18n.ERROR_NOT_FOUND_SOURCE);
                    return null;
                }
                opts.source = f.fsName;

                // images select
                if (!pnl.chooseImageListBox.selection || pnl.chooseImageListBox.selection.length == 0) {
                    alert(I18n.ERROR_NO_IMG_CHOOSED);
                    return null;
                }
                opts.imageSelected = [];
                let items = pnl.chooseImageListBox.selection.sort();
                for (let i = 0; i < items.length; i++) {
                    opts.imageSelected[i] = { file: items[i].text, index: items[i].index };
                }

                // label groups
                if (!pnl.chooseGroupListBox.selection || pnl.chooseGroupListBox.selection.length == 0) {
                    alert(I18n.ERROR_NO_LABEL_GROUP_CHOOSED);
                    return null;
                }
                opts.groupSelected = [];
                for (let i = 0; i < pnl.chooseGroupListBox.selection.length; i++) {
                    opts.groupSelected[i] = pnl.chooseGroupListBox.selection[i].text;
                }
            }
            opts.replaceImgSuffix = (pnl.replaceImgSuffixCheckBox.value) ? pnl.replaceImgSuffixTextbox.text : "";
            opts.matchImgByOrder = pnl.matchImgByOrderCheckBox.value;
            return opts;
        }

        return {x: xx, y:yy, getOption: getOption };
    }

    private uiOutputPanel = (pnl: any): PanelDesc => {
        let xOfs = 10, yOfs = 20;
        let xx = xOfs,  yy = yOfs;

        pnl.text = I18n.PANEL_OUTPUT;

        // output folder
        pnl.targetLabel = pnl.add('statictext', [xx, yy, xx + 120, yy + 20], I18n.LABEL_TARGET);
        xx += 120;
        pnl.targetTextBox = pnl.add('edittext', [xx, yy, xx + 300, yy + 20], '');
        xx += 305;
        pnl.targetBrowse = pnl.add('button', [xx, yy - 2, xx + 30, yy + 20], '...');
        pnl.targetBrowse.onClick = () => {
            try {
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
                    pnl.targetTextBox.text = f.fsName;
                }
            } catch (e) {
                alert(Stdlib.exceptionMessage(e));
            }
        };
        xx = xOfs;
        yy += 23;

        // output file type
        pnl.outputTypeLabel = pnl.add('statictext', [xx, yy, xx + 120, yy + 20], I18n.LABEL_OUTPUT_FILE_TYPE);
        let type_arr: string[] = [];
        for (let i = 0; i < OptionOutputType._count; i++) {
            type_arr[i] = OptionOutputType[i];
        }
        xx += 120;
        pnl.outputTypeList = pnl.add('dropdownlist', [xx, yy - 1, xx + 100, yy + 21], type_arr);
        xx = xOfs;
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

        let opts = this.opts;
        if (opts.outputLabelIndex !== undefined) {
            pnl.outputLabelIndexCheckBox.value = opts.outputLabelIndex;
            Emit(pnl.outputLabelIndexCheckBox.onClick);
        }
        if (opts.ignoreNoLabelImg !== undefined) {
            pnl.ignoreNoLabelImgCheckBox.value = opts.ignoreNoLabelImg;
            Emit(pnl.ignoreNoLabelImgCheckBox.onClick);
        }
        if (opts.outputType !== undefined) {
            pnl.outputTypeList.selection = pnl.outputTypeList.find(OptionOutputType[opts.outputType]);
        }
        if (opts.notClose !== undefined) {
            pnl.notCloseCheckBox.value = opts.notClose;
            Emit(pnl.notCloseCheckBox.onClick);
        }
        if (opts.noLayerGroup !== undefined) {
            pnl.noLayerGroupCheckBox.value = opts.noLayerGroup;
            Emit(pnl.noLayerGroupCheckBox.onClick);
        }

        let getOption = (opts: CustomOptions, toFile: boolean): CustomOptions | null => {
            if (!toFile) {
                // image target folder
                let f = new Folder(pnl.targetTextBox.text);
                if (!f.exists) {
                    if (!f.create()) {
                        alert(I18n.ERROR_CREATE_NEW_FOLDER);
                        return null;
                    }
                }
                opts.target = f.fsName;
            }
            opts.outputType = <number>pnl.outputTypeList.selection.index;
            opts.outputLabelIndex = pnl.outputLabelIndexCheckBox.value;
            opts.ignoreNoLabelImg = pnl.ignoreNoLabelImgCheckBox.value;
            opts.notClose = pnl.notCloseCheckBox.value;
            opts.noLayerGroup = pnl.noLayerGroupCheckBox.value;
            return opts;
        }

        return {getOption: getOption};
    }

    private uiStylePanel = (pnl: any): PanelDesc => {
        let xOfs = 10, yOfs = 20;
        let xx = xOfs,  yy = yOfs;

        pnl.text = I18n.PANEL_STYLE;

        // template settings
        pnl.docTemplatePnl = pnl.add('panel', [xx, yy, xx + 460, yy + 65], I18n.PANEL_TEMPLATE_SETTING);

        let pnll: any = pnl.docTemplatePnl;
        let xxxOfs: number = 5;
        let xxx: number = xxxOfs;
        let yyy: number = 5;
        pnll.autoTemplateRb = pnll.add('radiobutton',  [xxx, yyy, xxx + 200, yyy + 20], I18n.RB_TEMPLATE_AUTO); xxx += 200;
        pnll.autoTemplateRb.value = true;
        pnll.noTemplateRb = pnll.add('radiobutton',  [xxx, yyy, xxx + 200, yyy + 20], I18n.RB_TEMPLATE_NO); xxx += 200;
        xxx = xxxOfs;
        yyy += 23;
        pnll.customTemplateRb = pnll.add('radiobutton', [xxx, yyy, xxx + 130, yyy + 20], I18n.RB_TEMPLATE_CUSTOM); xxx += 135;
        pnll.customTemplateTextbox = pnll.add('edittext', [xxx, yyy, xxx + 180, yyy + 20]); xxx += 185;
        pnll.customTemplateTextButton = pnll.add('button', [xxx, yyy - 2, xxx + 30, yyy + 20], '...'); xxx += 30;
        let rbclick = () => {
            let custom_enable: boolean = pnll.customTemplateRb.value;
            pnll.customTemplateTextbox.enabled = custom_enable;
            pnll.customTemplateTextButton.enabled = custom_enable;
        };
        pnll.autoTemplateRb.onClick = rbclick;
        pnll.noTemplateRb.onClick = rbclick;
        pnll.customTemplateRb.onClick = rbclick;
        rbclick();

        pnll.customTemplateTextButton.onClick = () => {
            try {
                let def: string;
                if (pnll.customTemplateTextbox.text !== "") {
                    def = pnll.customTemplateTextbox.text;
                } else if (this.inputPnl.sourceTextBox.text !== "") {
                    def = this.inputPnl.sourceTextBox.text;
                } else {
                    def = Folder.desktop.path;
                }
                let f = Stdlib.selectFileOpen(I18n.RB_TEMPLATE_CUSTOM, "*.psd;*.tif;*.tiff", def);
                if (f)
                    pnll.customTemplateTextbox.text = f.fsName;
            } catch (e) {
                alert(Stdlib.exceptionMessage(e));
            }
        };
        xx = xOfs;
        yy += 70;

        // text direction
        pnl.textDirLabel = pnl.add('statictext', [xx, yy, xx + 100, yy + 20], I18n.LABEL_TEXT_DIRECTION);
        xx += 100;
        pnl.textDirList = pnl.add('dropdownlist', [xx, yy, xx + 100, yy + 20], I18n.LIST_TEXT_DIT_ITEMS);
        pnl.textDirList.selection = pnl.textDirList.find(I18n.LIST_TEXT_DIT_ITEMS[0]);
        xx = xOfs;
        yy += 23;

        // set font
        {
            pnl.setFontCheckBox = pnl.add('checkbox', [xx, yy, xx + 50, yy + 20], I18n.CHECKBOX_SET_FONT);
            pnl.setFontCheckBox.onClick = () => {
                let value = pnl.setFontCheckBox.value;
                pnl.font.family.enabled = value;
                pnl.font.style.enabled = value;
                pnl.font.fontSize.enabled = value;
            }
            xx += 60;
            pnl.font = pnl.add('group', [xx, yy + 2, xx + 400, yy + 25]);
            this.createFontPanel(pnl.font);
            pnl.font.label.text = " ";
            pnl.font.family.enabled = false;
            pnl.font.style.enabled = false;
            pnl.font.fontSize.enabled = false;
            pnl.font.family.selection = pnl.font.family.find("SimSun");
            xx = xOfs;
            yy += 25;
        }

        // leading
        pnl.setTextLeadingCheckBox = pnl.add('checkbox', [xx, yy, xx + 100, yy + 20], I18n.CHECKBOX_SET_LEADING);
        pnl.setTextLeadingCheckBox.onClick = () => {
            pnl.textLeadingTextBox.enabled = pnl.setTextLeadingCheckBox.value;
        }
        xx += 105;
        pnl.textLeadingTextBox = pnl.add('edittext', [xx, yy, xx + 50, yy + 20]);
        pnl.textLeadingTextBox.enabled = false;
        pnl.textLeadingTextBox.text = "120";
        xx += 55;
        pnl.add('statictext', [xx, yy, xx + 40, yy + 20], "%");
        xx = xOfs;
        yy += 23;

        let opts = this.opts;
        if (opts.docTemplate !== undefined) {
            pnl.docTemplatePnl.autoTemplateRb.value = false;
            pnl.docTemplatePnl.noTemplateRb.value = false;
            pnl.docTemplatePnl.customTemplateRb.value = false;
            switch (opts.docTemplate) {
            case OptionDocTemplate.No:
                pnl.docTemplatePnl.noTemplateRb.value = true;
                break;
            case OptionDocTemplate.Custom:
                pnl.docTemplatePnl.customTemplateRb.value = true;
                pnl.docTemplatePnl.customTemplateTextbox.text = opts.docTemplateCustomPath;
                break;
            case OptionDocTemplate.Auto:
            default:
                pnl.docTemplatePnl.autoTemplateRb.value = true;
                break;
            }
            Emit(pnl.docTemplatePnl.autoTemplateRb.onClick);
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

        let getOption = (opts: CustomOptions): CustomOptions  | null => {
            opts.docTemplate =
                pnl.docTemplatePnl.autoTemplateRb.value ? OptionDocTemplate.Auto : (
                    pnl.docTemplatePnl.noTemplateRb.value ? OptionDocTemplate.No : (
                        pnl.docTemplatePnl.customTemplateRb.value ? OptionDocTemplate.Custom : OptionDocTemplate.Auto
                    )
                );
            opts.docTemplateCustomPath = pnl.docTemplatePnl.customTemplateTextbox.text;
            if (pnl.setFontCheckBox.value) {
                let font = pnl.font.getFont()
                opts.font = font.font;
                opts.fontSize = font.size;
            } else {
                opts.font = "";
                opts.fontSize = 0;
            }
            opts.textLeading = (pnl.setTextLeadingCheckBox.value) ? pnl.textLeadingTextBox.text : 0;
            opts.textDirection = <OptionTextDirection> I18n.LIST_TEXT_DIT_ITEMS.indexOf(pnl.textDirList.selection.text);
            return opts;
        }

        return {getOption: getOption};
    }

    private uiAutomationPanel = (pnl: any): PanelDesc => {
        let xOfs = 10, yOfs = 20;
        let xx = xOfs,  yy = yOfs;

        pnl.text = I18n.PANEL_AUTOMATION;

        // text replacing(example:"A->B|C->D")
        pnl.textReplaceCheckBox = pnl.add('checkbox', [xx, yy, xx + 250, yy + 20], I18n.CHECKBOX_TEXT_REPLACE);
        pnl.textReplaceCheckBox.onClick = () => {
            pnl.textReplaceTextBox.enabled = pnl.textReplaceCheckBox.value;
        };
        xx += 260;
        pnl.textReplaceTextBox = pnl.add('edittext', [xx, yy, xx + 180, yy + 20]);
        xx = xOfs;
        yy += 23;

        // run action
        pnl.runActionGroupCheckBox = pnl.add('checkbox', [xx, yy, xx + 500, yy + 20],
            I18n.CHECKBOX_RUN_ACTION);
        pnl.runActionGroupCheckBox.onClick = () => {
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
            pnl.dialogOverlayCheckBox.onClick = () => {
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
            let func = () => {
                pnl.overlayGroupTextBox.text += "," + pnl.overlayGroupAddGroupList.selection.text;
                pnl.overlayGroupAddGroupList.onChange = undefined;
                pnl.overlayGroupAddGroupList.selection = pnl.overlayGroupAddGroupList.find("");
                pnl.overlayGroupAddGroupList.onChange = func;
            }
            pnl.overlayGroupAddGroupList.onChange = func;
        }

        let opts = this.opts;
        if (opts.textReplace !== undefined) {
            pnl.textReplaceCheckBox.value = (opts.textReplace !== "");
            pnl.textReplaceTextBox.text = (opts.textReplace !== "") ? opts.textReplace : "！？->!?|...->…";
            Emit(pnl.textReplaceCheckBox.onClick);
        }
        if (opts.actionGroup !== undefined) {
            pnl.runActionGroupCheckBox.value = (opts.actionGroup !== "");
            let item = pnl.runActionGroupList.find(opts.actionGroup);
            if (item !== undefined)
                pnl.runActionGroupList.selection = item;
            Emit(pnl.runActionGroupCheckBox.onClick);
        }
        if (opts.dialogOverlayLabelGroups !== undefined) {
            pnl.dialogOverlayCheckBox.value = (opts.dialogOverlayLabelGroups !== "");
            pnl.overlayGroupTextBox.text = opts.dialogOverlayLabelGroups;
            Emit(pnl.dialogOverlayCheckBox.onClick);
        }

        let getOption = (opts: CustomOptions): CustomOptions | null => {
            opts.textReplace = (pnl.textReplaceCheckBox.value) ? pnl.textReplaceTextBox.text : "";
            opts.actionGroup = (pnl.runActionGroupCheckBox.value) ? pnl.runActionGroupList.selection.text : "";
            opts.dialogOverlayLabelGroups = (pnl.dialogOverlayCheckBox.value)? pnl.overlayGroupTextBox.text : "";
            return opts;
        }

        return {getOption: getOption};
    }

    private uiHelpPanel(pnl: any): PanelDesc {
        return {};
    }

    private allPanelEnable = (enable: boolean) => {
        this.inputPnl.enabled = enable;
        this.outputPnl.enabled = enable;
        this.stylePnl.enabled = enable;
        this.automationPnl.enabled = enable;
    }

    public mainPannel = (pnl: any) => {
        let xOfs = 10, yOfs = 0;
        let xx = xOfs,  yy = yOfs;
        let ret: PanelDesc;

        this.optPickers = [];

        // lp text select
        ret = this.uiLpTextSelect(pnl);
        this.addToPickerList(ret.getOption);
        yy += 40;
        yOfs = yy;

        // setting save/load
        this.settingsPnl = pnl.add('panel', [xx, yy, xx + 355, yy + 50]);
        ret = this.uiSettingsPanel(this.settingsPnl);
        this.addToPickerList(ret.getOption);
        yy += 60;

        // input options
        this.inputPnl = pnl.add('panel', [xx, yy, xx + 355, yy + 420]);
        ret = this.uiInputPanel(this.inputPnl);
        this.addToPickerList(ret.getOption);
        xx += 365;

        xOfs = xx;
        xx = xOfs;
        yy = yOfs;

        // output options
        this.outputPnl = pnl.add('panel', [xx, yy, xx + 480, yy + 120]);
        ret = this.uiOutputPanel(this.outputPnl);
        this.addToPickerList(ret.getOption);
        yy += 130;

        // style
        this.stylePnl = pnl.add('panel', [xx, yy, xx + 480, yy + 180]);
        ret = this.uiStylePanel(this.stylePnl);
        this.addToPickerList(ret.getOption);
        yy += 190;

        // automation
        this.automationPnl = pnl.add('panel', [xx, yy, xx + 480, yy + 160]);
        ret = this.uiAutomationPanel(this.automationPnl);
        this.addToPickerList(ret.getOption);
        yy += 170;

        // help bar
        xx = this.winRect.w - 220;
        yy = 5;
        this.HelpPnl = pnl.add('panel', [ , 0, "", [xx, yy, xx + 200, yy + 25]]);
        ret = this.uiHelpPanel(this.HelpPnl);

        this.allPanelEnable(this.lpFile != null);
        return pnl;
    }

    private geCustomOptions = (toFile: boolean): CustomOptions | null => {
        let new_opts = new CustomOptions();
        for (let i = 0; i < this.optPickers.length; i++) {
            let ret = this.optPickers[i](new_opts, toFile);
            if (ret == null) {
                return null
            }
            new_opts = ret;
        }
        return new_opts;
    }

}

LabelPlusInput.prototype.createPanel = function (pnl: any, ini: never) {
    this.mainPannel(pnl);
    this.moveWindow(100, 100);
}

// validate user panel, generate CustomOptions
// tofile: if it is saving config to file
LabelPlusInput.prototype.validatePanel = function (pnl: any, ini: any, tofile: boolean) :CustomOptions | boolean {
    let ret = this.geCustomOptions(tofile);
    return (ret == null) ? false : ret;
};

LabelPlusInput.prototype.process = function (opts: CustomOptions, doc)
{
    let result = false;

    try {
        writeIni(DEFAULT_INI_PATH, opts); // auto save ini
        result = importFiles(opts);
    } catch (e) {
        log_err('All log:');
        log_err(alllog);
        log_err('Unexpected Error:');
        log_err(Stdlib.exceptionMessage(e));
    }
    if (result && (errlog == "")) {
        alert(I18n.COMPLETE);
        return;
    }
    else if (result && (errlog != "")) {
        alert(I18n.COMPLETE_WITH_ERROR, "error", true);
    }
    else if (!result) {
        alert(I18n.COMPLETE_FAILED, "error", true);
    }

    var logwin = new LogWindow('Error');
    logwin.append(errlog);
    logwin.show();
}

function writeIni (iniFile: string, ini: CustomOptions) {
    if (!ini || !iniFile) {
        return;
    }
    let file = GenericUI.iniFileToFile(iniFile);

    if (!file) {
        throw new Error("Bad ini file specified: \"" + iniFile + "\".");
    }

    if (file.open("w", "TEXT", "????")) {
        file.lineFeed = "unix";
        file.encoding = 'UTF-8';
        let str = jamJSON.stringify(ini, "\n");
        file.write(str);
        file.close();
    }
    return ini;
};

function readIni(iniFile: string): CustomOptions {
    let ini = new CustomOptions();
    let file = GenericUI.iniFileToFile(iniFile);

    if (!file) {
        throw new Error("Bad ini file specified: \"" + iniFile + "\".");
    }
    if (file.exists && file.open("r", "TEXT", "????")) {
        file.lineFeed = "unix";
        file.encoding = 'UTF-8';
        let str = file.read();
        ini = jamJSON.parse(str);
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

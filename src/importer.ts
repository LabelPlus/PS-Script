/// <reference path="legacy.d.ts" />
/// <reference path="common.ts" />

namespace LabelPlus {

function doAction(action, actionSet)
{
    if (Stdlib.hasAction(action, actionSet.toString())) {
        app.doAction(action, actionSet.toString());
    }
}

export function importFiles(opts: CustomOptions)
{
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
        break;
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

    // 确定文字方向
    let textDir: Direction | undefined;
    switch (opts.textDirection) {
    case OptionTextDirection.Keep:       textDir = undefined; break;
    case OptionTextDirection.Horizontal: textDir = Direction.HORIZONTAL; break;
    case OptionTextDirection.Vertical:   textDir = Direction.VERTICAL; break;
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
        let bgLayer :ArtLayer | undefined;
        let pendingDelLayerList:{ [key: string]: ArtLayer } = {}; // 待删除图层列表，导入完毕时删除该列表中的图层
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
                    doc.activeLayer.name = TEMPLETE_LAYER.IMAGE;
                } else {
                    let docFile = new File(templete_path);
                    doc = app.open(docFile);
                    doc.resizeImage(undefined, undefined, bg.resolution);
                    doc.resizeCanvas(bg.width, bg.height);
                }
                // 将模板中所有图层加入待删除列表
                for (let i = 0; i < doc.artLayers.length; i++) {
                    let layer: ArtLayer = doc.artLayers[i];
                    pendingDelLayerList[layer.name] = layer;
                }

                // 选中bg图层，将图片粘贴进去
                bgLayer = doc.artLayers.getByName(TEMPLETE_LAYER.IMAGE);
                doc.activeLayer = bgLayer;
                doc.paste();
                bg.close(SaveOptions.DONOTSAVECHANGES);
                delete pendingDelLayerList[TEMPLETE_LAYER.IMAGE]; // keep bg layer
            }

            // 寻找文本模板，即名为text的图层；若text图层不存在，复制一个文本图层，若文本图层不存在，让textTempleteLayer保持undefined
            try { textTempleteLayer = doc.artLayers.getByName(TEMPLETE_LAYER.TEXT); }
            catch {
                Stdlib.log("text templete layer not found, copy one.");
                for (let i = 0; i < doc.artLayers.length; i++) {
                    let layer: ArtLayer = <ArtLayer> doc.artLayers[i];
                    if (layer.kind == LayerKind.TEXT) {
                        /// @ts-ignore ts声明文件有误，duplicate()返回ArtLayer对象，而不是void
                        textTempleteLayer = <ArtLayer> layer.duplicate();
                        textTempleteLayer.textItem.contents = TEMPLETE_LAYER.TEXT;
                        textTempleteLayer.name = TEMPLETE_LAYER.TEXT;

                        pendingDelLayerList[TEMPLETE_LAYER.TEXT] = layer; // 导入完成后删除该图层
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

        // 确定涂白模板
        let dialogOverlayLayer: ArtLayer;
        try { dialogOverlayLayer = doc.artLayers.getByName(TEMPLETE_LAYER.DIALOG_OVERLAY); }
        catch {
            dialogOverlayLayer = doc.artLayers.add();
            dialogOverlayLayer.name = TEMPLETE_LAYER.DIALOG_OVERLAY;
        }

        // 若文档类型为索引色模式 更改为RGB模式
        if (doc.mode == DocumentMode.INDEXEDCOLOR) {
            doc.changeMode(ChangeMode.RGB);
        }

        // 分组
        class Group {
            layerSet: LayerSet | undefined;
            templete: ArtLayer | undefined;
        };
        let group: { [key: string]: Group } = {};
        for (let i = 0; i < opts.groupSelected.length; i++) {
            let name = opts.groupSelected[i];
            let tmp = new Group();

            // 创建PS中图层分组
            if (!opts.layerNotGroup) {
                tmp.layerSet = doc.layerSets.add();
                tmp.layerSet.name = name;
            }
            // 尝试寻找分组模板，找不到则使用默认文本模板
            if (opts.docTemplete !== OptionDocTemplete.No) {
                let l: ArtLayer | undefined;
                try {
                    l = doc.artLayers.getByName(name);
                } catch { };
                tmp.templete = (l !== undefined) ? l : textTempleteLayer;
            }
            group[name] = tmp; // add
        }
        if (opts.outputLabelNumber) {
            let tmp = new Group();
            tmp.layerSet = doc.layerSets.add();
            tmp.layerSet.name = "Label";
            group["_Label"] = tmp;
        }

        // 文件打开时执行一次动作"_start"
        if (opts.runActionGroup) {
            try {
                doc.activeLayer = doc.layers[doc.layers.length - 1];
                doAction("_start", opts.runActionGroup);
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
                let labelGroup: string = gourpData[labelData[j].LabelheadValue[2]];

                if (labelGroup == opts.overloayGroup) {
                    labelArr.push(labelXY);
                }
            }

            //执行涂白
            MyAction.lp_dialogClear(labelArr, doc.width, doc.height, 16, 1, dialogOverlayLayer);

            delete pendingDelLayerList[TEMPLETE_LAYER.DIALOG_OVERLAY];
        }

        // 遍历LabelData
        for (let j = 0; j < labelData.length; j++) {
            let labelNum = j + 1;
            let labelX = labelData[j].LabelheadValue[0];
            let labelY = labelData[j].LabelheadValue[1];
            let labelGroup = gourpData[labelData[j].LabelheadValue[2]];
            let labelString = labelData[j].LabelString;

            // 所在分组是否需要导入
            if (opts.groupSelected.indexOf(labelGroup) == -1)
                continue;

            // 导出标号
            if (opts.outputLabelNumber) {
                let o = new TextInputOptions();
                o.templete = textTempleteLayer;
                o.font = "Arial";
                o.size = (opts.fontSize !== 0) ? UnitValue(opts.fontSize, "pt") : undefined;
                o.group = group["_Label"].layerSet;
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
            let textLayer: ArtLayer;
            if (labelString && labelString != "") {
                let o = new TextInputOptions();
                o.templete = group[labelGroup].templete;
                o.font = (opts.font != "") ? opts.font : undefined;
                if (opts.fontSize !== 0) {
                    o.size = UnitValue(opts.fontSize, "pt");
                } else if (opts.docTemplete !== OptionDocTemplete.No) {
                    o.size = UnitValue(doc.height.as("pt") / 90.0, "pt");
                } else {
                    o.size = undefined;
                }
                o.size = (opts.fontSize !== 0) ?  new UnitValue(opts.fontSize, "pt") : undefined;
                o.direction = textDir;
                o.group = group[labelGroup].layerSet;
                o.lending = opts.textLeading ? opts.textLeading : undefined;
                textLayer = newTextLayer(doc, labelString, labelX, labelY, o);
            } else {
                continue;
            }

            // 执行动作,名称为分组名
            if (opts.runActionGroup) {
                try {
                    doc.activeLayer = textLayer;
                    doAction(labelGroup, opts.runActionGroup);
                }
                catch (e) {
                    Stdlib.log("DoAction " + labelGroup +
                        " in " + opts.runActionGroup +
                        " Error: \r\n" + e);
                }
            }
        }

        // 调整图层顺序
        if (bgLayer && (opts.overloayGroup !== "")) {
            // 涂白图层 在 bg层之上
            //todo: 未处理打开文件为psd/tiff的情况，考虑将这类文件中的所有图层放到一个分组里，来实现排序
            dialogOverlayLayer.move(bgLayer, ElementPlacement.PLACEBEFORE);
        }


        // 删除多余的图层、分组
        for (let k in pendingDelLayerList) { // 删除模板中无用的图层
            pendingDelLayerList[k].remove();
        }
        for (let k in group) { // 删除分组LayerSet
            if (group[k].layerSet !== undefined) {
                if (group[k].layerSet?.artLayers.length === 0) {
                    group[k].layerSet?.remove();
                }
            }
        }

        // 文件关闭时执行一次动作"_end"
        if (opts.runActionGroup) {
            try {
                doc.activeLayer = doc.layers[doc.layers.length - 1];
                doAction("_end", opts.runActionGroup);
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

} // namespace LabelPlus

/// <reference path="legacy.d.ts" />
/// <reference path="custom_options.ts" />
/// <reference path="common.ts" />
/// <reference path="text_parser.ts" />

namespace LabelPlus {

// global var
let opts: CustomOptions | null = null;
let textReplace: TextReplaceInfo = [];

interface Group {
    layerSet?: LayerSet;
    template?: ArtLayer;
};
type GroupDict = { [key: string]: Group };

interface LabelInfo {
    index: number;
    x: number;
    y: number;
    group: string;
    contents: string;
};

interface ImageWorkspace {
    doc: Document;

    bgLayer: ArtLayer;
    textTemplateLayer: ArtLayer;
    dialogOverlayLayer: ArtLayer;

    pendingDelLayerList: ArtLayer[];
    groups: GroupDict;
};

interface ImageInfo {
    ws: ImageWorkspace;
    name: string;
    labels: LpLabel[];
};

function importLabel(img: ImageInfo, label: LabelInfo): boolean
{
    assert(opts !== null);

    // import the index of the Label
    if (opts.outputLabelIndex) {
        let o: TextInputOptions = {
            template: img.ws.textTemplateLayer,
            direction: Direction.HORIZONTAL,
            font: "Arial",
            size: (opts.fontSize !== 0) ? UnitValue(opts.fontSize, "pt") : undefined,
            lgroup: img.ws.groups["_Label"].layerSet,
        };
        newTextLayer(img.ws.doc, String(label.index), label.x, label.y, o);
    }

    // 替换文本
    if (opts.textReplace) {
        for (let k = 0; k < textReplace.length; k++) {
            while (label.contents.indexOf(textReplace[k].from) != -1)
                label.contents = label.contents.replace(textReplace[k].from, textReplace[k].to);
        }
    }

    // 确定文字方向
    let textDir: Direction | undefined;
    switch (opts.textDirection) {
    case OptionTextDirection.Keep:       textDir = undefined; break;
    case OptionTextDirection.Horizontal: textDir = Direction.HORIZONTAL; break;
    case OptionTextDirection.Vertical:   textDir = Direction.VERTICAL; break;
    }

    // 导出文本，设置的优先级大于模板，无模板时做部分额外处理
    let textLayer: ArtLayer;
    let o: TextInputOptions = {
        template: img.ws.groups[label.group].template,
        font: (opts.font != "") ? opts.font : undefined,
        direction: textDir,
        lgroup: img.ws.groups[label.group].layerSet,
        lending: opts.textLeading ? opts.textLeading : undefined,
    };

    // 使用模板时，用户不设置字体大小，不做更改；不使用模板时，如果用户不设置大小，自动调整到合适的大小
    if (opts.docTemplate === OptionDocTemplate.No) {
        let proper_size = UnitValue(min(img.ws.doc.height.as("pt"), img.ws.doc.height.as("pt")) / 90.0, "pt");
        o.size = (opts.fontSize !== 0) ? UnitValue(opts.fontSize, "pt") : proper_size;
    } else {
        o.size = (opts.fontSize !== 0) ? UnitValue(opts.fontSize, "pt") : undefined;
    }
    textLayer = newTextLayer(img.ws.doc, label.contents, label.x, label.y, o);

    // 执行动作,名称为分组名
    if (opts.actionGroup) {
        img.ws.doc.activeLayer = textLayer;
        let result = doAction(label.group, opts.actionGroup);
        log("run action " + label.group + "[" + opts.actionGroup + "]..." + result ? "done" : "fail");
    }
    return true;
}

function importImage(img: ImageInfo): boolean
{
    assert(opts !== null);

    // run action _start
    if (opts.actionGroup) {
        img.ws.doc.activeLayer = img.ws.doc.layers[img.ws.doc.layers.length - 1];
        let result = doAction("_start", opts.actionGroup);
        log("run action _start[" + opts.actionGroup + "]..." + result ? "done" : "fail");
    }

    // 找出需要涂白的标签,记录他们的坐标,执行涂白
    if (opts.dialogOverlayLabelGroups) {
        let points = new Array();
        let groups = opts.dialogOverlayLabelGroups.split(",");
        for (let j = 0; j < img.labels.length; j++) {
            let l = img.labels[j];
            if (groups.indexOf(l.group) >= 0) {
                points.push({ x: l.x, y: l.y });
            }
        }
        log("do lp_dialogClear: " + points);
        MyAction.lp_dialogClear(points, img.ws.doc.width, img.ws.doc.height, 16, 1, img.ws.dialogOverlayLayer);
        delArrayElement<ArtLayer>(img.ws.pendingDelLayerList, img.ws.dialogOverlayLayer); // do not delete dialog-overlay-layer
    }

    // 遍历LabelData
    for (let j = 0; j < img.labels.length; j++) {
        let l = img.labels[j];
        if (opts.groupSelected.indexOf(l.group) == -1) // the group did not select by user, return directly
            continue;

        let label_info: LabelInfo = {
            index: j + 1,
            x: l.x,
            y: l.y,
            group: l.group,
            contents: l.contents,
        };
        log("import label " + label_info.index + "...");
        importLabel(img, label_info);
    }

    // adjust layer order
    if (img.ws.bgLayer && (opts.dialogOverlayLabelGroups !== "")) {
        log('move "dialog-overlay" before "bg"');
        img.ws.dialogOverlayLayer.move(img.ws.bgLayer, ElementPlacement.PLACEBEFORE);
    }

    // remove unnecessary Layer/LayerSet
    log('remove unnecessary Layer/LayerSet...');
    for (var layer of img.ws.pendingDelLayerList) { // Layer
        layer.remove();
    }
    for (let k in img.ws.groups) { // LayerSet
        if (img.ws.groups[k].layerSet !== undefined) {
            if (img.ws.groups[k].layerSet?.artLayers.length === 0) {
                img.ws.groups[k].layerSet?.remove();
            }
        }
    }

    // run action _end
    if (opts.actionGroup) {
        img.ws.doc.activeLayer = img.ws.doc.layers[img.ws.doc.layers.length - 1];
        let result = doAction("_end", opts.actionGroup);
        log("run action _end[" + opts.actionGroup + "]..." + result ? "done" : "fail");
    }
    return true;
}

function openImageWorkspace(img_filename: string, template_path: string): ImageWorkspace | null
{
    assert(opts !== null);

    // open background image
    let bgDoc: Document;
    try {
        let bgFile = new File(opts.source + dirSeparator + img_filename);
        bgDoc = app.open(bgFile);
    } catch {
        return null; //note: do not exit if image not exist
    }

    // if template is enabled, open template; or create a new file
    let wsDoc: Document; // workspace document
    if (opts.docTemplate == OptionDocTemplate.No) {
        wsDoc = app.documents.add(bgDoc.width, bgDoc.height, bgDoc.resolution, bgDoc.name, NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
        wsDoc.activeLayer.name = TEMPLATE_LAYER.IMAGE;
    } else {
        let docFile = new File(template_path);  //note: if template must do not exist, crash
        wsDoc = app.open(docFile);
        wsDoc.resizeImage(undefined, undefined, bgDoc.resolution);
        wsDoc.resizeCanvas(bgDoc.width, bgDoc.height);
    }

    // wsDoc is clean, check template elements, if a element not exist
    let bgLayer: ArtLayer;
    let textTemplateLayer: ArtLayer;
    let dialogOverlayLayer: ArtLayer;
    let pendingDelLayerList: ArtLayer[] = new Array();
    {
        // add all artlayers to the pending delete list
        for (let i = 0; i < wsDoc.artLayers.length; i++) {
            let layer: ArtLayer = wsDoc.artLayers[i];
            pendingDelLayerList.push(layer);
        }

        // bg layer template
        try { bgLayer = wsDoc.artLayers.getByName(TEMPLATE_LAYER.IMAGE); }
        catch {
            bgLayer = wsDoc.artLayers.add();
            bgLayer.name = TEMPLATE_LAYER.DIALOG_OVERLAY;
        }
        // text layer template
        try { textTemplateLayer = wsDoc.artLayers.getByName(TEMPLATE_LAYER.TEXT); }
        catch {
            textTemplateLayer = wsDoc.artLayers.add();
            textTemplateLayer.name = TEMPLATE_LAYER.TEXT;
            pendingDelLayerList.push(textTemplateLayer); // pending delete
        }
        // dialog overlay layer template
        try { dialogOverlayLayer = wsDoc.artLayers.getByName(TEMPLATE_LAYER.DIALOG_OVERLAY); }
        catch {
            dialogOverlayLayer = wsDoc.artLayers.add();
            dialogOverlayLayer.name = TEMPLATE_LAYER.DIALOG_OVERLAY;
        }
    }

    // import bgDoc to wsDoc:
    // if bgDoc has only a layer, select all and copy to bg layer, for applying bg layer template
    // if bgDoc has multiple layers, move all layers after bg layer (bg layer template is invalid)
    if ((bgDoc.artLayers.length == 1) && (bgDoc.layerSets.length == 0)) {
        app.activeDocument = bgDoc;
        bgDoc.selection.selectAll();
        bgDoc.selection.copy();
        app.activeDocument = wsDoc;
        wsDoc.activeLayer = bgLayer;
        wsDoc.paste();
        delArrayElement<ArtLayer>(pendingDelLayerList, bgLayer); // keep bg layer
    } else {
        app.activeDocument = bgDoc;
        let item = bgLayer;
        for (let i = 0; i < bgDoc.layers.length; i++) {
            item = bgDoc.layers[i].duplicate(item, ElementPlacement.PLACEAFTER);
        }
    }
    bgDoc.close(SaveOptions.DONOTSAVECHANGES);

    // 若文档类型为索引色模式 更改为RGB模式
    if (wsDoc.mode == DocumentMode.INDEXEDCOLOR) {
        log("wsDoc.mode is INDEXEDCOLOR, set RGB");
        wsDoc.changeMode(ChangeMode.RGB);
    }

    // 分组
    let groups: GroupDict = {};
    for (let i = 0; i < opts.groupSelected.length; i++) {
        let name = opts.groupSelected[i];
        let tmp: Group = {};

        // 创建PS中图层分组
        if (!opts.noLayerGroup) {
            tmp.layerSet = wsDoc.layerSets.add();
            tmp.layerSet.name = name;
        }
        // 尝试寻找分组模板，找不到则使用默认文本模板
        if (opts.docTemplate !== OptionDocTemplate.No) {
            let l: ArtLayer | undefined;
            try {
                l = wsDoc.artLayers.getByName(name);
            } catch { };
            tmp.template = (l !== undefined) ? l : textTemplateLayer;
        }
        groups[name] = tmp; // add
    }
    if (opts.outputLabelIndex) {
        let tmp: Group = {};
        tmp.layerSet = wsDoc.layerSets.add();
        tmp.layerSet.name = "Label";
        groups["_Label"] = tmp;
    }

    let ws: ImageWorkspace = {
        doc: wsDoc,
        bgLayer: bgLayer,
        textTemplateLayer: textTemplateLayer,
        dialogOverlayLayer: dialogOverlayLayer,
        pendingDelLayerList: pendingDelLayerList,
        groups: groups,
    };
    return ws;
}

function closeImage(img: ImageInfo, saveType: OptionOutputType = OptionOutputType.PSD): boolean
{
    assert(opts !== null);

    // 保存文件
    let fileOut = new File(opts.target + dirSeparator + img.name);
    let asCopy = false;
    let options: any;
    switch (saveType) {
    case OptionOutputType.PSD:
        options = PhotoshopSaveOptions;
        break;
    case OptionOutputType.TIFF:
        options = TiffSaveOptions;
        break;
    case OptionOutputType.PNG:
        options = PNGSaveOptions;
        asCopy = true;
        break;
    case OptionOutputType.JPG:
        options = new JPEGSaveOptions();
        options.quality = 10;
        asCopy = true;
        break;
    default:
        log_err("unkown save type: " + saveType);
        return false
    }

    let extensionType = Extension.LOWERCASE;
    img.ws.doc.saveAs(fileOut, options, asCopy, extensionType);

    // 关闭文件
    if (!opts.notClose)
        img.ws.doc.close(SaveOptions.DONOTSAVECHANGES);

    return true;
}

export function importFiles(custom_opts: CustomOptions): boolean
{
    opts = custom_opts;

    log("Start import process!!!");
    log("Properties start ------------------");
    log(Stdlib.listProps(opts));
    log("Properties end   ------------------");

    //解析LabelPlus文本
    let lpFile = lpTextParser(opts.lpTextFilePath);
    if (lpFile == null) {
        log_err("error: " + I18n.ERROR_PARSER_LPTEXT_FAIL);
        return false;
    }
    log("parse lptext done...");

    // 替换文本解析
    if (opts.textReplace) {
        let tmp = textReplaceReader(opts.textReplace);
        if (tmp === null) {
            log_err("error: " + I18n.ERROR_TEXT_REPLACE_EXPRESSION);
            return false;
        }
        textReplace = tmp;
    }
    log("parse textreplace done...");

    // 确定doc模板文件
    let template_path: string = "";
    switch (opts.docTemplate) {
    case OptionDocTemplate.Custom:
        template_path = opts.docTemplateCustomPath;
        if (!FileIsExists(template_path)) {
            log_err("error: " + I18n.ERROR_NOT_FOUND_TEMPLATE + " " + template_path);
            return false;
        }
        break;
    case OptionDocTemplate.Auto:
        let tempdir = GetScriptFolder() + dirSeparator + "ps_script_res" + dirSeparator;
        let tempname = app.locale.split("_")[0].toLocaleLowerCase() + ".psd"; // such as "zh_CN" -> zh.psd

        let try_list: string[] = [
            tempdir + tempname,
            tempdir + "en.psd"
        ];
        for (let i = 0; i < try_list.length; i++) {
            if (FileIsExists(try_list[i])) {
                template_path = try_list[i];
                break;
            }
        }
        if (template_path === "") {
            log_err("error: " + I18n.ERROR_PRESET_TEMPLATE_NOT_FOUND);
            return false;
        }
        log("auto match template: " + template_path);
        break;
    case OptionDocTemplate.No:
    default:
        log("template not used");
        break;
    }

    // 遍历所选图片
    let originFileList = getFilesListOfPath(opts.source); //读取图源文件夹文件列表
    for (let i = 0; i < opts.imageSelected.length; i++) {
        let originName :string = opts.imageSelected[i].file; // 翻译文件中的图片文件名
        let filename: string;

        log('[' + originName + '] in processing...' );
        if (opts.ignoreNoLabelImg && lpFile?.images[originName].length == 0) { // ignore img with no label
            log('no label, ignored...');
            continue;
        }

        // replace suffix && match by order
        if (opts.replaceImgSuffix) {
            filename = originName.substring(0, originName.lastIndexOf(".")) + opts.replaceImgSuffix;
        }
        else if (opts.matchImgByOrder) {
            filename = originFileList[opts.imageSelected[i].index];
        }
        else {
            filename = originName;
        }

        let ws = openImageWorkspace(filename, template_path);
        if (ws == null) {
            log_err(filename + ": " + I18n.ERROR_FILE_OPEN_FAIL);
            continue;
        }

        let img_info: ImageInfo = {
            ws: ws,
            name: filename,
            labels: lpFile.images[originName],
        };
        if (!importImage(img_info)) {
            log_err(filename + ": import label failed");
        }
        if (!closeImage(img_info, opts.outputType)) {
            log_err(filename + ": " + I18n.ERROR_FILE_SAVE_FAIL);
        }
        log(filename + ": done");
    }
    log("All Done!");
    return true;
};


// 文本导入选项，参数为undefined时表示不设置该项
interface TextInputOptions {
    template?: ArtLayer;     // 文本图层模板
    font?: string;
    size?: UnitValue;
    direction?: Direction;
    lgroup?: LayerSet;
    lending?: number;        // 自动行距
};

// 创建文本图层
function newTextLayer(doc: Document, text: string, x: number, y: number, topts: TextInputOptions = {}): ArtLayer
{
    let artLayerRef: ArtLayer;
    let textItemRef: TextItem;

    // 从模板创建，可以保证图层的所有格式与模板一致
    if (topts.template) {
        /// @ts-ignore ts声明文件有误，duplicate()返回ArtLayer对象，而不是void
        artLayerRef = <ArtLayer> topts.template.duplicate();
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

    if (topts.lgroup)
        artLayerRef.move(topts.lgroup, ElementPlacement.PLACEATBEGINNING);

    if ((topts.lending) && (topts.lending != 0)) {
        textItemRef.useAutoLeading = true;
        textItemRef.autoLeadingAmount = topts.lending;
    }

    artLayerRef.name     = text;
    textItemRef.contents = text;

    return artLayerRef;
}

type TextReplaceInfo = { from: string; to: string; }[];

// 文本替换表达式解析
function textReplaceReader(str: string): TextReplaceInfo | null
{
    let arr: TextReplaceInfo = [];

    let strs = str.split('|');
    if (!strs)
        return null; //解析失败

    for (let i = 0; i < strs.length; i++) {
        if (strs[i] === "")
            continue;

        let strss = strs[i].split("->");
        if ((strss.length != 2) || (strss[0] == ""))
            return null; //解析失败

        arr.push({ from: strss[0], to: strss[1] });
    }
    return arr;
}

} // namespace LabelPlus

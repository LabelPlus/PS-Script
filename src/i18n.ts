namespace i18n {
    export var APPNAME: string = "LabelPlus Script";
    export var TIP_TITLE: string = "说明";
    export var TIP_TEXT: string = "本脚本支持将LabelPlus格式的文本导入成ps图层。\r\n" +
        "利用\“存取配置\”功能，可以方便的根据不同需求（如区分图片分辨率），快速应用配置。\r\n" +
        "更多信息: https://noodlefighter.com/label_plus/";

    export var BUTTON_RUN: string = "导入";
    export var BUTTON_CANCEL: string = "关闭";
    export var BUTTON_LOAD: string = "加载配置";
    export var BUTTON_SAVE: string = "保存配置";
    export var BUTTON_RESET: string = "还原配置";

    export var LABEL_TIP_FILE: string = "> 文件 / 预处理";
    export var LABEL_TIP_Behavior: string = "> 脚本行为";
    export var LABEL_TIP_STYLE_AUTO: string = "> 格式 / 自动化";

    export var LABEL_TEXTFILE: string = "LabelPlus文本:";
    export var LABEL_SOURCE: string = "图源文件夹:";
    export var LABEL_TARGET: string = "输出PSD文件夹:";
    export var LABEL_SETTING: string = "存取配置";
    export var LABEL_SELECTIMAGE: string = "导入图片选择";
    export var LABEL_SELECTGROUP: string = "导入分组选择";


    export var CHECKBOX_OUTPUTLABELNUMBER: string = "导出标号";
    export var CHECKBOX_TextReplace: string = "文本替换(格式:\"A->B|C->D\")";
    export var CHECKBOX_OUTPUTNOSIGNPSD: string = "导出没有标号的文档";
    export var CHECKBOX_AutoMatchImgFile: string = "按顺序自动匹配图片文件";
    export var BUTTON_AutoMatchImgFilePreview: string = "预览匹配结果";
    export var CHECKBOX_SetSourceType: string = "替换图片后缀名";
    export var CHECKBOX_RUNACTION: string = "导入文本后，执行以分组名命名的动作；打开图片时执行_start，关闭前执行_end动作";
    export var CHECKBOX_NOTCLOSE: string = "导入后不关闭文档";
    export var CHECKBOX_SetFont: string = "字体";
    export var CHECKBOX_SetLeading: string = "行距";
    export var CHECKBOX_OutputHorizontalText: string = "输出横向文本";
    export var CHECKBOX_LAYERNOTGROUP: string = "不对图层进行分组";
    export var CHECKBOX_OVERLAY: string = "对指定分组执行涂白动作(实验性功能)";

    export var COMPLETE: string = "导出完毕！";

    export var ERROR_NOTFOUNDSOURCE: string = "未找到图源文件夹";
    export var ERROR_NOTFOUNDTARGET: string = "未找到目标文件夹";
    export var ERROR_NOTFOUNLABELTEXT: string = "未找到LabelPlus文本文件";
    export var ERROR_CANNOTBUILDNEWFOLDER: string = "无法创建新文件夹";
    export var ERROR_READLABELTEXTFILEFAILL: string = "解析LabelPlus文本失败";
    export var ERROR_NOTCHOOSEIMAGE: string = "未选择输出图片";
    export var ERROR_NOTCHOOSEGROUP: string = "未选择导入分组";

    declare var app: any;
    // if (true) {
    if (!(app.locale in {"zh_CN":1, "zh_TW":1, "zh_HK":1})) {
        TIP_TITLE = "Note";
        TIP_TEXT = "Help: https://noodlefighter.com/label_plus/";
        BUTTON_RUN = "Run";
        BUTTON_CANCEL = "Cancel";
        BUTTON_LOAD = "Load";
        BUTTON_SAVE = "Save";
        BUTTON_RESET = "Reset";
        LABEL_TIP_FILE = "> File / Preprocessing";
        LABEL_TIP_Behavior = "> Behavior";
        LABEL_TIP_STYLE_AUTO = "> Format / Automation";
        LABEL_TEXTFILE = "LabelPlus Text:";
        LABEL_SOURCE = "Image Source:";
        LABEL_TARGET = "Output PSD:";
        LABEL_SETTING = "Setting";
        LABEL_SELECTIMAGE = "Select Image";
        LABEL_SELECTGROUP = "Select Group";
        CHECKBOX_OUTPUTLABELNUMBER = "Output Label Number";
        CHECKBOX_TextReplace = "Text Replace(e.g. \"A->B|C->D\")";
        CHECKBOX_OUTPUTNOSIGNPSD = "Output no label file";
        CHECKBOX_AutoMatchImgFile = "Auto Match Imgage Source File";
        BUTTON_AutoMatchImgFilePreview = "Preview Match Result";
        CHECKBOX_SetSourceType = "Replace file extension";
        CHECKBOX_RUNACTION = "Execute actions named of group name;\"_start\" after open, \"_end\" before close";
        CHECKBOX_NOTCLOSE = "Do not close the file";
        CHECKBOX_SetFont = "Set default font";
        CHECKBOX_SetLeading = "Set leading size";
        CHECKBOX_OutputHorizontalText = "Output horizontal text";
        CHECKBOX_LAYERNOTGROUP = "Layer not grouping";
        CHECKBOX_OVERLAY = "Execute \"Text Overlay\" on specified group";
        COMPLETE = "Export completed!";
        ERROR_NOTFOUNDSOURCE = "Image Source Folder Not Found!";
        ERROR_NOTFOUNDTARGET = "Output PSD Folder Not Found!";
        ERROR_NOTFOUNLABELTEXT = "LabelPlus Text File Not Found!";
        ERROR_CANNOTBUILDNEWFOLDER = "Could not build new folder";
        ERROR_READLABELTEXTFILEFAILL = "Fail To Load LabelPlus Text File";
        ERROR_NOTCHOOSEIMAGE = "Please select more than one image";
        ERROR_NOTCHOOSEGROUP = "Please select more than one group";
    }
}
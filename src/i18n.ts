namespace I18n {
    export var APP_NAME: string = "LabelPlus Script";
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
    export var LABEL_TIP_BEHAVIOR: string = "> 脚本行为";
    export var LABEL_TIP_STYLE_AUTO: string = "> 格式 / 自动化";

    export var PANEL_TEMPLETE_SETTING: string = "文档模板设置";
    export var RB_TEMPLETE_AUTO: string = "自动";
    export var RB_TEMPLETE_NO: string = "不使用模板（直接新建文件）";
    export var RB_TEMPLETE_CUSTOM: string = "自定义模板";

    export var LABEL_TEXT_FILE: string = "LabelPlus文本:";
    export var LABEL_SOURCE: string = "图源文件夹:";
    export var LABEL_TARGET: string = "输出PSD文件夹:";
    export var LABEL_SETTING: string = "存取配置";
    export var LABEL_SELECT_IMG: string = "导入图片选择";
    export var LABEL_SELECT_GROUP: string = "导入分组选择";
    export var LABEL_SELECT_TIP: string = "提示：列表框中，按住Ctrl键选中/取消单个项目，按住Shift键批量选择项目。";


    export var CHECKBOX_OUTPUT_LABEL_INDEX: string = "导出标号";
    export var CHECKBOX_TEXT_REPLACE: string = "文本替换(格式:\"A->B|C->D\")";
    export var CHECKBOX_IGNORE_NO_LABEL_IMG: string = "不输出未标号图片";
    export var CHECKBOX_MATCH_IMG_BY_ORDER: string = "按顺序匹配图片文件";
    export var BUTTON_MATCH_IMG_BY_ORDER_PREVIEW: string = "预览匹配结果";
    export var CHECKBOX_REPLACE_IMG_SUFFIX: string = "替换图片后缀名";
    export var CHECKBOX_RUN_ACTION: string = "导入文本后，执行以分组名命名的动作；打开图片时执行_start，关闭前执行_end动作";
    export var CHECKBOX_NOT_CLOSE: string = "导入后不关闭文档";
    export var CHECKBOX_SET_FONT: string = "字体";
    export var CHECKBOX_SET_LEADING: string = "行距";
    export var LABEL_TEXT_DIRECTION: string = "文字方向：";
    export var LIST_TEXT_DIT_ITEMS: string[] = [ "默认", "横向", "纵向" ];
    export var CHECKBOX_NO_LAYER_GROUP: string = "不对图层进行分组";
    export var CHECKBOX_DIALOG_OVERLAY: string = "对指定分组执行涂白动作(实验性功能)";

    export var COMPLETE: string = "导出完毕！";

    export var ERROR_NOT_FOUND_SOURCE: string = "未找到图源文件夹";
    export var ERROR_NOT_FOUND_TARGET: string = "未找到目标文件夹";
    export var ERROR_NOT_FOUND_LPTEXT: string = "未找到LabelPlus文本文件";
    export var ERROR_CREATE_NEW_FOLDER: string = "无法创建新文件夹";
    export var ERROR_PARSER_LPTEXT_FAIL: string = "解析LabelPlus文本失败";
    export var ERROR_NO_IMG_CHOOSED: string = "未选择输出图片";
    export var ERROR_NO_LABEL_GROUP_CHOOSED: string = "未选择导入分组";
    export var ERROR_PRESET_TEMPLETE_NOT_FOUND: string = "无法自动匹配模板文件，请确认脚本所在目录是否存在ps_script_res目录";
    export var ERROR_TEXT_REPLACE_EXPRESSION: string = "文本替换表达式解析错误，请检查！";

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
        LABEL_TIP_BEHAVIOR = "> Behavior";
        LABEL_TIP_STYLE_AUTO = "> Format / Automation";
        PANEL_TEMPLETE_SETTING = "Document Templete Setting";
        RB_TEMPLETE_AUTO = "Auto";
        RB_TEMPLETE_NO = "No Templete";
        RB_TEMPLETE_CUSTOM = "Custom Templete";
        LABEL_TEXT_FILE = "LabelPlus Text:";
        LABEL_SOURCE = "Image Source:";
        LABEL_TARGET = "Output PSD:";
        LABEL_SETTING = "Setting";
        LABEL_SELECT_IMG = "Select Image";
        LABEL_SELECT_GROUP = "Select Group";
        LABEL_SELECT_TIP = "Tip: In ListBox, push Ctrl key to select/cancel one item, push Shift key to select multiple items.";
        CHECKBOX_OUTPUT_LABEL_INDEX = "Output Label Number";
        CHECKBOX_TEXT_REPLACE = "Text Replace(e.g. \"A->B|C->D\")";
        CHECKBOX_IGNORE_NO_LABEL_IMG = "Ignore Images With No Label";
        CHECKBOX_MATCH_IMG_BY_ORDER = "Match Image Source By Order";
        BUTTON_MATCH_IMG_BY_ORDER_PREVIEW = "Preview Match Result";
        CHECKBOX_REPLACE_IMG_SUFFIX = "Replace Image Suffix";
        CHECKBOX_RUN_ACTION = "Execute Actions Named Of Group Name(\"_start\" after open, \"_end\" before close)";
        CHECKBOX_NOT_CLOSE = "Do Not Close File";
        CHECKBOX_SET_FONT = "Set Default Font";
        CHECKBOX_SET_LEADING = "Set Leading Size";
        LABEL_TEXT_DIRECTION = "Text Direction:";
        LIST_TEXT_DIT_ITEMS = [ "Default", "Horizontal", "Vertical" ];
        CHECKBOX_NO_LAYER_GROUP = "Layer Not Grouping";
        CHECKBOX_DIALOG_OVERLAY = "Execute \"Text Overlay\" On Specified Group";
        COMPLETE = "Export completed!";
        ERROR_NOT_FOUND_SOURCE = "Image Source Folder Not Found!";
        ERROR_NOT_FOUND_TARGET = "Output PSD Folder Not Found!";
        ERROR_NOT_FOUND_LPTEXT = "LabelPlus Text File Not Found!";
        ERROR_CREATE_NEW_FOLDER = "Could not build new folder";
        ERROR_PARSER_LPTEXT_FAIL = "Fail To Load LabelPlus Text File";
        ERROR_NO_IMG_CHOOSED = "Please select more than one image";
        ERROR_NO_LABEL_GROUP_CHOOSED = "Please select more than one group";
        ERROR_PRESET_TEMPLETE_NOT_FOUND = "Cannot match templete file, please make sure \"ps_script_res\" folder exsit.";
        ERROR_TEXT_REPLACE_EXPRESSION = "Expression of text replacing is wrong, please check again.";
    }
}

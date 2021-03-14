namespace I18n {
    export var APP_NAME: string = "LabelPlus Script";

    export var BUTTON_RUN: string = "导入";
    export var BUTTON_CANCEL: string = "关闭";
    export var BUTTON_LOAD: string = "加载配置";
    export var BUTTON_SAVE: string = "保存配置";
    export var BUTTON_RESET: string = "还原配置";

    export var PANEL_INPUT: string = "输入";
    export var PANEL_OUTPUT: string = "输出";
    export var PANEL_STYLE: string = "格式";
    export var PANEL_AUTOMATION: string = "自动化";

    export var PANEL_TEMPLATE_SETTING: string = "文档模板设置";
    export var RB_TEMPLATE_AUTO: string = "自动";
    export var RB_TEMPLATE_NO: string = "不使用模板（直接新建文件）";
    export var RB_TEMPLATE_CUSTOM: string = "自定义模板";

    export var LABEL_TEXT_FILE: string = "LabelPlus文本:";
    export var LABEL_SOURCE: string = "图源文件夹:";
    export var LABEL_TARGET: string = "输出文件夹:";
    export var LABEL_SETTING: string = "存取配置";
    export var LABEL_SELECT_IMG: string = "导入图片选择";
    export var LABEL_SELECT_GROUP: string = "导入分组选择";
    export var LABEL_SELECT_TIP: string = "提示：列表框中，按住Ctrl键选中/取消单个项目，按住Shift键批量选择项目。";


    export var CHECKBOX_OUTPUT_LABEL_INDEX: string = "导出标号";
    export var CHECKBOX_TEXT_REPLACE: string = "文本替换(格式:\"A->B|C->D\")";
    export var CHECKBOX_IGNORE_NO_LABEL_IMG: string = "不输出未标号图片";
    export var CHECKBOX_MATCH_IMG_BY_ORDER: string = "按顺序匹配图片文件";
    export var BUTTON_MATCH_IMG_BY_ORDER_PREVIEW: string = "预览匹配结果";
    export var LABEL_OUTPUT_FILE_TYPE: string = "输出文件类型：";
    export var CHECKBOX_REPLACE_IMG_SUFFIX: string = "替换图片后缀名";
    export var CHECKBOX_RUN_ACTION: string = "执行自动化动作";
    export var CHECKBOX_NOT_CLOSE: string = "导入后不关闭文档";
    export var CHECKBOX_SET_FONT: string = "字体";
    export var CHECKBOX_SET_LEADING: string = "行距";
    export var LABEL_TEXT_DIRECTION: string = "文字方向：";
    export var LIST_TEXT_DIT_ITEMS: string[] = [ "默认", "横向", "纵向" ];
    export var CHECKBOX_NO_LAYER_GROUP: string = "不对图层进行分组";
    export var CHECKBOX_DIALOG_OVERLAY: string = "对指定分组涂白(多个分组以半角逗号隔开)：";

    export var COMPLETE: string = "导出完毕！";
    export var COMPLETE_WITH_ERROR: string = "导出完毕，但遇到些错误...";
    export var COMPLETE_FAILED: string = "导出失败！";

    export var ERROR_UNEXPECTED: string = "未预料到的错误，请与作者联系！";
    export var ERROR_FILE_OPEN_FAIL: string = "文件打开失败，请检查PS是否能正确打开该文件！";
    export var ERROR_FILE_SAVE_FAIL: string = "文件保存失败，请检查是否有磁盘操作权限、磁盘空间是否充足。";
    export var ERROR_NOT_FOUND_SOURCE: string = "未找到图源文件夹";
    export var ERROR_NOT_FOUND_TARGET: string = "未找到目标文件夹";
    export var ERROR_NOT_FOUND_LPTEXT: string = "未找到LabelPlus文本文件";
    export var ERROR_NOT_FOUND_TEMPLATE: string = "未找到Photoshop模板文件";
    export var ERROR_CREATE_NEW_FOLDER: string = "无法创建新文件夹";
    export var ERROR_PARSER_LPTEXT_FAIL: string = "解析LabelPlus文本失败";
    export var ERROR_NO_IMG_CHOOSED: string = "未选择输出图片";
    export var ERROR_NO_LABEL_GROUP_CHOOSED: string = "未选择导入分组";
    export var ERROR_PRESET_TEMPLATE_NOT_FOUND: string = "无法自动匹配模板文件，请确认脚本所在目录是否存在ps_script_res目录";
    export var ERROR_TEXT_REPLACE_EXPRESSION: string = "文本替换表达式解析错误，请检查！";

    declare var app: any;
    // if (true) {
    if (!(app.locale in {"zh_CN":1, "zh_TW":1, "zh_HK":1})) {
        BUTTON_RUN = "Run";
        BUTTON_CANCEL = "Cancel";
        BUTTON_LOAD = "Load";
        BUTTON_SAVE = "Save";
        BUTTON_RESET = "Reset";
        PANEL_INPUT = "Input";
        PANEL_OUTPUT = "Output";
        PANEL_STYLE = "Style";
        PANEL_AUTOMATION = "Automation";
        PANEL_TEMPLATE_SETTING = "Document Template Setting";
        RB_TEMPLATE_AUTO = "Auto";
        RB_TEMPLATE_NO = "No Template";
        RB_TEMPLATE_CUSTOM = "Custom Template";
        LABEL_TEXT_FILE = "LabelPlus Text:";
        LABEL_SOURCE = "Image Source:";
        LABEL_TARGET = "Output Folder:";
        LABEL_SETTING = "Setting";
        LABEL_SELECT_IMG = "Select Image";
        LABEL_SELECT_GROUP = "Select Group";
        LABEL_SELECT_TIP = "Tip: Push [Ctrl] key to select/cancel one item, push [Shift] key to select multiple items.";
        CHECKBOX_OUTPUT_LABEL_INDEX = "Output Label Number";
        CHECKBOX_TEXT_REPLACE = "Text Replace(e.g. \"A->B|C->D\")";
        CHECKBOX_IGNORE_NO_LABEL_IMG = "Ignore Images With No Label";
        CHECKBOX_MATCH_IMG_BY_ORDER = "Match Image Source By Order";
        BUTTON_MATCH_IMG_BY_ORDER_PREVIEW = "Preview Match Result";
        LABEL_OUTPUT_FILE_TYPE = "Output File Type:";
        CHECKBOX_REPLACE_IMG_SUFFIX = "Replace Image Suffix";
        CHECKBOX_RUN_ACTION = "Execute Automation Actions";
        CHECKBOX_NOT_CLOSE = "Do Not Close File";
        CHECKBOX_SET_FONT = "Font";
        CHECKBOX_SET_LEADING = "Leading";
        LABEL_TEXT_DIRECTION = "Text Direction:";
        LIST_TEXT_DIT_ITEMS = [ "Default", "Horizontal", "Vertical" ];
        CHECKBOX_NO_LAYER_GROUP = "Layer Not Grouping";
        CHECKBOX_DIALOG_OVERLAY = "Execute \"Dialog Overlay\" On Specified Groups (split groups with comma):";
        COMPLETE = "Export completed!";
        COMPLETE_WITH_ERROR = "Export Completed, but some error occured..."
        COMPLETE_FAILED = "Exported failed..."
        ERROR_UNEXPECTED = "Unexpected error, please contact with maintenance...";
        ERROR_FILE_OPEN_FAIL = "open file failed, please confirm whether Photoshop can open the file.";
        ERROR_FILE_SAVE_FAIL = "File saving failed, please check whether you have disk operation permission and whether the disk space is sufficient.";
        ERROR_NOT_FOUND_SOURCE = "Image Source Folder Not Found!";
        ERROR_NOT_FOUND_TARGET = "Output PSD Folder Not Found!";
        ERROR_NOT_FOUND_LPTEXT = "LabelPlus Text File Not Found!";
        ERROR_NOT_FOUND_TEMPLATE = "Photoshop template file not found!";
        ERROR_CREATE_NEW_FOLDER = "Could not build new folder";
        ERROR_PARSER_LPTEXT_FAIL = "Fail To Load LabelPlus Text File";
        ERROR_NO_IMG_CHOOSED = "Please select more than one image";
        ERROR_NO_LABEL_GROUP_CHOOSED = "Please select more than one group";
        ERROR_PRESET_TEMPLATE_NOT_FOUND = "Cannot match template file, please make sure \"ps_script_res\" folder exsit.";
        ERROR_TEXT_REPLACE_EXPRESSION = "Expression of text replacing is wrong, please check again.";
    }
}

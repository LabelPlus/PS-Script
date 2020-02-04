/// <reference path="legacy.d.ts" />

namespace LabelPlus {

export enum OptionTextDirection { Keep, Horizontal, Vertical };
export enum OptionDocTemplete { Auto, No, Custom }; // 自动选择模板、不使用模板、自定义模板文件

export class CustomOptions {
    constructor(obj: Object) {
        let self = this;
        Stdlib.copyFromTo(obj, self);
    }

    source: string = ""; // 图源文件夹
    target: string = ""; // 输出文件夹
    labelFilename: string = ""; // 翻译文本的文件名
    labelFilePath: string = ""; // 翻译文本所在文件夹
    imageSelected: { file: string, index: number }[] = []; // 被选中的图片列表
    groupSelected: string[] = []; // 被选中的分组列表

    // ------------------------------------可保存设置，均为string
    docTemplete: OptionDocTemplete = OptionDocTemplete.Auto; // 模板设置
    docTempleteCustomPath: string = "";  // 自定义模板文件路径

    matchImgByOrder: boolean = false; // match image by order, ignore file name in lpText, for replacing image source
    replaceImgSuffix: string = ""; // replacing image suffix,  for replacing image source
    outputNoSignPsd: boolean = true; // 是否输出未标号的图片
    layerNotGroup: boolean = false; // 图层不分组
    notClose: boolean = false; // 导入图片后不关闭文档

    font: string = ""; // 设置的字体，为空时不设置
    fontSize: number = 0; // 字体大小，为0时不设置
    textLeading: number = 0; // 行距值，百分比，为0时不设置
    textReplace: string = ""; // 文本替换规则，为空时不替换
    outputLabelNumber: boolean = false; // 是否输出标号
    textDirection: OptionTextDirection = OptionTextDirection.Keep; // 输出文本的阅读方向

    runActionGroup: string = ""; // 导入文本图层后执行的动作组的名字
    overloayGroup: string = ""; // 执行简易涂白的分组
};

} // namespace LabelPlus

/// <reference path="legacy.d.ts" />

namespace LabelPlus {

export enum OptionTextDirection { Keep, Horizontal, Vertical };
export enum OptionDocTemplate { Auto, No, Custom }; // auto choose preset template/no use template/custom template
export enum OptionOutputType { PSD, TIFF, PNG, JPG, _count };

export class CustomOptions {

    // ------------------------------------ not saved options
    source: string = ""; // images source folder
    target: string = ""; // images target folder
    lpTextFilePath: string = ""; // path of labelplus text file
    imageSelected: { file: string, index: number }[] = []; // selected images
    groupSelected: string[] = [];  // selected label group

    // ------------------------------------ saved options
    docTemplate: OptionDocTemplate = OptionDocTemplate.Auto; // image document template option
    docTemplateCustomPath: string = "";  // custom image document template path

    matchImgByOrder: boolean = false; // match image by order, ignore file name in lpText, for replacing image source
    replaceImgSuffix: string = ""; // replacing image suffix,  for replacing image source
    outputType: OptionOutputType = OptionOutputType.PSD; // output image file type
    ignoreNoLabelImg: boolean = false; // ignore images with no label
    noLayerGroup: boolean = false; // do not create group in document for text layers
    notClose: boolean = false; // do not close image document

    font: string = ""; // set font if it is not empty
    fontSize: number = 0; // set font size if neq 0
    textLeading: number = 0; // set auto leading value if neq 0, unit is percent
    textReplace: string = ""; // run text replacing function, if the expression is not empty
    outputLabelIndex: boolean = false; // if true, output label index as text layer
    textDirection: OptionTextDirection = OptionTextDirection.Keep; // text direction option

    actionGroup: string = ""; // action group name
    dialogOverlayLabelGroups: string = ""; // the label groups need dialog overlay layer, split by ","
};

} // namespace LabelPlus

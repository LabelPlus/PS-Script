//@include "./xtools/xlib/stdlib.js";
/// <reference path="legacy.d.ts" />

namespace LabelPlus {

export function assert(condition: any, msg?: string): asserts condition {
    if (!condition) {
        throw "error: assert " + condition;
    }
}

// Operating System related
export let dirSeparator = $.os.search(/windows/i) === -1 ? '/' : '\\';

export const TEMPLATE_LAYER = {
    TEXT:  "text",
    IMAGE: "bg",
    DIALOG_OVERLAY: "dialog-overlay",
};

export function GetScriptPath(): string {
    return <string>$.fileName;
}

export function GetScriptFolder(): string {
    return (new Folder(GetScriptPath())).path;
}

export function FileIsExists(path: string): boolean {
    return (new File(path)).exists;
}

export function Emit(func: Function): void {
    if (func !== undefined)
        func();
}

// 获取制定路径文件列表
export function getFilesListOfPath(path: string): string[] {
    let folder = new Folder(path);
    if (!folder.exists) {
        return new Array<string>();
    }

    let fileList = folder.getFiles();
    let fileNameList = new Array();

    for (let i = 0; i < fileList.length; i++) {
        let file = fileList[i];
        if (file instanceof File) {
            let short_name = file.toString().split("/");
            fileNameList.push(short_name[short_name.length - 1]);
        }
    }

    return fileNameList.sort();
}

export function getFileSuffix(filename: string) {
	return filename.substring(filename.lastIndexOf("."), filename.length)
}

export function doAction(action: string, actionSet: string): boolean
{
    if (Stdlib.hasAction(action, actionSet) === true) {
        app.doAction(action, actionSet);
        return true;
    }
    else {
        return false;
    }
}

export function min(a: number, b: number): number {
    return (a < b) ? a : b;
}

let dataPath = Folder.appData.fsName + dirSeparator + "labelplus_script";
let dataFolder = new Folder(dataPath);
if (!dataFolder.exists) {
    if (!dataFolder.create()) {
        dataPath = Folder.temp.fsName;
    }
}
export const APP_DATA_FOLDER: string = dataPath;
export const DEFAULT_LOG_PATH: string = APP_DATA_FOLDER + dirSeparator + "lp_ps_script.log";
export const DEFAULT_INI_PATH: string = APP_DATA_FOLDER + dirSeparator + "lp_ps_script.ini";
export const DEFAULT_DUMP_PATH: string = APP_DATA_FOLDER + dirSeparator + "lp_ps_script.dump";

Stdlib.log.setFile(DEFAULT_LOG_PATH);
export function log(msg: any) { Stdlib.log(msg); }
export function showdump(o: any) { alert(Stdlib.listProps(o)); }
export function toUiString(s: string): string { return decodeURI(s) };

} // namespace LabelPlus

/// <reference path="legacy.d.ts" />

namespace LabelPlus {

export function assert(condition: any, msg?: string): asserts condition {
    if (!condition) {
        throw "error: assert " + condition;
    }
}

// Operating System related
export let dirSeparator = $.os.search(/windows/i) === -1 ? '/' : '\\';

export const TEMPLETE_LAYER = {
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

export const DEFAULT_LOG_PATH: string = GetScriptFolder() + dirSeparator + "lp_ps_script.log";

} // namespace LabelPlus

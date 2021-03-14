//@include "./xtools/xlib/stdlib.js";
/// <reference path="legacy.d.ts" />

namespace LabelPlus {

export function assert(condition: any, msg?: string): asserts condition {
    if (!condition) {
        throw new Error("error: assert " + condition);
    }
}

// Operating System related
export let dirSeparator = $.os.search(/windows/i) === -1 ? '/' : '\\';

export const TEMPLATE_LAYER = {
    TEXT:  "text",
    IMAGE: "bg",
    DIALOG_OVERLAY: "dialog-overlay",
};

export const image_suffix_list = [".psd", ".png", ".jpg", ".jpeg", ".tif", ".tiff"];

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

export function StringEndsWith(str: string, suffix: string) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

export function getImageFilesListOfPath(path: string): string[] {
    let folder = new Folder(path);
    if (!folder.exists) {
        return new Array<string>();
    }

    let fileList = folder.getFiles();
    let fileNameList = new Array();

    for (let i = 0; i < fileList.length; i++) {
        let file = fileList[i];
        if (file instanceof File) {
            let tmp = file.toString().split("/");
            let short_name = tmp[tmp.length - 1];
            for (let i = 0; i < image_suffix_list.length; i++) {
                if (StringEndsWith(short_name.toLowerCase(), image_suffix_list[i])) {
                    fileNameList.push(short_name);
                    break;
                }
            }
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

export function delArrayElement<T>(arr: Array<T>, element: T) {
    let idx = arr.indexOf(element);
    if (idx >= 0) {
        arr.splice(idx, 1);
    }
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
export let alllog: string = "";
export let errlog: string = "";

Stdlib.log.setFile(DEFAULT_LOG_PATH);
export function log(msg: any) { Stdlib.log(msg); alllog += msg + '\n'; }
export function log_err(msg: any) { Stdlib.log(msg); errlog += msg + '\n'; alllog += msg + '\n'; }
export function showdump(o: any) { alert(Stdlib.listProps(o)); }

} // namespace LabelPlus

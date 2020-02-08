declare var Stdlib: any;
declare function isMac(): any;
declare function toBoolean(n: any): boolean;
declare var GenericUI: any;
declare var MyAction: any;

declare class jamJSON {
	static parse(text: string, validate?: boolean, allowComments?: boolean): any;
	static stringify(value: any, space?: string | number, prefix?: string | number): string;
}

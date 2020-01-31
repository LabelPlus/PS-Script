//
// res.ts
//
// LabelPlus PS-Script
// Home Page: http://noodlefighter.com/label_plus
// Author: Noodlefighter
// Released under GPL-2.0 License.
//
//note: 这里很奇怪，用import会导致找不到res命名空间，用require编译不过，只好用//@include，而且还得紧贴文件最前面的注释
//@include "base64-js/index.js"
//@include "static_res.js"

declare function toByteArray(data: string): Uint8Array; // 实际上返回uint8 arrary
declare function byteLength (data: string): number;

declare var static_res: string[];

namespace res {
	export function to_file(res_key: string, path: string): boolean {
		let res_data = toByteArray(static_res[res_key]);

		///@ts-ignore
		Stdlib.log(res_data)

		if (!res_data)
			return false;

		let f = new File(path);
		f.open("w");
		f.encoding = "BINARY";

		///@ts-ignore
		f.write(res_data);
		f.close();
		return true;
	}
};

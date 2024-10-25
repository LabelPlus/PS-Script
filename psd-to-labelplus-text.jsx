#target photoshop



/*
    用于将PSD档中的文本图层导出为LabelPlus脚本

    用法：
    1. 在Photoshop中打开要导出的若干个psd档
    2. 修改本脚本中的IMG_SUFFIX常量，为图片原本的后缀名
    3. 将脚本拖到Photoshop中执行
*/

// 输出的图片后缀名
const IMG_SUFFIX = ".png";

// 全局变量，计数Label序号
var label_count = 0;
// 全局变量，当前处理的文档的尺寸
var g_docWidth = 0;
var g_docHeight = 0;

function main() {

    if (!documents.length) return;

    var f = File.saveDialog("保存为文本文件", "文本文件:*.txt");

    if (f) {
        f.open("a");

        // LabelPlus文本格式头部
        f.write("1,0\n-\n框内\n框外\n-\n备注备注备注\n");

        // 遍历所有打开的文档
        for (var i = 0; i < app.documents.length; i++) {
            var doc = app.documents[i];

            // 将文档设置激活才能正常访问到图层
            app.activeDocument = doc;

            g_docWidth = doc.width;
            g_docHeight = doc.height;

            // LabelPlus 图片文件名
            var fileName = doc.name.replace(/\.[^\.]+$/, IMG_SUFFIX);
            f.write("\n>>>>>>>>[" + fileName + "]<<<<<<<<" + "\n");
            
            label_count = 0;
            f.write(scanLayerSets(doc));
        }
        
        f.close();

        alert("所有图层上的文本已保存到文件：" + f.fullName);

    }

}

function scanLayerSets(el) {

    var mystr = "";

    //导出图层组
    for(var a=0; a<el.layerSets.length;a++){

        var ly=el.layerSets[a].typename;
        if (ly == "LayerSet") {

            mystr += scanLayerSets(el.layerSets[a]);

        }

    }

    //文本图层导出
    for(var j=0;j<el.artLayers.length;j++){

        var lk = el.artLayers[j].kind;

        if (lk == "LayerKind.TEXT") {
            var item = el.artLayers[j].textItem;
            var xPos = item.position[0] / g_docWidth;
            var yPos = item.position[1] / g_docHeight;            
            
            label_count += 1;
            mystr += "----------------[" + label_count + "]----------------[" + xPos.toFixed(3) + "," + yPos.toFixed(3) + ",1]\n";
            mystr += item.contents + "\n\n";
        }

    }
    //alert(mystr)
    return mystr;
}

main();
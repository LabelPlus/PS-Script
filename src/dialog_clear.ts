/// <reference path="legacy.d.ts" />

namespace LabelPlus {

// 对话框涂白动作
//      labels: 标签坐标
//      imgWidth, imgHeight: 图像宽/高
//      tolerance: 魔棒容差
//      contract: 收缩保护像素
//      layer: 涂白图层
export function dialogClear(labels: Array<{ x: number, y: number }>,
                            imgWidth: UnitValue, imgHeight: UnitValue,
                            tolerance: Number, contract: number, layer: ArtLayer): boolean {
    if (labels.length == 0) {
        return false;
    }
    let width = imgWidth.as("px");
    let height = imgHeight.as("px");

    MyAction.selectNone();

    for (let i = 0; i < labels.length; i++) {
        let x = labels[i].x * width;
        let y = labels[i].y * height;
        MyAction.magicWand(x, y, tolerance, true, true, 'addTo');
    }

    // 在新建的辅助图层中填充出空白区域
    MyAction.newLyr();
    MyAction.fill('Blck', 100);

    // 四个角使用魔棒 再反选 保护性收缩
    MyAction.selectNone();
    MyAction.magicWand(0, 0, tolerance, false, true, 'addTo');
    MyAction.magicWand(width - 1, 0, tolerance, false, true, 'addTo');
    MyAction.magicWand(0, height - 1, tolerance, false, true, 'addTo');
    MyAction.magicWand(width - 1, height - 1, tolerance, false, true, 'addTo');
    MyAction.selectInverse();
    MyAction.selectContract(contract);

    // 删除辅助图层 建立涂白图层 并填充背景色
    MyAction.delLyr();
    if (layer) {
        app.activeDocument.activeLayer = layer;
    } else {
        MyAction.newLyr();
    }
    MyAction.fill('BckC', 100);

    MyAction.selectNone();
    return true;
}
}

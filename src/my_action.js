//
//   LabelPlus_Ps_Script.jsx
//   This is a Input Text Tool for LabelPlus Text File.
//
// Copyright 2015, Noodlefighter
// Released under GPL License.
//
// License: http://noodlefighter.com/label_plus/license
//
//@show include
//@include "my_include.js"

//
// 动作库
//
MyAction = function() { }

// 取消选择
MyAction.selectNone = function() {
    var desc1 = new ActionDescriptor();
    var ref1 = new ActionReference();
    try{
      ref1.putProperty(cTID('Chnl'), sTID("selection"));
      desc1.putReference(cTID('null'), ref1);
      desc1.putEnumerated(cTID('T   '), cTID('Ordn'), cTID('None'));
      executeAction(sTID('set'), desc1, DialogModes.NO);
    }
    catch(e){}
};

// 反向选择
MyAction.selectInverse = function() {
    try{
    executeAction(cTID('Invs'), undefined, DialogModes.NO);
    }
    catch(e){}
};

// 选区收缩(像素)
MyAction.selectContract = function(pxl) {
    var desc1 = new ActionDescriptor();
    try{
      desc1.putUnitDouble(cTID('By  '), cTID('#Pxl'), pxl);
      executeAction(cTID('Cntc'), desc1, DialogModes.NO);
    }
    catch(e){}
};

// 选区扩展(像素)
MyAction.selectExpand = function(pxl) {
    var desc1 = new ActionDescriptor();
    try{
      desc1.putUnitDouble(cTID('By  '), cTID('#Pxl'), pxl);
      executeAction(cTID('Expn'), desc1, DialogModes.NO);
    }
    catch(e){}
};

// 魔棒(x, y, 容差, 采样所有图层, 抗锯齿, 新选区域方式字符串)
// 新选区域方式字符串 可以为:
// 'setd' 新建区域
// 'addTo'    添加
// 'subtractFrom' 移出
// 'interfaceWhite'  交集
MyAction.magicWand = function(x, y, tolerance, merged, antiAlias, newAreaModeStr) {
    try{
      if(x == undefined || y == undefined){
        x = 0;
        y = 0;
      }
      if(tolerance == undefined)
          tolerance = 32;
      if(merged == undefined)
          merged = false;
      if(antiAlias == undefined)
          antiAlias = true;
      if(newAreaModeStr == undefined || newAreaModeStr == '')
          newAreaModeStr = 'setd';

      var desc1 = new ActionDescriptor();
      var ref1 = new ActionReference();
      ref1.putProperty(cTID('Chnl'), sTID("selection"));
      desc1.putReference(cTID('null'), ref1);
      var desc2 = new ActionDescriptor();
      desc2.putUnitDouble(cTID('Hrzn'), cTID('#Pxl'), x);
      desc2.putUnitDouble(cTID('Vrtc'), cTID('#Pxl'), y);
      desc1.putObject(cTID('T   '), cTID('Pnt '), desc2);
      desc1.putInteger(cTID('Tlrn'), tolerance);
      desc1.putBoolean(cTID('Mrgd'), merged);
      desc1.putBoolean(cTID('AntA'), antiAlias);
      executeAction(sTID(newAreaModeStr), desc1, DialogModes.NO);
    }
    catch(e){}

};

// 新建图层
MyAction.newLyr = function() {
    try{
        var desc1 = new ActionDescriptor();
        var ref1 = new ActionReference();
        ref1.putClass(cTID('Lyr '));
        desc1.putReference(cTID('null'), ref1);
        executeAction(cTID('Mk  '), desc1, DialogModes.NO);
    }
    catch(e){}
}
// 删除当前图层
MyAction.delLyr = function() {
    try{
        var desc1 = new ActionDescriptor();
        var ref1 = new ActionReference();
        ref1.putEnumerated(cTID('Lyr '), cTID('Ordn'), cTID('Trgt'));
        desc1.putReference(cTID('null'), ref1);
        executeAction(cTID('Dlt '), desc1, DialogModes.NO);
    }
    catch(e){}
}

// 填充(使用什么填充, 透明度)
// use可以是:
// 'FrgC' 前景色
// 'BckC' 背景色
// 'Blck' 黑色
// 'Gry ' 灰色
// 'Wht ' 白色
MyAction.fill = function(use, opct) {
    try{
        var desc1 = new ActionDescriptor();
        desc1.putEnumerated(cTID('Usng'), cTID('FlCn'), cTID(use));
        desc1.putUnitDouble(cTID('Opct'), cTID('#Prc'), opct);
        desc1.putEnumerated(cTID('Md  '), cTID('BlnM'), cTID('Nrml'));
        executeAction(cTID('Fl  '), desc1, DialogModes.NO);
    }
    catch(e){}
};

// 对话框涂白动作(标签数据, 图像宽度, 图像高度, 魔棒容差, 收缩保护像素)
MyAction.lp_dialogClear = function(labelArr, imgWidht, imgHeight, tolerance, contract) {

    // 参数检查
    if (labelArr.length == 0) {
      return;
    }

    MyAction.selectNone();

    // 单位转换
    imgWidht.convert("px");
    imgHeight.convert("px");

    // 选中所有框内的空白区域
    for(var i=0; i<labelArr.length; i++){
        var x = (labelArr[i].x) * imgWidht;
        var y = (labelArr[i].y) * imgHeight;

        MyAction.magicWand(x, y, tolerance, true, true, 'addTo');
    }

    // 在新建的辅助图层中填充出空白区域
    MyAction.newLyr();
    MyAction.fill('Blck', 100);

    // 四个角使用魔棒 再反选 保护性收缩
    MyAction.selectNone();
    MyAction.magicWand(0                , 0                  , tolerance, false, true, 'addTo');
    MyAction.magicWand(imgWidht-1 , 0                  , tolerance, false, true, 'addTo');
    MyAction.magicWand(0                , imgHeight-1  , tolerance, false, true, 'addTo');
    MyAction.magicWand(imgWidht-1 , imgHeight-1  , tolerance, false, true, 'addTo');
    MyAction.selectInverse();
    MyAction.selectContract(contract);

    // 删除辅助图层 建立涂白图层 并填充背景色
    MyAction.delLyr();
    MyAction.newLyr();
    MyAction.fill('BckC', 100);

    MyAction.selectNone();

};

// TEST
//MyAction.lp_dialogClear(0, 1715, 2500, 16, 1);

//MyAction.selectNone();
//MyAction.selectInverse();
//MyAction.selectContract(5);
//MyAction.selectExpand(5);
//MyAction.magicWand(); // x, y, tolerance, merged, antiAlias, newAreaModeStr
//MyAction.newLyr()
//MyAction.delLyr();
//MyAction.fill('Blck', 50);

"my_action.js";

//
//   LabelPlus_Ps_Script.jsx
//   This is a Input Text Tool for LabelPlus Text File.
//
// $Id: LabelPlus_Ps_Script.jsx,v 1.0 2015/09/19 13:07:00 Noodlefighter Exp $
//
//@show include
//
app;
//
//@includepath "/d/Green Program/Adobe Photoshop CS5 Extended 12.0.3.0/xtools"
//
//@include "xlib/stdlib.js"
//@include "xlib/GenericUI.jsx"
//

// Gobal Const
const _MY_APPNAME = "LabelPlus Input Text Tool";
const _MY_VER = "1.0";
const _MY_TIP_TITLE = "标题";
const _MY_TIP_TEXT = "内容";

const _MT_STRING_LABEL_TEXTFILE = "LabelPlus文本:";
const _MT_STRING_LABEL_SOURCE = "图源文件夹:";
const _MT_STRING_LABEL_TARGET = "输出PSD文件夹:";
const _MT_STRING_CHECKBOX_OUTPUTLABELNUMBER = "导出标号";
const _MT_STRING_CHECKBOX_OUTPUTNOSIGNPSD = "处理无标号文档";
const _MT_STRING_CHECKBOX_SETSOURCETYPE = "指定图源后缀名";
const _MT_STRING_CHECKBOX_RUNACTION = "根据分组执行动作GroupN";
const _MT_STRING_CHECKBOX_NOTCLOSE = "导入后不关闭文档";

const _MT_STRING_LABEL_SELECTIMAGE = "选择需要导入的图片";

const _MT_ERROR_NOTFOUNDSOURCE = "未找到图源文件夹";
const _MT_ERROR_NOTFOUNDTARGET = "未找到目标文件夹";
const _MT_ERROR_NOTFOUNLABELTEXT = "未找到LabelPlus文本文件";
const _MT_ERROR_CANNOTBUILDNEWFOLDER = "无法创建新文件夹";
const _MT_ERROR_READLABELTEXTFILEFAILL = "解析LabelPlus文本失败";
const _MT_ERROR_NOTCHOOSEIMAGE = "未选择输出图片";

//
// 初始设置
//
LabelPlusInputOptions = function(obj) {
  var self = this;
  
  self.source = '';// the source folder
  self.target = '';// the target/destination folder 
  
  Stdlib.copyFromTo(obj, self);
};
LabelPlusInputOptions.prototype.typename = "LabelPlusInputOptions";

LabelPlusInputOptions.INI_FILE = Stdlib.PREFERENCES_FOLDER + "/LabelPlusInput.ini";
LabelPlusInputOptions.LOG_FILE = Stdlib.PREFERENCES_FOLDER + "/LabelPlusInput.log";

//
// 用户UI
//
LabelPlusInput = function() {
  var self = this;
   
  self.iniFile = LabelPlusInputOptions.INI_FILE;
  self.saveIni = true;
  self.optionsClass = LabelPlusInputOptions;

  self.winRect = {          // the size of our window
    x: 200,
    y: 200,
    w: 675,
    h: 435
  };  
  
  self.title = _MY_APPNAME + " " + _MY_VER;// our window title
  self.notesSize = 75;
  self.notesTxt = _MY_TIP_TITLE;
  self.documentation = _MY_TIP_TEXT;
    
};

LabelPlusInput.prototype = new GenericUI();
LabelPlusInput.prototype.typename = "LabelPlusInput";

//
// createPanel回调函数
//
LabelPlusInput.prototype.createPanel = function(pnl, ini) {
  var self = this;
  
  var xOfs = 10;
  var yy = 10;

  var opts = new LabelPlusInputOptions(ini);// default values

  if (ini.uiX == undefined) {
    ini.uiX = ini.uiY = 100;
  }

  // window's location
  self.moveWindow(100, 100);
  
  //------------------路径选择区------------------
  var xx = xOfs;

  // LabelPlus文本文件输入
  pnl.lpTextFileLabel = pnl.add('statictext', [xx,yy,xx+120,yy+20],
                            _MT_STRING_LABEL_TEXTFILE);
  xx += 120;
  pnl.lpTextFileTextBox = pnl.add('edittext', [xx,yy,xx+300,yy+20], '');
  pnl.lpTextFileTextBox.enabled = false;
  xx += 305;
  pnl.lpTextFileBrowseButton = pnl.add('button', [xx,yy,xx+30,yy+20], '...');
  
  pnl.lpTextFileBrowseButton.onClick = function() {
    try {
      var pnl = this.parent;
      var fmask =  "LabelPlus Text: *.txt";
      var f = File.openDialog(_MT_STRING_LABEL_TEXTFILE, fmask);
       
      if (f && f.exists) {
        pnl.lpTextFileTextBox.text = f.toUIString();
        
        //图源、输出文件夹赋上相同目录
        var fl = new Folder(f.path);
        pnl.sourceTextBox.text = fl.toUIString();
        pnl.targetTextBox.text = fl.toUIString();
        
      }
      else{
        //取消
        return;        
      }
      
      // 确认      
      pnl.chooseImageListBox.removeAll();
      
      var labelFile;
      try{
        labelFile = new LabelPlusTextReader(pnl.lpTextFileTextBox.text);        
      }
      catch(err){        
        return;
      }
      var arr = labelFile.getImageList();
      if(!arr){
        pnl.parent.process.enabled = false;
        alert(_MT_ERROR_READLABELTEXTFILEFAILL );
        return;
      }

      for(var i=0; i<arr.length ;i++){
        pnl.chooseImageListBox[i] = pnl.chooseImageListBox.add('item', arr[i], i);      
        pnl.chooseImageListBox[i].selected = true;
      }      
      
      pnl.labelFile = labelFile;  //返回LabelPlusTextReader对象
      
    } catch (e) {
      alert(Stdlib.exceptionMessage(e));
    }
  };

  xx = xOfs;
  yy += 35;
    
  // 图源文件夹 
  pnl.sourceLabel = pnl.add('statictext', [xx,yy,xx+120,yy+20],
                            _MT_STRING_LABEL_SOURCE);
  xx += 120;
  pnl.sourceTextBox = pnl.add('edittext', [xx,yy,xx+300,yy+20],
                       opts.source || '');
  //pnl.sourceTextBox.enabled = false;  
  xx += 305;
  pnl.sourceBrowse = pnl.add('button', [xx,yy,xx+30,yy+20], '...');

  pnl.sourceBrowse.onClick = function() {
    try {
      var pnl = this.parent;
      var def = (pnl.sourceTextBox.text ?
                 new Folder(pnl.sourceTextBox.text) : Folder.desktop);
      var f = Folder.selectDialog(_MT_STRING_LABEL_SOURCE , def);

      if (f) {
        pnl.sourceTextBox.text = f.toUIString();
        if (!pnl.targetTextBox.text) {
          pnl.targetTextBox.text = pnl.sourceTextBox.text;
        }
        if (!pnl.lpTextFileTextBox.text) {
          pnl.lpTextFileTextBox.text = pnl.sourceTextBox.text;
        }        
      }
    } catch (e) {
      alert(Stdlib.exceptionMessage(e));
    }
  };

  xx = xOfs;
  yy += 35;

  // 输出目录
  pnl.targetLabel = pnl.add('statictext', [xx,yy,xx+120,yy+20],
                            _MT_STRING_LABEL_TARGET );
  xx += 120;
  pnl.targetTextBox = pnl.add('edittext', [xx,yy,xx+300,yy+20],
                       opts.target || '');
  
  xx += 305;
  pnl.targetBrowse = pnl.add('button', [xx,yy,xx+30,yy+20], '...');

  pnl.targetBrowse.onClick = function() {
    try {
      var pnl = this.parent;
      var f;
      var def = pnl.targetTextBox.text;
      if (!def) {
        if (pnl.sourceTextBox.text) {
          def = pnl.sourceTextBox.text;
        } else {
          def = Folder.desktop;
        }
      }
      var f = Stdlib.selectFolder(_MT_STRING_LABEL_TARGET , def);

      if (f) {
        pnl.targetTextBox.text = f.toUIString();
      }
    } catch (e) {
      alert(Stdlib.exceptionMessage(e));
    }
  };

  //------------------设置区------------------
  xOfs = 20;

  xx = xOfs;
  yy += 35;
  
  // 字体
  pnl.font = pnl.add('group', [xx,yy,xx+400,yy+40]);
  self.createFontPanel(pnl.font, ini);

  xx = xOfs;
  yy += 30;
  
  // 导出标号选项
  pnl.outputLabelNumberCheckBox = pnl.add('checkbox', [xx,yy,xx+250,yy+22],
                                           _MT_STRING_CHECKBOX_OUTPUTLABELNUMBER);
  xx = xOfs;
  yy += 25;
  
  // 处理无标号文档
  pnl.outputNoSignPsdCheckBox = pnl.add('checkbox', [xx,yy,xx+250,yy+22],
                                          _MT_STRING_CHECKBOX_OUTPUTNOSIGNPSD  );
  xx = xOfs;
  yy += 25;
  
  // 使用指定类型图源
  pnl.setSourceFileTypeCheckBox = pnl.add('checkbox', [xx,yy,xx+250,yy+22],
                                          _MT_STRING_CHECKBOX_SETSOURCETYPE  );
  pnl.setSourceFileTypeCheckBox.onClick = function() {
    pnl.setSourceFileTypeList.enabled = pnl.setSourceFileTypeCheckBox.value;
  }  
  xx += 260;
  var setSourceFileTypeListItems = [".psd", ".jpg", ".png"];
  pnl.setSourceFileTypeList = pnl.add('dropdownlist', [xx,yy,xx+70,yy+22],
                                   setSourceFileTypeListItems);  
  pnl.setSourceFileTypeList.selection = pnl.setSourceFileTypeList.find(".psd");
  pnl.setSourceFileTypeList.enabled = false;
  
  xx = xOfs;
  yy += 25;  
  
  // 执行动作GroupN
  pnl.runActionGroupCheckBox = pnl.add('checkbox', [xx,yy,xx+250,yy+22],
                                           _MT_STRING_CHECKBOX_RUNACTION );
  pnl.runActionGroupCheckBox.onClick = function() {
    pnl.runActionGroupList.enabled = pnl.runActionGroupCheckBox.value;
  }                                             
  xx += 260;
  var ary = Stdlib.getActionSets();  
  pnl.runActionGroupList = pnl.add('dropdownlist', [xx,yy,xx+180,yy+22], ary);  
  pnl.runActionGroupList.selection = pnl.runActionGroupList.find("LabelPlusAction");
  if (pnl.runActionGroupList.selection == undefined)
  {
    pnl.runActionGroupList.selection = pnl.runActionGroupList[0];
  }
  pnl.runActionGroupList.enabled = false;
  
  xx = xOfs;
  yy += 25;
  
  // 导入后不关闭文档
  pnl.notCloseCheckBox = pnl.add('checkbox', [xx,yy,xx+250,yy+22],
                                           _MT_STRING_CHECKBOX_NOTCLOSE );
  xx = xOfs;
  yy += 25;

  //------------------导入文件选择区------------------
  yy = 10;
  xOfs = 10 + 475;  
  xx = xOfs;  

  // 选择需要导入的图片
  pnl.chooseImageLabel =  pnl.add('statictext', [xx,yy,xx+150,yy+22],
                                           _MT_STRING_LABEL_SELECTIMAGE );
  yy += 20;
  pnl.chooseImageListBox = pnl.add('listbox', [xx,yy,xx+150,yy+235], [] ,{multiselect:true});
  
  return pnl;
};

//
// code for validating our panel
//
LabelPlusInput.prototype.validatePanel = function(pnl, ini) {
  var self = this;
  var opts = new LabelPlusInputOptions(ini);

  // 图源文件夹
  if (pnl.sourceTextBox.text) {    
    f = new Folder(pnl.sourceTextBox.text);
  }
  if (!f || !f.exists) {
    return self.errorPrompt(_MT_ERROR_NOTFOUNDSOURCE);
  }
  opts.source = f.toUIString();
  
  // 输出目录
  if (pnl.targetTextBox.text) {
    f = new Folder(pnl.targetTextBox.text);
    if (!f.exists) {
      if (!f.create()) {
        return self.errorPrompt(_MT_ERROR_CANNOTBUILDNEWFOLDER);
      }
    }
  }
  if (!f || !f.exists) {
    return self.errorPrompt(_MT_ERROR_NOTFOUNDTARGET);
  }
  opts.target = f.toUIString();

  // LabelPlus文本
  f = new File(pnl.lpTextFileTextBox.text);
  if(!f || !f.exists) {
    return self.errorPrompt(_MT_ERROR_NOTFOUNLABELTEXT);
  }
  
  // Image选择  
  if(!pnl.chooseImageListBox.selection || pnl.chooseImageListBox.selection.length == 0)
    return self.errorPrompt(_MT_ERROR_NOTCHOOSEIMAGE);
  else
    opts.imageSelected = pnl.chooseImageListBox.selection;  
  
  
  // 字体  
  opts.font = pnl.font.getFont();
  
  // 导出标号选项
  opts.outputLabelNumber = pnl.outputLabelNumberCheckBox.value;
  
  // 处理无标号文档
  opts.outputNoSignPsd = pnl.outputNoSignPsdCheckBox.value;
  
  // 使用指定类型图源
  if (pnl.setSourceFileTypeCheckBox.value){    
    opts.sourceFileType = pnl.setSourceFileTypeList.selection;
  }
  else
    opts.sourceFileType = undefined;
  
  // 执行动作GroupN
  if (pnl.runActionGroupCheckBox.value)
    opts.runActionGroup = pnl.runActionGroupList.selection;
  else
    opts.runActionGroup = undefined;
  
  // 导入后不关闭文档
  opts.notClose = pnl.notCloseCheckBox.value;
  
  return opts;
};

LabelPlusInput.prototype.process = function(opts, doc) {
  var self = this;

  Stdlib.log.setFile(LabelPlusInputOptions.LOG_FILE);
  Stdlib.log("Start");
  Stdlib.log("Properties:");
  Stdlib.log(listProps(opts));

  
  //检查图片文件是否存在, 若存在, 将它转换成绝对路径
  var fullFilename = [];
  for(var i=0; i<opts.imageSelected.length ; i++) {
    var filename = opts.imageSelected[i];    
    
    if(opts.sourceFileType){
      //todo:根据sourceFileType替换文件后缀名              
    }
    
    var f = File(opts.source + "//" + filename);
    if(!f || filename){
      var msg = "Image " + filename + " Not Found.";
      Stdlib.log(msg);
      alert(msg);
      return;    
    }
    else{
      fullFilename[i] = f.toUIString();
    }
  }  
  
  //解析LabelPlus文本
  var lpFile = new LabelPlusTextReader(filename);
  
  //遍历所选图片 导入数据
  for(var i=0; i<opts.imageSelected.length; i++){
    var filename = opts.imageSelected[i];
    
    var artLayerRef;
    var textItemRef;
    
    //打开原文件
    var bgFile = File(filename);
    var bg = app.open(bgFile);
    
    //todo:遍历
    
  }
  
  Stdlib.log("Complete!");
};

LabelPlusTextReader = function(filename) {
  //测试段
//~   this.imageList = ["a", "b", "c"];
//~   this.getImageList = function() { return this.imageList; };  
//~   return this;
  //测试段
  
  var self = this;
  
  if(!filename){    
    throw "LabelPlusTextReader no filename";
  }
  
  var f = new File(filename);  
  if(!f || !f.exists){    
    throw "LabelPlusTextReader file not exists";
  } 
  
  // 成员函数
  self.getImageList = function() { return this.filenameList; };  
  
  // 成员变量
  self.filename = filename;    
  self.imageList; 
  
  // 打开
  f.open("r");  
  
  // 分行读取
  var state = 'start'; //'start','filehead','context'
  var notDealStr;
  var notDealLabelheadMsg;
  var labelData = new Array();
  var filenameList = new Array();
  var groupData;
  
  for(var i=0; !f.eof; i++) {
    var lineStr = f.readln();
    var lineMsg = LabelPlusTextReader.judgeLineType(lineStr);
    switch(state) {
      case 'start':
        switch (lineMsg.Type) {
          case 'filehead':          //start-filehead
           
            //处理start blocks
            var result = LabelPlusTextReader.readStartBlocks(notDealStr);
            if(!result)
                throw "readStartBlocks fail";
            groupData = result.Groups;
            
            //新建文件项
            data[lineMsg.Title] = new Array();
            filenameList.push(lineMsg.Title);
            break;
          case 'labelhead':     //start-labelhead 不存在
            throw "start-filehead";
            break;
          case 'unkown':       //start-unkown
            notDealStr += "\r" + lineStr;
            break;
        }
        break;
      case 'filehead':
        switch (lineMsg.Type) {
          case 'filehead':      //filehead-filehead 上一个文件无Label
            data[lineMsg.Title] = new Array();
            break;
          case 'labelhead':     //filehead-labelhead
            state = 'context';
            notDealLabelheadMsg = lineMsg;
            notDealStr = "";
            break;
          case 'unkown':        //filehead-unkown
            break;
        }      
        break;
      case 'context':
        switch (lineMsg.Type) {
          case 'filehead':      //context-filehead
            labelData[notDealLabelheadMsg.Title] = {
                LabelheadValue : notDealLabelheadMsg.Values,
                LabelString : notDealStr 
            };
        
            notDealStr = "";
            state = 'filehead';
            
            //新建文件项
            data[lineMsg.Title] = new Array();
            filenameList.push(lineMsg.Title);
            break;
          case 'labelhead':            //context-labelhead
            state = 'context';
            labelData[notDealLabelheadMsg.Title] = {
                LabelheadValue : notDealLabelheadMsg.Values,
                LabelString : notDealStr 
            };
        
            notDealLabelheadMsg = lineMsg;            
            notDealStr = "";
            break;
          case 'unkown':  
            notDealStr += "\r" + lineStr;
            break;
        }      
      break;       
    }    
  }
  
  return self;
};

//判断字符串行类型 'filehead','labelhead','unkown'
LabelPlusTextReader.judgeLineType = function(str) {
  var myType = 'unkown';
  var myTitle;
  var myValues;
  
  str = str.trim();
  var fileheadRegExp = />{6,}[.+]<{6,}/g;   //todo:正则匹配不成功
  var labelheadRegExp = /-{6,}[\d+]-{6,}[.+]/g;
  
  if(fileheadRegExp.test(str)) {
    myType = 'filehead';
    mytitle = str.substring(str.indexOf("[")+1, str.IndexOf("]")-1);       
  }   
  else if(labelheadRegExp.test(str)) {
    myType = 'labelhead';
    mytitle = str.substring(str.indexOf("[")+1, str.IndexOf("]")-1);
    valuesStr = str.substring(str.lastIndexOf("[")+1, str.lastIndexOf("]")-1)
    myValues = valuesStr.split(",");    
  }
  
  return {    
    Type : myType,
    Title : myTitle,
    Values : myValues,
  };
};

LabelPlusTextReader.readStartBlocks = function(str) {
var blocks = str.split ("-");
    if(blocks.length < 3)
        throw "Start blocks error!";
    
    //block1 文件头
    var filehead = blocks[0].split(",");
    if(filehead.length < 2)
        throw "filehead error!";
    var first_version = parseInt(filehead[0]);
    var last_version = parseInt(filehead[1]);
    
    //block2 分组信息
    var groups = blocks[1].split("\r");    
    for(var i=0; i<groups.length; i++)
        groups[i] = groups[i].trim();   
    
    //block末
    var comment = blocks[blocks.length - 1];
     
    return {
        FirstVer : first_version,
        LastVer : last_version,
        Groups : groups,
        Comment : comment,
    };
};

// 主程序
LabelPlusInput.main = function() {
  var ui = new LabelPlusInput();
  ui.exec();  
};

LabelPlusInput.main();

"LabelPlus_Ps_Script.jsx";
// EOF

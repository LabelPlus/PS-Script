//
//   LabelPlus_Ps_Script.jsx
//   This is a Input Text Tool for LabelPlus Text File.
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
const _MY_APPNAME = "LabelPlus Inputer For FileVer<=";
const _MY_VER = "1.0";
const _MY_TIP_TITLE = "说明";
const _MY_TIP_TEXT = "本脚本支持将LabelPlus格式的文本导入成ps图层。\r\n" +
  "利用\“存取配置\”功能，可以方便的根据不同需求（如区分图片分辨率），快速应用配置。\r\n" +
  "更多信息: http://noodlefighter.com/label_plus/";

const _MY_STRING_BUTTON_RUN = "导入";
const _MY_STRING_BUTTON_CANCEL = "关闭";
const _MY_STRING_BUTTON_LOAD = "加载配置";
const _MY_STRING_BUTTON_SAVE = "保存配置";
const _MY_STRING_BUTTON_RESET = "还原配置";

const _MT_STRING_LABEL_TEXTFILE = "LabelPlus文本:";
const _MT_STRING_LABEL_SOURCE = "图源文件夹:";
const _MT_STRING_LABEL_TARGET = "输出PSD文件夹:";
const _MT_STRING_LABEL_FONT = "字体:";
const _MT_STRING_LABEL_SETTING = "存取配置";
const _MT_STRING_LABEL_SELECTIMAGE = "导入图片选择";
const _MT_STRING_LABEL_SELECTGROUP = "导入分组选择";

const _MT_STRING_CHECKBOX_OUTPUTLABELNUMBER = "导出标号";
const _MT_STRING_CHECKBOX_TEXTREPLACE = "文本替换(例:\"A->B|C->D\")";
const _MT_STRING_CHECKBOX_OUTPUTNOSIGNPSD = "处理无标号文档";
const _MT_STRING_CHECKBOX_SETSOURCETYPE = "指定图源后缀名";
const _MT_STRING_CHECKBOX_RUNACTION = "导入文本后，执行以分组名命名的动作";
const _MT_STRING_CHECKBOX_NOTCLOSE = "导入后不关闭文档";
const _MT_STRING_CHECKBOX_SETFONT = "修改默认字体";
const _MT_STRING_CHECKBOX_OUTPUTHORIZONTALTEXT = "输出横排文字";
const _MT_STRING_CHECKBOX_LAYERNOTGROUP = "不对图层进行分组";

const _MY_STRING_COMPLETE = "导出完毕！";

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
  Stdlib.copyFromTo(obj, self);
};
LabelPlusInputOptions.prototype.typename = "LabelPlusInputOptions";
LabelPlusInputOptions.LOG_FILE = Stdlib.PREFERENCES_FOLDER + "/LabelPlusInput.log";

//
// 用户UI
//
LabelPlusInput = function() {
  var self = this;

  self.saveIni = false;
  self.hasBorder = true;
  self.optionsClass = LabelPlusInputOptions;
  self.settingsPanel = false; //有自己创建的设置面板
  
  self.winRect = {          // the size of our window
    x: 200,
    y: 200,
    w: 875,
    h: 600
  };  
  
  self.title = _MY_APPNAME + _MY_VER;// our window title
  self.notesSize = 75;
  self.notesTxt = _MY_TIP_TITLE;
  self.documentation = _MY_TIP_TEXT;
  
  self.processTxt = _MY_STRING_BUTTON_RUN;
  self.cancelTxt = _MY_STRING_BUTTON_CANCEL;
  
};

LabelPlusInput.prototype = new GenericUI();
LabelPlusInput.prototype.typename = "LabelPlusInput";

//
// 用户界面构建
//
LabelPlusInput.prototype.createPanel = function(pnl, ini) {
  var self = this;
  var opts = new LabelPlusInputOptions(ini);// default values

  // window's location
  self.moveWindow(100, 100);   
  
  var xOfs = 10;
  var yOfs = 10;
  var xx = xOfs;
  var yy = yOfs;  
  
  //------------------自己创建的配置面板------------------  
  
  pnl.settingsPnl = pnl.add('panel', 
    [xOfs,yy,pnl.size.width-xOfs,yy+60]);   
    
  LabelPlusInput.createSettingsPanel(pnl.settingsPnl, ini);     
  
  xx = xOfs;
  yy += 75;  
  yOfs = yy; 
  //------------------路径选择区------------------
  
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
        alert(err);
        return;
      }
      var arr = labelFile.ImageList;
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
  pnl.sourceTextBox = pnl.add('edittext', [xx,yy,xx+300,yy+20], '');
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
  pnl.targetTextBox = pnl.add('edittext', [xx,yy,xx+300,yy+20], '');  
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

  // 文本替换(例:"A->B|C->D")
  pnl.textReplaceCheckBox = pnl.add('checkbox', [xx,yy,xx+250,yy+22],
                                          _MT_STRING_CHECKBOX_TEXTREPLACE);
  pnl.textReplaceCheckBox.onClick = function() {
    pnl.textReplaceTextBox.enabled = pnl.textReplaceCheckBox.value;
  }    
  xx += 260;
  pnl.textReplaceTextBox = pnl.add('edittext', [xx,yy,xx+180,yy+20]);  
  pnl.textReplaceTextBox.text = "！？->!?|...->…";
  pnl.textReplaceTextBox.enabled = false;

  xx = xOfs;
  yy += 25;
  
  // 使用自定义字体设置
  pnl.setFontCheckBox = pnl.add('checkbox', [xx,yy,xx+250,yy+22],
                                           _MT_STRING_CHECKBOX_SETFONT);  
  pnl.setFontCheckBox.onClick = function() {
    var value = pnl.setFontCheckBox.value;
    pnl.font.family.enabled = value;
    pnl.font.style.enabled = value;
    pnl.font.fontSize.enabled = value;
  }   
 
  xx = xOfs;
  yy += 25;
  
  // 字体
  pnl.font = pnl.add('group', [xx,yy,xx+400,yy+40]);
  self.createFontPanel(pnl.font, ini);
  pnl.font.label.text = _MT_STRING_LABEL_FONT;  
  pnl.font.family.enabled = false;
  pnl.font.style.enabled = false;
  pnl.font.fontSize.enabled = false;
  pnl.font.family.selection = pnl.font.family.find("SimSun");
  
  xx = xOfs;
  yy += 30;
  
  // 不对图层进行分组
  pnl.layerNotGroupCheckBox = pnl.add('checkbox', [xx,yy,xx+250,yy+22],
                                           _MT_STRING_CHECKBOX_LAYERNOTGROUP);
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
    
  // 导出标号选项
  pnl.outputLabelNumberCheckBox = pnl.add('checkbox', [xx,yy,xx+250,yy+22],
                                           _MT_STRING_CHECKBOX_OUTPUTLABELNUMBER);
  xx = xOfs;
  yy += 25;
    
  // 输出横排文字
  pnl.outputHorizontalCheckBox = pnl.add('checkbox', [xx,yy,xx+250,yy+22],
                                           _MT_STRING_CHECKBOX_OUTPUTHORIZONTALTEXT);
  xx = xOfs;
  yy += 25;
    
  // 处理无标号文档
  pnl.outputNoSignPsdCheckBox = pnl.add('checkbox', [xx,yy,xx+250,yy+22],
                                          _MT_STRING_CHECKBOX_OUTPUTNOSIGNPSD  );
  xx = xOfs;
  yy += 25;
  
  
  // 导入后不关闭文档
  pnl.notCloseCheckBox = pnl.add('checkbox', [xx,yy,xx+250,yy+22],
                                           _MT_STRING_CHECKBOX_NOTCLOSE );
  xx = xOfs;
  yy += 35;

  //------------------导入文件选择区------------------
  yy = yOfs;
  xOfs +=  475;  
  xx = xOfs;  

  // 选择需要导入的图片
  pnl.chooseImageLabel =  pnl.add('statictext', [xx,yy,xx+150,yy+22],
                                           _MT_STRING_LABEL_SELECTIMAGE );
  yy += 20;
  pnl.chooseImageListBox = pnl.add('listbox', [xx,yy,xx+150,yy+285], [] ,{multiselect:true});

  //------------------导入分组选择区------------------
  yy = yOfs;
  xOfs += 170;  
  xx = xOfs;
  
  //选择需要导入的分组
  pnl.chooseGroupLabel =  pnl.add('statictext', [xx,yy,xx+150,yy+22],
                                           _MT_STRING_LABEL_SELECTGROUP );
  yy += 20;
  pnl.chooseGroupListBox =  pnl.add('listbox', [xx,yy,xx+150,yy+285], [] ,{multiselect:true});

  //------------------读取配置区------------------
  if (ini) {   // if there was an ini object
    //文本替换
    if(ini.textReplace){
      pnl.textReplaceCheckBox.value = true;
      pnl.textReplaceTextBox.enabled = true;
      pnl.textReplaceTextBox.text = opts.textReplace;
    }  
    
    // 字体  
    if (ini.setFont) {
      pnl.setFontCheckBox.value = true;
      pnl.font.family.enabled =  true;
      pnl.font.style.enabled =  true;
      pnl.font.fontSize.enabled =  true;      
      pnl.font.setFont(ini.font, ini.fontSize);
    }
    
    // 导出标号选项
    if(ini.outputLabelNumber){
      pnl.outputLabelNumberCheckBox.value = ini.outputLabelNumber;
    }
  
    // 输出横排文字
    if(ini.horizontalText){
      pnl.outputHorizontalCheckBox.value = ini.horizontalText;
    }
    // 处理无标号文档
    if(ini.outputNoSignPsd){
      pnl.outputNoSignPsdCheckBox.value = ini.outputNoSignPsd;
    }
    // 使用指定类型图源
    if (ini.sourceFileType){    
      pnl.setSourceFileTypeCheckBox.value = true;
      pnl.setSourceFileTypeList.enabled = true;
      pnl.setSourceFileTypeList.selection.text = ini.sourceFileType;
    }
  
    // 执行动作GroupN
    if (ini.runActionGroup){
      pnl.runActionGroupList.enabled = true;      
      pnl.runActionGroupList.selection = ini.runActionGroup;  
      pnl.runActionGroupCheckBox.value = true;
    }  
  
    // 导入后不关闭文档
    if(ini.notClose)
      pnl.notCloseCheckBox.value = true;
    
    // 不对图层进行分组
    if(ini.layerNotGroup)
      pnl.layerNotGroupCheckBox.value = true;
      
  } 

  return pnl;
};

//
// 自定义读取配框
//
LabelPlusInput.createSettingsPanel = function(pnl, ini) {
  var win = GenericUI.getWindow(pnl.parent);

  pnl.text = _MT_STRING_LABEL_SETTING;
  pnl.win = win;

  pnl.fileMask = "INI Files: *.ini, All Files: *.*";
  pnl.loadPrompt = "Read Setting";
  pnl.savePrompt = "Save Setting";
  pnl.defaultFile = undefined;

  var w = pnl.bounds[2] - pnl.bounds[0];
  var offsets = [w*0.2, w*0.5, w*0.8];
  var y = 15;
  var bw = 90;

  var x = offsets[0]-(bw/2);
  pnl.load = pnl.add('button', [x,y,x+bw,y+20], _MY_STRING_BUTTON_LOAD);
  x = offsets[1]-(bw/2);
  pnl.save = pnl.add('button', [x,y,x+bw,y+20], _MY_STRING_BUTTON_SAVE);
  x = offsets[2]-(bw/2);
  pnl.reset = pnl.add('button', [x,y,x+bw,y+20], _MY_STRING_BUTTON_RESET);

  pnl.load.onClick = function() {
    var pnl = this.parent;
    var win = pnl.win;
    var mgr = win.mgr;
    var def = pnl.defaultFile;

    if (!def) {
      if (mgr.iniFile) {
        def = GenericUI.iniFileToFile(mgr.iniFile);
      } else {
        def = GenericUI.iniFileToFile("~/settings.ini");
      }
    }

    var f;
    var prmpt = pnl.loadPrompt;
    var sel = Stdlib.createFileSelect(pnl.fileMask);
    if (isMac()) {
      sel = undefined;
    }
    f = Stdlib.selectFileOpen(prmpt, sel, def);
    if (f) {
      win.ini =LabelPlusInput.readIni(f);
      win.close(4);

      if (pnl.onLoad) {
        pnl.onLoad(f);
      }
    }
  };

  pnl.save.onClick = function() {
    var pnl = this.parent;
    var win = pnl.win;
    var mgr = win.mgr;
    var def = pnl.defaultFile;

    if (!def) {
      if (mgr.iniFile) {
        def = GenericUI.iniFileToFile(mgr.iniFile);
      } else {
        def = GenericUI.iniFileToFile("~/settings.ini");
      }
    }

    var f;
    var prmpt = pnl.savePrompt;
    var sel = Stdlib.createFileSelect(pnl.fileMask);

    if (isMac()) {
      sel = undefined;
    }
    f = Stdlib.selectFileSave(prmpt, sel, def);

    if (f) {
      var mgr = win.mgr;
      var res = mgr.validatePanel(win.appPnl, win.ini, true);

      if (typeof(res) != 'boolean') {
        LabelPlusInput.writeIni(f, res);

        if (pnl.onSave) {
          pnl.onSave(f);
        }
      }
    }
  };

  pnl.reset.onClick = function() {
    var pnl = this.parent;
    var win = pnl.win;
    var mgr = win.mgr;

    if (mgr.defaultIniFile) {
      win.ini = mgr.readIniFile(mgr.defaultIniFile);

    } else if (mgr.ini) {
      win.ini = mgr.ini;
    }

    win.close(4);
    if (pnl.onReset) {
      pnl.onReset();
    }
  };
};

//
// 读出用户UI数据
//
LabelPlusInput.prototype.validatePanel = function(pnl, ini, tofile) {
  var self = this;
  var opts = new LabelPlusInputOptions(ini);

  // 写配置项时无需存储这些
  if(!tofile || tofile == false){
    // 图源文件夹
    if (pnl.sourceTextBox.text) {    
      f = new Folder(pnl.sourceTextBox.text);
    }
    else{
      return self.errorPrompt(_MT_ERROR_NOTFOUNDSOURCE);  
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
    else{
      return self.errorPrompt(_MT_ERROR_NOTFOUNDTARGET);
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
    opts.labelFilename = pnl.lpTextFileTextBox.text;

    var fl = new Folder(f.path);
    opts.labelFilePath = fl.toUIString();    
    
    // Image选择  
    if(!pnl.chooseImageListBox.selection || pnl.chooseImageListBox.selection.length == 0)
      return self.errorPrompt(_MT_ERROR_NOTCHOOSEIMAGE);
    else
      opts.imageSelected = pnl.chooseImageListBox.selection;  
  }
  
  // 文本替换  
  if(pnl.textReplaceCheckBox.value)
    opts.textReplace = pnl.textReplaceTextBox.text;  

  // 字体  
  if(pnl.setFontCheckBox.value){
    opts.setFont = true;
    var font = pnl.font.getFont()
    opts.font = font.font;
    opts.fontSize = font.size;
  }

  // 导出标号选项
  if(pnl.outputLabelNumberCheckBox.value)
    opts.outputLabelNumber = true;
  
  // 输出横排文字
  if(pnl.outputHorizontalCheckBox.value)
    opts.horizontalText = true;
  
  // 处理无标号文档
  if(pnl.outputNoSignPsdCheckBox.value)
    opts.outputNoSignPsd = true;
  
  // 使用指定类型图源
  if (pnl.setSourceFileTypeCheckBox.value){    
    opts.sourceFileType = pnl.setSourceFileTypeList.selection.text;
  }
  else
    opts.sourceFileType = undefined;
  
  // 执行动作GroupN
  if (pnl.runActionGroupCheckBox.value)
    opts.runActionGroup = pnl.runActionGroupList.selection;
  else
    opts.runActionGroup = undefined;
  
  // 导入后不关闭文档
  if(pnl.notCloseCheckBox.value)
    opts.notClose = true;
    
  // 不对图层进行分组
  if(pnl.layerNotGroupCheckBox.value)
    opts.layerNotGroup = true;
  
  return opts;
};

//
// 执行用户UI功能
//
LabelPlusInput.prototype.process = function(opts, doc) {
  var self = this;

  Stdlib.log.setFile(opts.labelFilePath+"\\LabelPlusInputer.log");//LabelPlusInputOptions.LOG_FILE);
  Stdlib.log("Start");
  Stdlib.log("Properties:");
  Stdlib.log(listProps(opts)); 
    
  //解析LabelPlus文本
  var lpFile = new LabelPlusTextReader(opts.labelFilename);
  
  //读取文本替换配置
  if(opts.textReplace)
    var textReplace = LabelPlusInput.textReplaceReader(opts.textReplace);
  
  //选项排序
  opts.imageSelected.sort();
  
  //遍历所选图片 导入数据= =
  for(var i=0; i<opts.imageSelected.length; i++){
    var originName = opts.imageSelected[i].text;
    var filename;
    var labelData = lpFile.LabelData[originName];
    var gourpData = lpFile.GroupData;    
    
    // 根据sourceFileType替换文件后缀名      
    if(opts.sourceFileType){
      filename = originName.substring(0,originName.lastIndexOf("."))  + opts.sourceFileType;
    }
    else
      filename = originName;

    // 不处理无标号文档
    if(!opts.outputNoSignPsd && labelData.length == 0)
      continue;
      
    // 打开图片文件
    var bgFile = File(opts.source + "//" + filename);
    if(!bgFile || !bgFile.exists){
      var msg = "Image " + filename + " Not Found.";
      Stdlib.log(msg);
      alert(msg);
      continue;
    } 
      
    // 在PS中打开文件 
    var bg = app.open(bgFile);
    
    var layerGroups = new Array();
    
    
    // 遍历LabelData
    for(var j=0; j<labelData.length; j++){
        var labelNum = j+1;
        var labelX = labelData[j].LabelheadValue[0];
        var labelY = labelData[j].LabelheadValue[1];
        var labelGroup = gourpData[labelData[j].LabelheadValue[2]];
        var labelString = labelData[j].LabelString;
        var artLayer;
        
        //创建分组
        if(!opts.layerNotGroup && !layerGroups[labelGroup]){
          layerGroups[labelGroup] = bg.layerSets.add();
          layerGroups[labelGroup].name = labelGroup;
        }       
        if(opts.outputLabelNumber && !layerGroups["_Label"]){
          layerGroups["_Label"] = bg.layerSets.add();
          layerGroups["_Label"].name = "Label";
        }
      
        // 导出标号
        if(opts.outputLabelNumber){
          LabelPlusInput.newTextLayer(bg,
            labelNum,
            labelX,
            labelY,
            "Arial",
            opts.setFont ? opts.fontSize : undefined,
            false,
            90,
            layerGroups["_Label"]
            );
        }
      
        // 替换文本
        if(textReplace){
          for(var k=0;k<textReplace.length;k++)
            labelString = labelString.replace (textReplace[k].From, textReplace[k].To);
        }
      
        // 导出文本
        if(labelString && labelString != ""){
          artLayer = LabelPlusInput.newTextLayer(bg,
            labelString,
            labelX,
            labelY,
            opts.setFont ? opts.font : "SimSun",
            opts.setFont ? opts.fontSize : undefined,
            !opts.horizontalText,
            90,
            opts.layerNotGroup ?  undefined : layerGroups[labelGroup]);
        }
        
        // 执行动作,名称为分组名
        if(opts.runActionGroup) {
          bg.activeLayer = artLayer;
          try{
            app.doAction(labelGroup , opts.runActionGroup);
          }
          catch(e){
            Stdlib.log("DoAction " +labelGroup +
              " in " + opts.runActionGroup +
              " Error: \r\n" + e);
          }
        }        
    }

    // 保存文件
    var fileOut = new File(opts.target + "//" + filename);
    var options = PhotoshopSaveOptions;
    var asCopy = false;
    var extensionType = Extension.LOWERCASE;
    bg.saveAs(fileOut, options, asCopy, extensionType);
    
    // 关闭文件
    if(!opts.notClose)
      bg.close();    
  }
  alert(_MY_STRING_COMPLETE);
  Stdlib.log("Complete!");
};

LabelPlusTextReader = function(path) {  
  var self = this;
  
  if(!path){    
    throw "LabelPlusTextReader no filename";
  }
  
  var f = new File(path);  
  if(!f || !f.exists){    
    throw "LabelPlusTextReader file not exists";
  } 
  
  // 打开
  f.open("r");  
  
  // 分行读取
  var state = 'start'; //'start','filehead','context'
  var notDealStr;
  var notDealLabelheadMsg;
  var nowFilename;
  var labelData = new Array();
  var filenameList = new Array();
  var groupData;
  
  for(var i=0; !f.eof; i++) {
    var lineStr = f.readln();
    var lineMsg = LabelPlusTextReader.judgeLineType(lineStr);
    switch (lineMsg.Type){
      case 'filehead':
        if(state == 'start'){
          //处理start blocks
          var result = LabelPlusTextReader.readStartBlocks(notDealStr);
          if(!result)
              throw "readStartBlocks fail";
          groupData = result.Groups;        
        }
        else if(state == 'filehead'){        
        }
        else if(state == 'context'){
          //保存label
          labelData[nowFilename].push(
              {
              LabelheadValue : notDealLabelheadMsg.Values,
              LabelString : notDealStr.trim() }
          );        
        }    
      
        //新建文件项
        labelData[lineMsg.Title] = new Array();
        filenameList.push(lineMsg.Title);
        nowFilename = lineMsg.Title;    
        notDealStr = "";
        state = 'filehead';      
        break;
        
      case 'labelhead':
        if(state == 'start'){   //start-labelhead 不存在
              throw "start-filehead";
              break;        
        }
        else if(state == 'filehead'){
        }
        else if(state == 'context'){
          labelData[nowFilename].push(
              {
              LabelheadValue : notDealLabelheadMsg.Values,
              LabelString : notDealStr.trim() }
          );        
        }    
        
        notDealStr = "";
        notDealLabelheadMsg = lineMsg;
        state = 'context';
        break;
        
      case 'unkown':
        notDealStr += "\r" + lineStr;
        break; 
      }
  }
  
  // 成员变量
  self.Path = path;      
  self.ImageList = filenameList;
  self.LabelData = labelData;
  self.GroupData = groupData;
  
  return self;
};

//
// 判断字符串行类型 'filehead','labelhead','unkown'
//
LabelPlusTextReader.judgeLineType = function(str) {
  var myType = 'unkown';
  var myTitle;
  var myValues;
  
  str = str.trim();
  var fileheadRegExp = />{6,}\[.+\]<{6,}/g;
  var labelheadRegExp = /-{6,}\[\d+\]-{6,}\[.+\]/g;
  
  var fileheadStrArr = fileheadRegExp.exec(str);
  var labelheadStrArr = labelheadRegExp.exec(str);
  if(fileheadStrArr &&  fileheadStrArr.length != 0) {
    myType = 'filehead';
    var s = fileheadStrArr[0];
    myTitle = s.substring(s.indexOf("[")+1, s.indexOf("]"));       
  }   
  else if(labelheadStrArr && labelheadStrArr.length !=0) {
    myType = 'labelhead';
    var s = labelheadStrArr[0];
    myTitle = s.substring(s.indexOf("[")+1, s.indexOf("]"));
    valuesStr = s.substring(s.lastIndexOf("[")+1, s.lastIndexOf("]"))
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

//
// 创建文本图层
//
LabelPlusInput.newTextLayer = function(doc,text,x,y,font,size,isVertical,opacity,group) {
  artLayerRef = doc.artLayers.add();
  artLayerRef.kind = LayerKind.TEXT;
  textItemRef = artLayerRef.textItem;

  textItemRef.contents = text;
  
  if(size)
    textItemRef.size = size;
  else
    textItemRef.size = doc.height / 90.0;
  
  textItemRef.font = font;
  if(isVertical)
    textItemRef.direction = Direction.VERTICAL;
  textItemRef.antiAliasMethod = AntiAlias.SMOOTH;
  textItemRef.position = Array(doc.width*x,doc.height*y);

  if(group)
    artLayerRef.move(group, ElementPlacement.PLACEATBEGINNING);  
    
  return artLayerRef;
}

//
// 文本替换字符串解析程序
//
LabelPlusInput.textReplaceReader = function(str){
  var arr = new Array();
  var strs = str.split('|');
  if(!strs)
    return; //解析失败
    
  for(var i=0; i<strs.length; i++){
    if(!strs[i] || strs[i]=="")
      continue;
      
    var strss = strs[i].split("->");
    if((strss.length != 2) || (strss[0]=="") || (strss[1]==""))
      return; //解析失败
    
    arr.push({
      From : strss[0],
      To : strss[1],
    });
  }

  if(arr.length != 0)
    return arr;
  else 
    return;
}

//
// 写入配置
//
LabelPlusInput.writeIni = function(iniFile, ini) {
  //$.level = 1; debugger;
  if (!ini || !iniFile) {
    return;
  }
  var file = GenericUI.iniFileToFile(iniFile);

  if (!file) {
    Error.runtimeError(9001, Error("Bad ini file specified: \"" + iniFile + "\"."));
  }

  if (file.open("w", "TEXT", "????")) {
    file.lineFeed = "unix";
    file.encoding = 'UTF-8';
    var str = GenericUI.iniToString(ini);
    file.write(str);
    file.close();
  }
  return ini;
};

//
// 读出配置
//
LabelPlusInput.readIni = function(iniFile, ini) {
  //$.level = 1; debugger;

  if (!ini) {
    ini = {};
  }
  if (!iniFile) {
    return ini;
  }
  var file = GenericUI.iniFileToFile(iniFile);

  if (!file) {
    Error.runtimeError(9001, Error("Bad ini file specified: \"" + iniFile + "\"."));
  }

  if (!file.exists) {
    //
    // XXX Check for an ini path .ini file in the script's folder.
    //
  }

  if (file.exists && file.open("r", "TEXT", "????")) {
    file.lineFeed = "unix";
    file.encoding = 'UTF-8';
    var str = file.read();
    ini = GenericUI.iniFromString(str, ini);
    file.close();
  }

  if (ini.noUI) {
    ini.noUI = toBoolean(ini.noUI);
  }

  return ini;
};

// 主程序
LabelPlusInput.main = function() {
  var ui = new LabelPlusInput();
  ui.exec();  
};

LabelPlusInput.main();

"LabelPlus_Ps_Script.jsx";
// EOF

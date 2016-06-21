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

// LabelPlus专用格式的TextReader
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
  
  // json格式读取
  if(path.substring(path.lastIndexOf("."), path.length) == '.json'){  
    f.open("r", "TEXT", "????");
    f.lineFeed = "unix";
    f.encoding = 'UTF-8';    
    var json = f.read();
    var data = (new Function('return ' + json))();
    f.close();
    return data;
  }
  
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
        
      case 'unknown':
        notDealStr += "\r" + lineStr;
        break; 
      }
  }
  
  if(state == 'context' && lineMsg.Type == 'unknown')
    labelData[nowFilename].push(
      {
	  LabelheadValue : notDealLabelheadMsg.Values,
	  LabelString : notDealStr.trim() 
      }
    );
  
  // 成员变量
  self.Path = path;      
  self.ImageList = filenameList;
  self.LabelData = labelData;
  self.GroupData = groupData;
  
  return self;
};

//
// 判断字符串行类型 'filehead','labelhead','unknown'
//
LabelPlusTextReader.judgeLineType = function(str) {
  var myType = 'unknown';
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

"labelplus_text_reader.js";

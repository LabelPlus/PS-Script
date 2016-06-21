//
//   LabelPlus_Ps_Script.jsx
//   This is a Input Text Tool for LabelPlus Text File.
// 
// Copyright 2015, Noodlefighter
// Released under GPL License.
//
// License: http://noodlefighter.com/label_plus/license
//
 
// Function written by Luca Hofmann
// http://stackoverflow.com/questions/20575016/photoshop-cs3-scripting-font-names
//
function getInternalFontName(pFontName) {
    for (var i = 0; i < app.fonts.length; i++) {
       if (pFontName == app.fonts[i].postScriptName) {
           return pFontName; // already is an internal font name.
       }
       if (pFontName == app.fonts[i].name) {
           return app.fonts[i].postScriptName; // found an internal name.
       }
   }   
   return null;
}  

// TEST
//var internalFontName = getInternalFontName("Trebuchet MS Bold");   

"get_internal_font_name.js";

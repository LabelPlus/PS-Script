![img](pic.jpg)

### 概述
以ps脚本解析LabelPlus文本以达到自动化导入psd的目的。

### 脚本说明
该ps脚本基于xtools编写。
直接执行src文件夹中的jsx文件 需要在本地安装xtools

P.S.关于[xtools](http://ps-scripts.sourceforge.net/xtools.html)
`xtools is a JavaScript toolkit that facilitates scripting Adobe Photoshop.`

### 实现功能

#### 基本功能
* 解析LabelPlus文本 创建对应文本图层
* 选择图源文件夹
* 选择输出目标psd文件夹
* 选择部分文件导入

#### 导出项目设置
* 是否导出标号
* 是否处理无标号文档
* 是否改变图源后缀名

#### 默认格式设置
* 自定义字体
* 自定义字号

#### 自动化流程可选项
* 添加头尾标志
* 根据标号分组，执行某分组中对应的动作"GroupN"(N为分组编号)
* 完成导入后不关闭psd文档

#### 关于JSON格式
    支持导入.json格式文本，想要处理json文件格式，文件后缀名应为.json。


## 手动发布流程

脚本依赖xtools工具集，为了能让普通用户使用，须使用Flatten工具处理。

该项目未实现自动化发布，为了减少错误，记录一下发布流程：

> 假设xtools工具集安装目录为{XTOOLS_ROOT}

0. 修改`LabelPlus_Ps_Script.jsx`中的版本号；设置要发布的语言包，如`global_const_en.js`
1. 修改`my_include.js`中的`//@includepath`一行为`{XTOOLS_ROOT}`
2. 在Photoshop中执行`{XTOOLS_ROOT}/apps/Flatten.js`，弹出的界面中，Mode设为`Folder`，Source设为本仓库的src文件夹，点击`Process`，等待处理完毕
3. 将`LabelPlus_Ps_Script.jsx`加上语言后缀，如`LabelPlus_Ps_Script_EN.jsx`
4. 手动转换编码为UTF8

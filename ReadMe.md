### 概述
以ps脚本解析LabelPlus文本以达到自动化导入psd的目的。

### 脚本说明 
该ps脚本基于xtools编写。

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
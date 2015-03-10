# gridmap
baidu map plus
#说明
###该js插件是工作在百度地图api上层的代码，需要有百度地图的支持。GridmapOverlay继承百度api的overlay对象，在加载该文件前必须加载百度地图api。
#设计
###代码的设计思想参考了heatmap.js，区别是做了简化和单项功能强化。去掉了heatmap.js中颜色块之间的叠加融合，并把圆颜色区域改成了方块颜色区域。
#使用
  *1、两个粒度的数据var gridmapOverlay = new BMapLib.GridmapOverlay({ Ismonochrome: false, lng_dif: xxxxx, lat_dif: xxxxx, IsTwoClass: true});
  之后使用setLargeSmallData(largedata,smalldata)--->map.addOverlay(this.gridmapOverlay);;
  *2、一个粒度的数据var gridmapOverlay = new BMapLib.GridmapOverlay({ Ismonochrome: false, lng_dif: xxxxx, lat_dif: xxxxx, IsTwoClass: false});
  之后使用setDataSet(data)--->map.addOverlay(this.gridmapOverlay);;
  *3、另外Ismonochrome=false和gradient是一组，Ismonochrome=true和color是一组。
  

//1、初始化var gridmapoverlay = new BMapLib.GridmapOverlay(opts);
//  opts是一个对象，可以有的参数为lng_dif,lat_dif,Ismonochrome,color,
//      其中：lng_dif和lat_dif为栅格的边长对应的经纬度差值
//            Ismonochrome为true的时候绘制单色，为false的时候使用渐变色（目前还没有提供渐变色的设置接口，以后可以考虑加上）
//            color在Ismonochrome为true的时候，color用来设置单色的颜色
//2、gridmapoverlay.setDatSet(points, map)来添加数据集，参数points是元素为{lng:xxx,lat:xxx,c:xxx}的数组，map是map对象
//3、map.addOverlay(gridmapoverlay)将自定义的gridmapoverlay添加到地图上去
//var BMapLib = window.BMapLib = BMapLib || {};
var BMapLib = window.BMapLib || {};
(function () {
    var GridmapOverlay = BMapLib.GridmapOverlay = function (opts) {
        this.data = []; 
        this.largedata = [];
        this.smalldata = [];
        this.rect_length = 0; 
        this.rect_width = 0; 
        this.element = {}; 
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d"); 
        this.width = 0; 
        this.height = 0; 
        this.lng_dif = opts.lng_dif || 0.0096;
        this.lat_dif = opts.lat_dif || 0.009;
        this.Ismonochrome = opts.Ismonochrome || false; //指示画单色还是画渐变色,true对应单色
        this.IsTwoClass = opts.IsTwoClass || false;//指示大小两组data或者一组data
        this.bounds = null; //地图视图范围
        this.color = opts.color || "rgba(255,0,0,0.98)";
        this.IsSameMap=true;
        this._map = {};
        this.gradient = opts.gradient || { 0.45: "rgb(0,0,255)", 0.55: "rgb(0,255,255)", 0.65: "rgb(0,255,0)", 0.95: "yellow", 1.0: "rgb(255,0,0)" }; //it is used to save palette      
    }
    GridmapOverlay.prototype = new BMap.Overlay();
    GridmapOverlay.prototype.initialize = function (map) {
        this._map = map;
        var el = document.createElement("div");
        el.style.position = "absolute";
        el.style.top = 0;
        el.style.left = 0;
        el.style.border = 0;
        el.style.width = this._map.getSize().width + "px";
        el.style.height = this._map.getSize().height + "px";
        this._map.getPanes().mapPane.appendChild(el);
        this.element = el;
        
        this.canvas.style.cssText = "position:absolute;top:0;left:0;z-index:1000;";
        this.width = this.canvas.width = this._map.getSize().width;
        this.height = this.canvas.height = this._map.getSize().height;
        el.appendChild(this.canvas);
        this.createGradient();
    }
    GridmapOverlay.prototype.draw = function () {
        this.setNewRectLength();
        var currentBounds = this._map.getBounds();
        if (currentBounds.equals(this.bounds)&&this.IsSameMap) {
            return;
        }
        this.IsSameMap=true;
        this.bounds = currentBounds;
        var ne = this._map.pointToOverlayPixel(currentBounds.getNorthEast()),
            sw = this._map.pointToOverlayPixel(currentBounds.getSouthWest()),
            topY = ne.y,
            leftX = sw.x;
        this.element.style.top = topY + "px";
        this.element.style.left = leftX + "px";
        this.ctx.beginPath();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.closePath();
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 0.6;
        if (this.IsTwoClass) {
            var zoom=this._map.getZoom();
            var d=[];
            if (zoom<14) {//使用ldata
                d=this.largedata;
            }
            else//使用sdata
            {
                d=this.smalldata;
            }
            var l=d.length;
            while (l--) {
                    var latlng = d[l].latlng;
                    if (!currentBounds.containsPoint(latlng)) {
                        continue;
                    }
                    var pix = this._map.pointToPixel(latlng);
                    var x1 = pix.x - this.rect_width / 2;
                    var y1 = pix.y - this.rect_length / 2;
                    this.ctx.beginPath();
                    switch(d[l].count) {
                    case "1":
                        this.ctx.fillStyle = "rgba(51,153,51,0.65)";
                    	break;
                    case "2":
                        this.ctx.fillStyle = "rgba(255,204,51,0.65)";
                    	break;
                    case "3":
                        this.ctx.fillStyle = "rgba(0,153,204,0.65)";
                    	break;
                    case "above":
                        
                    	break;
                    default:
                        this.ctx.fillStyle = "rgba(255,102,102,0.65)";
                    }
                    
                    this.ctx.rect(x1, y1, this.rect_width, this.rect_length);
                    //this.ctx.arc(30,50,60,0,2*Math.PI,false);
                    this.ctx.fill();
                    this.ctx.stroke();
                    this.ctx.closePath();
                }
            return;
        }
        if (this.data.length > 0) {
            var len = this.data.length;
            if (this.Ismonochrome) {
                this.ctx.fillStyle = this.color;
                while (len--) {
                    var latlng = this.data[len].latlng;
                    if (!currentBounds.containsPoint(latlng)) {
                        continue;
                    }
                    var pix = this._map.pointToPixel(latlng);
                    var x1 = pix.x - this.rect_width / 2;
                    var y1 = pix.y - this.rect_length / 2;
                    this.ctx.beginPath();
                    this.ctx.rect(x1, y1, this.rect_width, this.rect_length);
                    this.ctx.fill();
                    //this.ctx.stroke();
                    this.ctx.closePath();
                }
            }
            else {
                while (len--) {
                    var latlng = this.data[len].latlng;
                    if (!currentBounds.containsPoint(latlng)) {
                        continue;
                    }
                    var pix = this._map.pointToPixel(latlng);
                    var x1 = pix.x - this.rect_width / 2;
                    var y1 = pix.y - this.rect_length / 2;
                    this.ctx.beginPath();
                    var index_ = parseInt(this.data[len].c * 255 / 100) || 1;
                    index_ = index_ > 255 ? 255 : index_;
                    var r = this.gradient[index_ * 4].toString();
                    var b = this.gradient[index_ * 4 + 1].toString();
                    var c = this.gradient[index_ * 4 + 2].toString();
                    this.ctx.fillStyle = "rgba(" + r + "," + b + "," + c + ",0.3)";
                    this.ctx.rect(x1, y1, this.rect_width, this.rect_length);
                    //this.ctx.arc(30,50,60,0,2*Math.PI,false);
                    this.ctx.fill();
                    this.ctx.stroke();
                    this.ctx.closePath();
                }

            }
        }
    }
    GridmapOverlay.prototype.createGradient = function () {
        var vas = document.createElement("canvas");
        vas.width = "1";
        vas.height = "256";
        var ctx = vas.getContext("2d");
        var grad = ctx.createLinearGradient(0, 0, 1, 256);
        for (var x in this.gradient) {
            grad.addColorStop(x, this.gradient[x]);
        }
        ctx.fillStyle = grad; //grad is amazing
        ctx.fillRect(0, 0, 1, 256);
        this.gradient = ctx.getImageData(0, 0, 1, 256).data;
    }
    //compute the rectlength again
    GridmapOverlay.prototype.setNewRectLength = function () {
        var lei = this._map.getCenter();
        var p3 = map.pointToPixel(new BMap.Point(lei.lng, lei.lat));
        var k=1;
        if (this._map.getZoom()>13) {
             k=1;
        }
        else{
            k=5;
        }
        var p4 = map.pointToPixel(new BMap.Point(lei.lng + this.lng_dif*k, lei.lat - this.lat_dif*k));
        this.rect_width = Math.max(p4.x - p3.x, 0.5);
        this.rect_length = Math.max(p4.y - p3.y, 0.5);
    }
    GridmapOverlay.prototype.setDatSet = function (data) {
        this._map = arguments[1] || this._map;
        this.color=arguments[2]||this.color;
        this.IsSameMap = false;
        var currentBounds = this._map.getBounds();
        var dlen = data.length;
        this.latlngs = [];
        this.data=[];
        while (dlen--) {
            var latlng = new BMap.Point(data[dlen].lng, data[dlen].lat);

            this.data.push({
                latlng: latlng,
                c: data[dlen].count
            });
        }

    },
    GridmapOverlay.prototype.setLargeSmallData=function (ldata,sdata) {
        this.largedata=ldata;
        this.smalldata=sdata;
        this.IsSameMap = false;
    }
    GridmapOverlay.prototype.cleanup = function () {
               this._map.getPanes().mapPane.removeChild(this.element);
            },
    GridmapOverlay.prototype.clear=function () {
                var w = this.width,h = this.height;
                this.ctx.clearRect(0,0,w,h)   
            }
})();
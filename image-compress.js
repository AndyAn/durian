var cell = cell || {};

// runtime environment detect
(function (_c_) {
    function detect(ua) {
        var os = this.os = {},
            android = ua.match(/(Android);?[\s\/]+([\d.]+)?/),
            ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
            ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/),
            iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
            webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
            touchpad = webos && ua.match(/TouchPad/),
            kindle = ua.match(/Kindle\/([\d.]+)/),
            blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/),
            bb10 = ua.match(/(BB10).*Version\/([\d.]+)/),
            rimtabletos = ua.match(/(RIM\sTablet\sOS)\s([\d.]+)/),
            playbook = ua.match(/PlayBook/),
            chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
            firefox = ua.match(/Firefox\/([\d.]+)/),
            ie = ua.match(/MSIE ([\d.]+)/),
            ie = ua.match(/MSIE\s([\d.]+)/);

        if (android) os.android = true, os.version = android[2];
        if (iphone && !ipod) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.');
        if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.');
        if (ipod) os.ios = os.ipod = true, os.version = ipod[3] ? ipod[3].replace(/_/g, '.') : null;
        if (webos) os.webos = true, os.version = webos[2];
        if (touchpad) os.touchpad = true;
        if (blackberry) os.blackberry = true, os.version = blackberry[2];
        if (bb10) os.bb10 = true, os.version = bb10[2];
        if (rimtabletos) os.rimtabletos = true, os.version = rimtabletos[2];
        if (kindle) os.kindle = true, os.version = kindle[1];

        this.pad = !! (ipad || playbook || (android && !ua.match(/Mobile/)) ||
            (firefox && ua.match(/Tablet/)) || (ie && !ua.match(/Phone/) && ua.match(/Touch/)));
        this.phone = !! (!this.pad && !os.ipod && (android || iphone || webos || blackberry || bb10 ||
            (chrome && ua.match(/Android/)) || (chrome && ua.match(/CriOS\/([\d.]+)/)) ||
            (firefox && ua.match(/Mobile/)) || (ie && ua.match(/Touch/))));
        os.pc = true;
    }
    
    _c_.detact = {};
    detect.call(_c_.detact, navigator.userAgent)
})(cell);

// MegaPixel fixes for iOS6
(function (_c_) {
    function megaPixel() {
        function renderImageToCanvas(img, canvas, options) {
            var iw = img.naturalWidth,
                ih = img.naturalHeight;
            var width = options.width,
                height = options.height;
            var x = options.x || 0,
                y = options.y || 0;
            
            var ctx = canvas.getContext('2d');
            var imgCvs = document.createElement('canvas');
            var imgCtx = imgCvs.getContext('2d');
            imgCvs.width = width;
            imgCvs.height = height;
            
            if (detectSubsampling(img)) {
                iw /= 2;
                ih /= 2;
            }
            var d = 1024; // size of tiling canvas
            var tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = tmpCanvas.height = d;
            var tmpCtx = tmpCanvas.getContext('2d');
            var vertSquashRatio = detectVerticalSquash(img, iw, ih);
            var sy = 0;
            
            while (sy < ih) {
                var sh = sy + d > ih ? ih - sy : d;
                var sx = 0;
                while (sx < iw) {
                    var sw = sx + d > iw ? iw - sx : d;
                    tmpCtx.drawImage(img, -sx, -sy);
                    var dx = (sx * width / iw + x) << 0;
                    var dw = Math.ceil(sw * width / iw);
                    var dy = (sy * height / ih / vertSquashRatio + y) << 0;
                    var dh = Math.ceil(sh * height / ih / vertSquashRatio);
                    imgCtx.drawImage(tmpCanvas, 0, 0, sw, sh, dx, dy, dw, dh);
                    sx += d;
                }
                sy += d;
            }
            
//            getSnapshot(imgCvs, $('.compress'));
            
            // handle the orientation information and rotate image
            switch(img.exif.orientation) {
                case 2: // mirror of orientation 1
                case 1: // normal
                    break;
                case 4: // mirror of orientation 3
                case 3: // 180
                    ctx.rotate(180 * Math.PI / 180);
                    ctx.translate(-width, -height);
                    break;
                case 5: // mirror of orientation 6
                case 6: // 90
                    width = height + (height = width, 0);
                    ctx.rotate(90 * Math.PI / 180);
                    ctx.translate(0, -height);
                    break;
                case 7: // img of orientation 8
                case 8: // 270
                    width = height + (height = width, 0);
                    ctx.rotate(270 * Math.PI / 180);
                    ctx.translate(-width, 0);
                    break;
            }
            ctx.drawImage(imgCvs, 0, 0, imgCvs.width, imgCvs.height, 0, 0, width, height);
            
            imgCvs = imgCtx = null;
            tmpCanvas = tmpCtx = null;
        }
        
        function getSnapshot(cvs, log) {
            var img = new Image();
            img.src = cvs.toDataURL();
            img.onload = function () {
                log.append(this);
                log.append('<hr/>');
            };
        }

        function detectSubsampling(img) {
            var iw = img.naturalWidth,
                ih = img.naturalHeight;
            if (iw * ih > 1024 * 1024) { // subsampling may happen over megapixel image
                var canvas = document.createElement('canvas');
                canvas.width = canvas.height = 1;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, -iw + 1, 0);
                // subsampled image becomes half smaller in rendering size.
                // check alpha channel value to confirm image is covering edge pixel or not.
                // if alpha value is 0 image is not covering, hence subsampled.
                return ctx.getImageData(0, 0, 1, 1).data[3] === 0;
            } else {
                return false;
            }
        }
    
        function detectVerticalSquash(img, iw, ih) {
            var canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = ih;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            var data = ctx.getImageData(0, 0, 1, ih).data;
            // search image edge pixel position in case it is squashed vertically.
            var sy = 0;
            var ey = ih;
            var py = ih;
            while (py > sy) {
                var alpha = data[(py - 1) * 4 + 3];
                if (alpha === 0) {
                    ey = py;
                } else {
                    sy = py;
                }
                py = (ey + sy) >> 1;
            }
            canvas = null;
            var ratio = (py / ih);
            return (ratio === 0) ? 1 : ratio;
        }

        this.isSubsampled = detectSubsampling;
        this.renderTo = renderImageToCanvas;
    }
    
    _c_.megaPixel = {};
    megaPixel.call(_c_.megaPixel);
})(cell);

// image shrink function
(function (_c_) {
    function imageShrink ($) {
        this.attach = function (options) {
            var opt = {};
            opt.ctl = options.ctl;
            opt.width = options.width || (_c_.detact.phone ? $(document).width() : 300); // can set this parameter basing on the runtime device resolution
            opt.callback = options.callback || function (e) { };
            opt.debug = options.debug || false;
            
            var isDebug = opt.debug;
            
            // check if an input attached
            if (!opt.ctl) return;
            
            var fileControl = $(opt.ctl);
            if (!opt.ctl[0].nodeType || opt.ctl[0].nodeType !== 1 || opt.ctl[0].nodeName.toLowerCase() !== 'input') return;
            
            fileControl.on('change', function(e) {
                var files = e.target.files,
                    f = null,
                    reader = null,
                    exifreader = null,
                    container = $('<div class="image_compress_debug"></div>');
    
                for (var i = 0; i < files.length; i++) {
                    f = files[i];
                    
                    // file type checking
                    if (f && f.type.match(/image.*/ig)) {
                        reader = new FileReader();
                        reader.onload = (function(file) {
                            return function(e) {
                                
                                var imageReader = FileDataReader.readFromBase64String(e.target.result.substr(e.target.result.indexOf(',') + 1));
                                var exifInfo = EXIF.readFromBinaryFile(imageReader);
                                var orientation = exifInfo[EXIF.TiffTags[0x0112]] || 1;
                                var exifWidth = exifInfo[EXIF.Tags[0xA002]] || exifInfo[EXIF.TiffTags[0x0100]];
                                var exifHeight = exifInfo[EXIF.Tags[0xA003]] || exifInfo[EXIF.TiffTags[0x0101]];
                                
                                // debugging information
                                if (isDebug) {
                                    console.log(exifInfo);
                                }
                                
                                var img = new Image();
                                img.exif = {width: exifWidth, height: exifHeight, orientation: orientation};
                                img.onload = function() {
                                    var scaleWidth = opt.width;
                
                                    // handle the non-jpg images on PC
                                    this.exif.width = this.exif.width || this.width;
                                    this.exif.height = this.exif.height || this.height;
                                    
                                    // fix the image orientation handling for different browsers
                                    var swapSign = '5678'.indexOf(this.exif.orientation) > -1 && this.exif.width == this.width,
                                        srcWidth = swapSign ? this.height : this.width,
                                        srcHeight = swapSign ? this.width : this.height,
                                        scaleHeight = scaleWidth / srcWidth * srcHeight;
                                    
                                    // restore the original size if the image scaled up
                                    if (scaleWidth > srcWidth || scaleHeight > srcHeight) {
                                        scaleWidth = srcWidth;
                                        scaleHeight = srcHeight;
                                    }
                                    
                                    // debugging information
                                    if (isDebug) {
                                        container.append('<br />orientation: ' + this.exif.orientation + '<br />');
                                        container.append('swap-sign: ' + swapSign + '<br />');
                                        container.append('width: ' + srcWidth + ' | height: ' + srcHeight + '<br />');
                                        container.append('image-width: ' + this.width + ' | image-height: ' + this.height + '<br />');
                                        container.append('exif-width: ' + this.exif.width + ' | exif-height: ' + this.exif.height + '<br />');
                                        container.append('scale-width: ' + scaleWidth + ' | scale-height: ' + Math.floor(scaleHeight) + '<br />');
                                    }
                                    
                                    var cvs = document.createElement('canvas'),
                                        ctx = cvs.getContext('2d');

                                    cvs.width = scaleWidth;
                                    cvs.height = scaleHeight;
                                    
                                    // fixes mega pixel issue on iOS
                                    if (_c_.detact.os.ios) {
                                        _c_.megaPixel.renderTo(this, cvs, { width: scaleWidth, height: scaleHeight, x: 0, y: 0 });
                                    }
                                    else {
                                        // handle the orientation information and rotate image
                                        switch(this.exif.orientation) {
                                            case 2: // mirror of orientation 1
                                            case 1: // normal
                                                break;
                                            case 4: // mirror of orientation 3
                                            case 3: // 180
                                                ctx.rotate(180 * Math.PI / 180);
                                                ctx.translate(-1 * scaleWidth, -1 * scaleHeight);
                                                break;
                                            case 5: // mirror of orientation 6
                                            case 6: // 90
                                                scaleWidth = scaleHeight + (scaleHeight = scaleWidth, 0);
                                                ctx.rotate(90 * Math.PI / 180);
                                                ctx.translate(0, -1 * scaleHeight);
                                                break;
                                            case 7: // mirror of orientation 8
                                            case 8: // 270
                                                scaleWidth = scaleHeight + (scaleHeight = scaleWidth, 0);
                                                ctx.rotate(270 * Math.PI / 180);
                                                ctx.translate(-1 * scaleWidth, 0);
                                                break;
                                        }

                                        ctx.drawImage(this, 0, 0, this.width, this.height, 0, 0, scaleWidth, scaleHeight);
                                    }
                                    var dataUrl = cvs.toDataURL();
    
                                    // debugging information
                                    if (isDebug) {
                                        var pic = new Image();
                                        pic.width = cvs.width;
                                        pic.height = cvs.height;
                                        pic.src = dataUrl;
                                        
                                        container.append(pic);
                                        container.append('<br />canvas-width: ' + cvs.width + ' | canvas-height: ' + Math.floor(cvs.height) + '<br />');
                                    }
                                    
                                    ctx = cvs = null;
                                    
                                    opt.callback({data: dataUrl, offset: dataUrl.indexOf(',') + 1, totalFiles: files.length});
                                };
                                img.src = e.target.result;
                            };
                        })(f);
    
                        reader.readAsDataURL(f);
                   }
                }
                
                // debugging information
                if (isDebug) container.insertAfter(fileControl);
            });
        }
    }
    
    _c_.imageShrink = {};
    imageShrink.call(_c_.imageShrink, jQuery || Zepto);
})(cell);
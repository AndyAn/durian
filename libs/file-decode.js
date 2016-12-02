var cell = cell || {};
cell.encoding = cell.encoding || {};

// utf8 encode / decode
(function(_e_) {
    function utf8() {
        var _utf8 = (function() {
            var bs = [];
            var len = 0;
            
            return {
                decode: function(b) {
                    for (var i = 0; i < 7; i++) {
                        if ((b & (0x80 >> i)) === 0) {
                            1 === i ? len-- : len = 0 > i - 1 ? 0 : i - 1;
                            bs.push(b & (0x7F >> i));
                            break;
                        }
                    }
                    
                    var l = 0;
                    if (len === 0) {
                        for(var i = bs.length; i > 0; i--) {
                            l |= bs[i - 1] << ((bs.length - i) * 6);
                        }
                        bs.length = 0;
                    }
                    return l;
                },
                encode: function(c) {
                    var b = c.charCodeAt(0);
                    var sec = 0;
                    if (b < 0x80) return [b];
                    
                    for(var i = 0; i < 6; i++) {
                        sec = (b >> i * 6) & 0x3F;
                        if (sec > 0) {
                            bs.push(sec);
                        }
                        else {
                            len = bs.length;
                            for (var n = len; n > 0; n--) {
                                bs[n - 1] = bs[n - 1] | (n === len ? (0xFF & 0xFE << (7 - len)) : 0x80);
                            }
                            break;
                        }
                    }
                    
                    return bs.reverse();
                }
            };
        })();
        
        this.decode = function(bytes) {
            var a = [], b = 0;
            for (var i = 0; i < bytes.length; i++) {
                b = _utf8.decode(bytes[i]);
                if (e > 0) a.push(String.fromCharCode(e));
            }
            
            return a.join('');
        };
        
        this.encode = function(text) {
            var data = [];
            
            for (var i = 0; i < text.length; i++) {
                data.concat(_utf8.encode(text[i]));
            }
            
            return data;
        };
        
        this._byteDec = _utf8.decode;
        
        this._byteEnc = _utf8.encode;
    }
    
    _e_.utf8 = {};
    utf8.call(_e_.utf8);
})(cell.encoding);

// image code file encode / decode
(function(_e_) {
    function imgCode($) {
        this.autoDecode = function(callback) {
            $('img').each(function() {
                var type = $(this).data('type');
                if (type && type.toLowerCase() === 'script') {
                    this.onload = function() {
                        var data = fileLoader(this);
                        if (callback && callback instanceof Function) {
                            callback(data);
                        }
                        else {
                            if (data.error.length === 0) eval(data.code);
                        }
                    };
                }
            });
        };
        
        this.decode = function(src, callback) {
            var img = new Image();
            img.src = src;
            img.onload = function() {
                var data = fileLoader(this);
                if (callback && callback instanceof Function) {
                    callback(data);
                }
                else {
                    if (data.error.length === 0) eval(data.code);
                }
            };
        };
        
        this.encode = function(text, callback) {
            var bytes, err = '', img, cvs, ctx, imgdata;
            
            try {
                if (!!document.createElement('canvas').getContext) {
                    bytes = text instanceof Uint8Array || text instanceof ArrayBuffer ? text : _e_.utf8.encode(text);
                    
                    var data = new Uint8Array(bytes),
                        size = Math.ceil(Math.sqrt(data.length / 1) / 2);
                    console.log(data);
                    
                    //console.log('data:' + data + ', size:' + size);
                    cvs = document.createElement('canvas');
                    ctx = cvs.getContext('2d');
                    
                    cvs.width = cvs.height = size;
                    img = ctx.createImageData(size, size);
                    var l = img.data.length;
                    //console.log('data:' + data.length + ', size:' + l);
                    //console.log(img);
                    for(var i = 0; i < l; i++) {
                        if (i < data.length) img.data[i] = data[i];
                    }
                    
                    ctx.putImageData(img, 0, 0);
                    
                    imgdata = cvs.toDataURL();
                }
                else {
                    err = 'doesn\'t support Canvas';
                }
            }
            catch(e) {
                err = e.message;
            }
            
            cvs = ctx = img = bytes = data = null;
            return {data: imgdata, error: err};
        };
        
        var fileLoader = function(img) {
            var err = '';
            
            try {
                if (!!document.createElement('canvas').getContext) {
                    var cvs = document.createElement('canvas'),
                        ctx = cvs.getContext('2d');
                    
                    cvs.width = img.width, cvs.height = img.height;
                    ctx.drawImage(img, 0, 0, img.width, img.height);
                    var data = ctx.getImageData(0, 0, img.width, img.height).data;
                    //console.log(data);
                    
                    var a = [], len = data.length, p = -1, e = 0, depth = getPixelDepth(data);
                    
                    //console.log(depth);
                    
                    for (var i = 0; i < len; i += 4) {
                        for (var n = 0; n < depth / 8; n++) {
                            e = _e_.utf8._byteDec(data[i + n]);
                            if (e > 0) a[++p] = String.fromCharCode(e);
                        }
                    }
                }
                else {
                    err = 'doesn\'t support Canvas';
                }
            }
            catch(e) {
                err = e.message;
            }
            
            return {code: a.join(''), error: err};
        };
        
        var getPixelDepth = function(data, sample) {
            var pos = 0, depth = 0, len = (sample = (sample || '').toString().toLowerCase(), 10), secLen = data.length / 4;
            
            len = sample === 'l' ? 200 : sample === 'm' ? 100 : len;
            len = len > secLen ? secLen : len;
            
            for(var i = 0; i < len; i++) {
                pos = Math.ceil(Math.random() * secLen)
                if (data[pos * 4] !== data[pos * 4 + 1] || data[pos * 4 + 0] !== data[pos * 4 + 2]) {
                    depth = 24;
                    break;
                }
                depth = 8;
            }
            
            return depth;
        };
    }
    
    _e_.imgCode = {};
    imgCode.call(_e_.imgCode, jQuery || Zepto);
})(cell.encoding);
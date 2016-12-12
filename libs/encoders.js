var cell = cell || {};
cell.encoding = cell.encoding || {};

// utf8 encode / decode
((_e_) => {
  var utf8 = function () {
    var _utf8 = (() => {
      var bs = [];
      var len = 0;
          
      return {
        decode: function (b) {
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
          
          if (l > 0) bs = [];
          return l;
        },
        encode: function (c) {
          var b = c.charCodeAt(0);
          var sec = 0, bs = [];
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
        },
        clearBuff: function () {
          bs = [];
        }
      };
    })();
      
    this.decode = function (bytes) {
      var a = [], b = 0;
      for (var i = 0; i < bytes.length; i++) {
        b = _utf8.decode(bytes[i]);
        // console.log(`bytes[${i}]: ${bytes[i]}, b: ${b}`);
        if (b > 0) a.push(String.fromCharCode(b));
      }
      
      _utf8.clearBuff();
      return a.join('');
    };
    
    this.encode = function (text) {
      var data = [];
      
      for (var i = 0; i < text.length; i++) {
        data.splice.apply(data, [data.length, 0].concat(_utf8.encode(text[i])));
        //data.concat(_utf8.encode(text[i]));
      }
      
      _utf8.clearBuff();
      return data;
    };
    
    this._byteDec = _utf8.decode;
    
    this._byteEnc = _utf8.encode;
  }
  
  _e_.utf8 = {};
  utf8.call(_e_.utf8);
})(cell.encoding);

// base64 encode
((_e_) => {
  var base64 = function () {
    var base64EncodeMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    this.encode = function (bytes) {
    	var bae64Code = [];
    	var map = base64EncodeMap;
    	
    	var i = 0;
    	var origBytes = { a: 0, b: 0, c: 0 };
    	var indeces = { a: 0, b: 0, c: 0, d: 0 }
    	
    	while (i < bytes.length) {
    		origBytes.a = bytes[i++];
    		origBytes.b = bytes[i++];
    		origBytes.c = bytes[i++];
    		
    		indeces.a = origBytes.a >>> 2;
    		indeces.b = ((origBytes.a & 0x03) << 4) | (origBytes.b >>> 0x04);
    		indeces.c = ((origBytes.b & 0x0f) << 2) | (origBytes.c >>> 0x06);
    		indeces.d = (origBytes.c & 0x3f);
    		
    		if (isNaN(origBytes.b)) {
    			indeces.c = indeces.d = 64;
    		}
    		else if (isNaN(origBytes.c)) {
    			indeces.d = 64;
    		}
    		
    		bae64Code.push(map[indeces.a], map[indeces.b], map[indeces.c], map[indeces.d]);
    	}
    	return bae64Code.join('');
    };
  };
  
  _e_.base64 = {};
  base64.call(_e_.base64);
})(cell.encoding);

// image code file encode / decode
((_e_) => {
    var imgCode = function () {
      this.autoDecode = function (callback) {
        Array.from(document.getElementsByTagName('img')).forEach((img) => {
          var type = img.dataset.type;
          if (type && type.toLowerCase() === 'script') {
            img.onload = function() {
              var data = fileLoader(img);
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
      
      this.decode = function (src, callback) {
        if (src instanceof Uint8ClampedArray) {
          
        }
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
      
      this.encode = function (text, callback) {
        var bytes, rgbaBytes = [], err = '', img, cvs, ctx, imgdata;
        var PIXEL_CAPACITY = 3;
          
        try {
          if (!!document.createElement('canvas').getContext) {
            bytes = text instanceof Uint8Array || text instanceof ArrayBuffer ? text : _e_.utf8.encode(text);
            
            var size = Math.ceil(Math.sqrt(bytes.length / PIXEL_CAPACITY)); // we only fill in data into RGB, alpha channel should be always 255
            if (Math.pow(size, 2) * PIXEL_CAPACITY < bytes.length + header.size) { // this is make sure we have enough pixel to fill in the data
              size++;
            }
            
            var data = new Uint8Array(size * size * PIXEL_CAPACITY);
            cvs = document.createElement('canvas');
            ctx = cvs.getContext('2d');
            
            cvs.width = cvs.height = size;
            img = ctx.createImageData(size, size);

            // cell.utils.print.byteArray(bytes);

            // align the data
            for(var i = 0, l = 3 - bytes.length % 3; i < l; i++) {
              bytes.push(0);
            }
            // bytes.push(0xff);

            bytes.forEach((byte, idx) => {
              rgbaBytes.push(byte);
              if (idx % 3 == 2) {
                rgbaBytes.push(0xff);
              }
            });

            img.data.set(header.create(rgbaBytes.length));
            img.data.set(rgbaBytes, header.size);

            // cell.utils.print.byteArray(img.data);
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
        
        // imgdata = new Uint8ClampedArray(img.data);
        // img.data.set(imgdata);
        cvs = ctx = img = bytes = data = null;
        return { dataURL: imgdata, error: err };
      };
      
      var header = (() => {
        return {
          size: 12,
          create: (size) => {
            return [
              // data signature
              'f'.charCodeAt(),
              'i'.charCodeAt(),
              'i'.charCodeAt(),
              0xff,
              // data size
              (size & 0xff0000000000) >> 40,
              (size & 0xff00000000) >> 32,
              (size & 0xff000000) >> 24,
              0xff,
              (size & 0xff0000) >> 16,
              (size & 0xff00) >> 8,
              (size & 0xff),
              0xff
            ];
          },
          get: (data) => {
            return {
              fii: ((data[0] << 16) + (data[1] << 8) + data[2]) == 6711657,
              size: (data[4] << 40) + (data[5] << 32) + (data[6] << 24) + (data[8] << 16) + (data[9] << 8) + data[10]
            };
          }
        };
      })();
      
      var fileLoader = function (img) {
        var err = '';
          
        try {
          if (!!document.createElement('canvas').getContext) {
            var cvs = document.createElement('canvas'),
                ctx = cvs.getContext('2d');
            
            // console.log(`width: ${img.width}, height: ${img.height}`);
            cvs.width = img.width, cvs.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);
            var data = ctx.getImageData(0, 0, img.width, img.height).data;
            
            // cell.utils.print.byteArray(data);
            var a = [], len = header.get(data).size, p = -1, e = 0, depth = getPixelDepth(data);
            data = data.slice(header.size);
            
            // cell.utils.print.byteArray(data);
            // console.log(`depth: ${depth}, len: ${len}`);
            for (var i = 0; i < len; i += 4) {
              for (var n = 0; n < depth / 8; n++) {
                // console.log(data[i + n].toString(16));
                // e = _e_.utf8._byteDec(data[i + n]);
                // if (e > 0) a[++p] = String.fromCharCode(e);
                a[++p] = data[i + n];
              }
            }
            //console.log('data:' + data.length + ', size:' + img.height);
            // cell.utils.print.byteArray(a);
          }
          else {
            err = 'doesn\'t support Canvas';
          }
        }
        catch(e) {
          err = e.message;
        }
        
        // return { code: a.join(''), error: err };
        return { code: _e_.utf8.decode(a), error: err };
      };
      
      var getPixelDepth = function (data, sample) {
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
    imgCode.call(_e_.imgCode);
})(cell.encoding);

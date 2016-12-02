var cell = cell || {};
cell.encoding = cell.encoding || {};

// image code file encode / decode
(function(_e_) {
  function imgCode($) {
    this.readAsImage = function(file) {
      var reader = new FileReader();
      var cvs = document.createElement('canvas');
      var ctx = cvs.getContext('2d');
      var img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = function(e) {
        cvs.width = ctx.width = img.width;
        cvs.height = ctx.height = img.height;
        ctx.drawImage(img, 0, 0);
        //console.log(ctx.getImageData(0, 0, 8, 12));
      };
      return cvs;
    };

    this.extractAsBitFonts = function(cvs, size) {
      var hCount = cvs.width / size.width;
      var vCount = cvs.height / size.height;
      var pxFont = { "size": size, data: [] };
      for (var i = 0; i < size.width * size.height / 8; i++) {
        pxFont.data.push(0);
      }

      var piece = null, ctx = cvs.getContext('2d'), byte = 0;
      for (var v = 0; v < vCount; v++) {
        for (var h = 0; h < hCount; h++) {
          piece = ctx.getImageData(h * size.width, v * size.height, size.width, size.height).data;
          //debugger
          byte = 0;
          for (var n = 0; n < size.width * size.height; n++) {
            byte = byte << 1 | (piece[n * 4] > 0 ? 1 : 0);
            if ((n + 1) % 8 == 0) {
              pxFont.data[pxFont.data.length] = byte;
              // byte = piece[n * 4] > 0 ? 1 : 0;
              byte = 0;
            }
          }
        }
      }
      console.log(pxFont.data.length);
      pxFont.data.length = pxFont.data.length - size.width * size.height / 8;
      console.log(pxFont.data.length);
      return pxFont;
    }

    this.readAsUnit8Array = function(file) {
      var reader = new FileReader();
      reader.readAsArrayBuffer(file);
      var u8Bytes = new Uint8Array();
      reader.onload = function(e) {
        u8Bytes = new Uint8Array(e.target.result);
        console.log(u8Bytes.length);
        console.log(u8Bytes);
      }
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

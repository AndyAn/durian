// var testData = [[25, 0, 151, 255, 25, 0, 151, 255, 25, 0, 151, 255], [25, 0, 151, 255, 25, 0, 151, 255, 25, 0, 151, 255], [25, 0, 151, 255, 25, 0, 151, 255, 25, 0, 151, 128]];
// var preFilteredPngImage = [[0x19, 0, 0x97, 0xff, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x81]]; 
// var preFilteredPngData = [1, 0x19, 0, 0x97, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x81];


var encodePng = function(data) {
	var png = [];
	
	png.push(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
	
	var ihdrChunk = createPngIHDR(data);
	for (var i = 0, n = ihdrChunk.length; i<n; i++) {
		png.push(ihdrChunk[i]);
	}
	
	var idatChunk = createPngIDAT(data);
	for (var i = 0, n = idatChunk.length; i<n; i++) {
		png.push(idatChunk[i]);
	}
	
	var iendChunk = createPngIEND(data);
	for (var i = 0, n = iendChunk.length; i<n; i++) {
		png.push(iendChunk[i]);
	}
	
	return png;
};

var createPngIHDR = function(data) {
	var chunkData = [];
	
	var width = data[0].length / 4;
	var height = data.length;

	chunkData.push((width >>> 24) & 0xff);
	chunkData.push((width >>> 16) & 0xff);
	chunkData.push((width >>> 8) & 0xf);
	chunkData.push(width & 0xff);
	
	chunkData.push((height >>> 24) & 0xff);
	chunkData.push((height >>> 16) & 0xff);
	chunkData.push((height >>> 8) & 0xf);
	chunkData.push(height & 0xff);

	chunkData.push(8); // bitDepth
	chunkData.push(6); // colorType = RGBA
	chunkData.push(0); // compressionMethod = DEFLATE (standard)
	chunkData.push(0); // filterMethod = 0 (standard)
	chunkData.push(0); // interlace = off
	
	return createPngChunk([0x49, 0x48, 0x44, 0x52], chunkData);
};

var createPngIDAT = function(data) {
	var chunkData = [];
	
	for (var i = 0, n = data.length; i<n; i++) {
		
		var scanline = data[i];
		
		// For quick testing purposes only, change to 0
		//if (i == 0) {
		//	chunkData.push(1);
		//}
		//else {
		//	chunkData.push(2);
		//}
		chunkData.push(0);
		
		for (var x = 0, y = scanline.length; x<y; x+=4) {
			chunkData.push(scanline[x], scanline[x+1], scanline[x+2], scanline[x+3]);
		}
	}
	
	chunkData = uncompressedDeflate(chunkData)
	
	return createPngChunk([0x49, 0x44, 0x41, 0x54], chunkData);
};

var createPngIEND = function() {
	return createPngChunk([0x49, 0x45, 0x4e, 0x44], []);
};

var createPngChunk = function(type, data) {
	
	var chunk = [];
	
	chunk.push((data.length >>> 24) & 0xFF);
	chunk.push((data.length >>> 16) & 0xFF);
	chunk.push((data.length >>> 8) & 0xFF);
	chunk.push(data.length & 0xFF);
	
	for (var i = 0; i<4; i++) {
		chunk.push(type[i]);
	}
	
	for (var i = 0, n = data.length; i<n; i++) {
		chunk.push(data[i]);
	}
	
	// Calc and push CRC
	var crc = new CRC();
	crc.update(chunk, 4, chunk.length-4);
	
	var checksum = crc.crc ^ 0xffffffff;
	
	chunk.push((checksum >>> 24) & 0xFF);
	chunk.push((checksum >>> 16) & 0xFF);
	chunk.push((checksum >>> 8) & 0xFF);
	chunk.push(checksum & 0xFF);
	
	return chunk;
};


var uncompressedDeflate = function(data) {
	var returnData = [];
	
	// Refer to RFC1950 Sect 2.2
	returnData.push(0x08); // CMF (CF = 8, CINFO = 0)
	returnData.push(0x1D); // FLG (FCHECK = preset, FDICT = 0, FLEVEL = 0)
	
	// Refer to RFC1951 Sects 2, 3.2.3, 3.2.4
	var maxBlockSize = 65535;
	
	var leftOverBytes = data.length % maxBlockSize;
	var numBlocks = (data.length - leftOverBytes) / maxBlockSize;
	if (leftOverBytes > 0) { numBlocks++; }
	//console.log(numBlocks);
	
	var adlers1 = 1;
	var s2 = 0;
	
	for (var i = 0; i<numBlocks; i++) {
		var lastBlock = (i == numBlocks-1);
		var numBytesInBlock = lastBlock ? leftOverBytes : maxBlockSize;
		//console.log(lastBlock, numBytesInBlock);

		// Write block header
		returnData.push(lastBlock ? 1 : 0); // BFINAL = lastBlock, BTYPE = 00
		
		// Write block length
		var len1 = numBytesInBlock & 0xFF;
		var len2 = numBytesInBlock >>> 8;
		returnData.push(len1);
		returnData.push(len2);
		returnData.push(~len1 & 0xFF);
		returnData.push(~len2 & 0xFF);
		
		for (var n = maxBlockSize*i, end = n+numBytesInBlock; n<end; n++) {
			returnData.push(data[n]);
		}
		
	}

	// Write adler32 checksum
	var adler32 = new Adler32();
	adler32.update(data, 0, data.length);
	
	returnData.push((adler32.s2 >>> 8) & 0xFF);
	returnData.push(adler32.s2 & 0xFF);

	returnData.push((adler32.s1 >>> 8) & 0xFF);
	returnData.push(adler32.s1 & 0xFF);
	
	return returnData;
};

var Adler32 = function() {

	this.s1 = 1;
	this.s2 = 0;
	
};

Adler32.prototype.update = function(array, index, len) {
	var s1 = this.s1;
	var s2 = this.s2;
	
	var NMAX = 3792;
	var unroll = NMAX / 16;
	
	while (len >= NMAX) {
		len -= NMAX;
		var n = unroll;
		do {
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
		} while (--n);
		s1 = s1 % 65521;
		s2 = s2 % 65521;
	}

    if (len) {
        while (len >= 16) {
            len -= 16;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
			s1 += (array[index++]);
			s2 += s1;
        }
        while (len--) {
			s1 += (array[index++]);
			s2 += s1;
        }
		s1 = s1 % 65521;
		s2 = s2 % 65521;
    }
	
	this.s1 = s1;
	this.s2 = s2;
};

var CRC = function() {
	
	this.crc = 0xffffffff;	
	
};

CRC.table = null;

CRC.make_table = function() {
	
	var table = [];
    for (var n = 0; n<256; n++) {
    	var c = n;
    	for (var k = 0; k<8; k++) {
    		if (c & 1) {
    			c = 0xedb88320 ^ (c >>> 1);
    		}
    		else {
    			c = c >>> 1;
    		}
    	}
    	table[n] = c;
    }
	
    CRC.table = table;
};

CRC.prototype.update = function(array, index, len) {

	if (CRC.table == null) {
		CRC.make_table();
	}
	
	var crc = this.crc;
	var table = CRC.table;
	/*
	
	for (var i = index, n = index+len; i<n; i++) {
		crc = CRC.table[(crc ^ array[i]) & 0xff] ^ (crc >>> 8); 
	}
	*/

    while (len >= 8) {
        crc = table[(crc ^ array[index++]) & 0xff] ^ (crc >>> 8)
        crc = table[(crc ^ array[index++]) & 0xff] ^ (crc >>> 8)
        crc = table[(crc ^ array[index++]) & 0xff] ^ (crc >>> 8)
        crc = table[(crc ^ array[index++]) & 0xff] ^ (crc >>> 8)
        crc = table[(crc ^ array[index++]) & 0xff] ^ (crc >>> 8)
        crc = table[(crc ^ array[index++]) & 0xff] ^ (crc >>> 8)
        crc = table[(crc ^ array[index++]) & 0xff] ^ (crc >>> 8)
        crc = table[(crc ^ array[index++]) & 0xff] ^ (crc >>> 8)
        len -= 8;
    }
    if (len) do {
        crc = table[(crc ^ array[index++]) & 0xff] ^ (crc >>> 8);
    } while (--len);
	
	this.crc = crc;
	return crc;
};

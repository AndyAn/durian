/*
 * Javascript EXIF Reader 0.1.4
 * Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com, http://blog.nihilogic.dk/
 * Licensed under the MPL License [http://www.nihilogic.dk/licenses/mpl-license.txt]
 */

var FileDataReader = {};

(function(_fr_) {
    function fileRead() {
        var data = null,
            that = this;
        
        this.readFromArrayBuffer = function(arrayBuffer) {
            data = new Uint8Array(arrayBuffer);
            that.length = data.length;
            return that;
        }
        
        this.readFromBase64String = function(base64String) {
            data = base64DecToArr(base64String);
            that.length = data.length;
            return that;
        }
        
        this.getByte = function(offset) {
            return data[offset || 0];
        }
        
        this.length = 0;
        
        this.getWord = function(offset, bigEndian) {
            var word = bigEndian ? (that.getByte(offset) << 8) + this.getByte(offset + 1) : (this.getByte(offset + 1) << 8) + this.getByte(offset);
            if (word < 0) word += 0x10000;
            return word;
        }
        
        this.getDWord = function(offset, bigEndian) {
            var byte1 = that.getByte(offset),
                byte2 = that.getByte(offset + 1),
                byte3 = that.getByte(offset + 2),
                byte4 = that.getByte(offset + 3);

                var dword = bigEndian ? (((((byte1 << 8) + byte2) << 8) + byte3) << 8) + byte4 : (((((byte4 << 8) + byte3) << 8) + byte2) << 8) + byte1;
                if (dword < 0) dword += 0x100000000;
                return dword;
        }
        
        this.getUDWord = function(offset, bigEndian) {
            var uDWord = that.getDWord(offset, bigEndian);
                if (uDWord > 0x7FFFFFFF)
                    return uDWord - 0x100000000;
                else
                    return uDWord;
        }
        
        this.getChar = function(offset) {
            return String.fromCharCode(that.getByte(offset));
        }
        
        this.getString = function(offset, length) {
            var chars = [],
                i = offset,
                j = 0;
            
            length = length ? length : that.length - offset;
            
            for(;i < offset + length; i++, j++) {
                chars[j] = that.getChar(i);
            }
            
            return chars.join('');
        }
        
        function b64ToUint6 (chr) {
            return chr > 64 && chr < 91 ?
                chr - 65 : chr > 96 && chr < 123 ?
                    chr - 71 : chr > 47 && chr < 58 ?
                        chr + 4 : chr === 43 ?
                            62 : chr === 47 ?
                                63 : 0;
        }
        
        function base64DecToArr (base64String, blocksSize) {
            var b64Enc = base64String.replace(/[^A-Za-z0-9\+\/]/g, ''), 
                base64Len = b64Enc.length,
                outLen = blocksSize ? Math.ceil((base64Len * 3 + 1 >> 2) / blocksSize) * blocksSize : base64Len * 3 + 1 >> 2, 
                taBytes = new Uint8Array(outLen);
            
            for (var mod3, mod4, nuint24 = 0, outIdx = 0, inIdx = 0; inIdx < base64Len; inIdx++) {
                mod4 = inIdx & 3;
                nuint24 |= b64ToUint6(b64Enc.charCodeAt(inIdx)) << 18 - 6 * mod4;
                if (mod4 === 3 || base64Len - inIdx === 1) {
                    for (mod3 = 0; mod3 < 3 && outIdx < outLen; mod3++, outIdx++) {
                    taBytes[outIdx] = nuint24 >>> (16 >>> mod3 & 24) & 255;
                }
                    nuint24 = 0;
                }
            }
            
            return taBytes;
        }
    };
    
    fileRead.call(_fr_);
})(FileDataReader);

var EXIF = {};

(function(_exif_) {
    function readEXIF() {
        var isDebug = false,
            that = this;
        
        this.Tags = {
        
            // version tags
            0x9000 : 'ExifVersion',			// EXIF version
            0xA000 : 'FlashpixVersion',		// Flashpix format version
        
            // colorspace tags
            0xA001 : 'ColorSpace',			// Color space information tag
        
            // image configuration
            0xA002 : 'PixelXDimension',		// Valid width of meaningful image
            0xA003 : 'PixelYDimension',		// Valid height of meaningful image
            0x9101 : 'ComponentsConfiguration',	// Information about channels
            0x9102 : 'CompressedBitsPerPixel',	// Compressed bits per pixel
        
            // user information
            0x927C : 'MakerNote',			// Any desired information written by the manufacturer
            0x9286 : 'UserComment',			// Comments by user
        
            // related file
            0xA004 : 'RelatedSoundFile',		// Name of related sound file
        
            // date and time
            0x9003 : 'DateTimeOriginal',		// Date and time when the original image was generated
            0x9004 : 'DateTimeDigitized',		// Date and time when the image was stored digitally
            0x9290 : 'SubsecTime',			// Fractions of seconds for DateTime
            0x9291 : 'SubsecTimeOriginal',		// Fractions of seconds for DateTimeOriginal
            0x9292 : 'SubsecTimeDigitized',		// Fractions of seconds for DateTimeDigitized
        
            // picture-taking conditions
            0x829A : 'ExposureTime',		// Exposure time (in seconds)
            0x829D : 'FNumber',			// F number
            0x8822 : 'ExposureProgram',		// Exposure program
            0x8824 : 'SpectralSensitivity',		// Spectral sensitivity
            0x8827 : 'ISOSpeedRatings',		// ISO speed rating
            0x8828 : 'OECF',			// Optoelectric conversion factor
            0x9201 : 'ShutterSpeedValue',		// Shutter speed
            0x9202 : 'ApertureValue',		// Lens aperture
            0x9203 : 'BrightnessValue',		// Value of brightness
            0x9204 : 'ExposureBias',		// Exposure bias
            0x9205 : 'MaxApertureValue',		// Smallest F number of lens
            0x9206 : 'SubjectDistance',		// Distance to subject in meters
            0x9207 : 'MeteringMode', 		// Metering mode
            0x9208 : 'LightSource',			// Kind of light source
            0x9209 : 'Flash',			// Flash status
            0x9214 : 'SubjectArea',			// Location and area of main subject
            0x920A : 'FocalLength',			// Focal length of the lens in mm
            0xA20B : 'FlashEnergy',			// Strobe energy in BCPS
            0xA20C : 'SpatialFrequencyResponse',	// 
            0xA20E : 'FocalPlaneXResolution', 	// Number of pixels in width direction per FocalPlaneResolutionUnit
            0xA20F : 'FocalPlaneYResolution', 	// Number of pixels in height direction per FocalPlaneResolutionUnit
            0xA210 : 'FocalPlaneResolutionUnit', 	// Unit for measuring FocalPlaneXResolution and FocalPlaneYResolution
            0xA214 : 'SubjectLocation',		// Location of subject in image
            0xA215 : 'ExposureIndex',		// Exposure index selected on camera
            0xA217 : 'SensingMethod', 		// Image sensor type
            0xA300 : 'FileSource', 			// Image source (3 == DSC)
            0xA301 : 'SceneType', 			// Scene type (1 == directly photographed)
            0xA302 : 'CFAPattern',			// Color filter array geometric pattern
            0xA401 : 'CustomRendered',		// Special processing
            0xA402 : 'ExposureMode',		// Exposure mode
            0xA403 : 'WhiteBalance',		// 1 = auto white balance, 2 = manual
            0xA404 : 'DigitalZoomRation',		// Digital zoom ratio
            0xA405 : 'FocalLengthIn35mmFilm',	// Equivalent foacl length assuming 35mm film camera (in mm)
            0xA406 : 'SceneCaptureType',		// Type of scene
            0xA407 : 'GainControl',			// Degree of overall image gain adjustment
            0xA408 : 'Contrast',			// Direction of contrast processing applied by camera
            0xA409 : 'Saturation', 			// Direction of saturation processing applied by camera
            0xA40A : 'Sharpness',			// Direction of sharpness processing applied by camera
            0xA40B : 'DeviceSettingDescription',	// 
            0xA40C : 'SubjectDistanceRange',	// Distance to subject
        
            // other tags
            0xA005 : 'InteroperabilityIFDPointer',
            0xA420 : 'ImageUniqueID'		// Identifier assigned uniquely to each image
        };
        
        this.TiffTags = {
            0x0100 : 'ImageWidth',
            0x0101 : 'ImageHeight',
            0x8769 : 'ExifIFDPointer',
            0x8825 : 'GPSInfoIFDPointer',
            0xA005 : 'InteroperabilityIFDPointer',
            0x0102 : 'BitsPerSample',
            0x0103 : 'Compression',
            0x0106 : 'PhotometricInterpretation',
            0x0112 : 'Orientation',
            0x0115 : 'SamplesPerPixel',
            0x011C : 'PlanarConfiguration',
            0x0212 : 'YCbCrSubSampling',
            0x0213 : 'YCbCrPositioning',
            0x011A : 'XResolution',
            0x011B : 'YResolution',
            0x0128 : 'ResolutionUnit',
            0x0111 : 'StripOffsets',
            0x0116 : 'RowsPerStrip',
            0x0117 : 'StripByteCounts',
            0x0201 : 'JPEGInterchangeFormat',
            0x0202 : 'JPEGInterchangeFormatLength',
            0x012D : 'TransferFunction',
            0x013E : 'WhitePoint',
            0x013F : 'PrimaryChromaticities',
            0x0211 : 'YCbCrCoefficients',
            0x0214 : 'ReferenceBlackWhite',
            0x0132 : 'DateTime',
            0x010E : 'ImageDescription',
            0x010F : 'Make',
            0x0110 : 'Model',
            0x0131 : 'Software',
            0x013B : 'Artist',
            0x8298 : 'Copyright'
        }
        
        this.GPSTags = {
            0x0000 : 'GPSVersionID',
            0x0001 : 'GPSLatitudeRef',
            0x0002 : 'GPSLatitude',
            0x0003 : 'GPSLongitudeRef',
            0x0004 : 'GPSLongitude',
            0x0005 : 'GPSAltitudeRef',
            0x0006 : 'GPSAltitude',
            0x0007 : 'GPSTimeStamp',
            0x0008 : 'GPSSatellites',
            0x0009 : 'GPSStatus',
            0x000A : 'GPSMeasureMode',
            0x000B : 'GPSDOP',
            0x000C : 'GPSSpeedRef',
            0x000D : 'GPSSpeed',
            0x000E : 'GPSTrackRef',
            0x000F : 'GPSTrack',
            0x0010 : 'GPSImgDirectionRef',
            0x0011 : 'GPSImgDirection',
            0x0012 : 'GPSMapDatum',
            0x0013 : 'GPSDestLatitudeRef',
            0x0014 : 'GPSDestLatitude',
            0x0015 : 'GPSDestLongitudeRef',
            0x0016 : 'GPSDestLongitude',
            0x0017 : 'GPSDestBearingRef',
            0x0018 : 'GPSDestBearing',
            0x0019 : 'GPSDestDistanceRef',
            0x001A : 'GPSDestDistance',
            0x001B : 'GPSProcessingMethod',
            0x001C : 'GPSAreaInformation',
            0x001D : 'GPSDateStamp',
            0x001E : 'GPSDifferential'
        }
        
        this.StringValues = {
            ExposureProgram : {
                0 : 'Not defined',
                1 : 'Manual',
                2 : 'Normal program',
                3 : 'Aperture priority',
                4 : 'Shutter priority',
                5 : 'Creative program',
                6 : 'Action program',
                7 : 'Portrait mode',
                8 : 'Landscape mode'
            },
            MeteringMode : {
                0 : 'Unknown',
                1 : 'Average',
                2 : 'CenterWeightedAverage',
                3 : 'Spot',
                4 : 'MultiSpot',
                5 : 'Pattern',
                6 : 'Partial',
                255 : 'Other'
            },
            LightSource : {
                0 : 'Unknown',
                1 : 'Daylight',
                2 : 'Fluorescent',
                3 : 'Tungsten (incandescent light)',
                4 : 'Flash',
                9 : 'Fine weather',
                10 : 'Cloudy weather',
                11 : 'Shade',
                12 : 'Daylight fluorescent (D 5700 - 7100K)',
                13 : 'Day white fluorescent (N 4600 - 5400K)',
                14 : 'Cool white fluorescent (W 3900 - 4500K)',
                15 : 'White fluorescent (WW 3200 - 3700K)',
                17 : 'Standard light A',
                18 : 'Standard light B',
                19 : 'Standard light C',
                20 : 'D55',
                21 : 'D65',
                22 : 'D75',
                23 : 'D50',
                24 : 'ISO studio tungsten',
                255 : 'Other'
            },
            Flash : {
                0x0000 : 'Flash did not fire',
                0x0001 : 'Flash fired',
                0x0005 : 'Strobe return light not detected',
                0x0007 : 'Strobe return light detected',
                0x0009 : 'Flash fired, compulsory flash mode',
                0x000D : 'Flash fired, compulsory flash mode, return light not detected',
                0x000F : 'Flash fired, compulsory flash mode, return light detected',
                0x0010 : 'Flash did not fire, compulsory flash mode',
                0x0018 : 'Flash did not fire, auto mode',
                0x0019 : 'Flash fired, auto mode',
                0x001D : 'Flash fired, auto mode, return light not detected',
                0x001F : 'Flash fired, auto mode, return light detected',
                0x0020 : 'No flash function',
                0x0041 : 'Flash fired, red-eye reduction mode',
                0x0045 : 'Flash fired, red-eye reduction mode, return light not detected',
                0x0047 : 'Flash fired, red-eye reduction mode, return light detected',
                0x0049 : 'Flash fired, compulsory flash mode, red-eye reduction mode',
                0x004D : 'Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected',
                0x004F : 'Flash fired, compulsory flash mode, red-eye reduction mode, return light detected',
                0x0059 : 'Flash fired, auto mode, red-eye reduction mode',
                0x005D : 'Flash fired, auto mode, return light not detected, red-eye reduction mode',
                0x005F : 'Flash fired, auto mode, return light detected, red-eye reduction mode'
            },
            SensingMethod : {
                1 : 'Not defined',
                2 : 'One-chip color area sensor',
                3 : 'Two-chip color area sensor',
                4 : 'Three-chip color area sensor',
                5 : 'Color sequential area sensor',
                7 : 'Trilinear sensor',
                8 : 'Color sequential linear sensor'
            },
            SceneCaptureType : {
                0 : 'Standard',
                1 : 'Landscape',
                2 : 'Portrait',
                3 : 'Night scene'
            },
            SceneType : {
                1 : 'Directly photographed'
            },
            CustomRendered : {
                0 : 'Normal process',
                1 : 'Custom process'
            },
            WhiteBalance : {
                0 : 'Auto white balance',
                1 : 'Manual white balance'
            },
            GainControl : {
                0 : 'None',
                1 : 'Low gain up',
                2 : 'High gain up',
                3 : 'Low gain down',
                4 : 'High gain down'
            },
            Contrast : {
                0 : 'Normal',
                1 : 'Soft',
                2 : 'Hard'
            },
            Saturation : {
                0 : 'Normal',
                1 : 'Low saturation',
                2 : 'High saturation'
            },
            Sharpness : {
                0 : 'Normal',
                1 : 'Soft',
                2 : 'Hard'
            },
            SubjectDistanceRange : {
                0 : 'Unknown',
                1 : 'Macro',
                2 : 'Close view',
                3 : 'Distant view'
            },
            FileSource : {
                3 : 'DSC'
            },
            Components : {
                0 : '',
                1 : 'Y',
                2 : 'Cb',
                3 : 'Cr',
                4 : 'R',
                5 : 'G',
                6 : 'B'
            }
        }
        
        function imageHasData(img) {
            return !!(img.exifdata);
        }
        
        function getImageData(img, callback) {
            var exif = findEXIFinJPEG(http.binaryResponse);
            img.exifdata = exif || {};
            if (callback) callback();
        }
        
        function findEXIFinJPEG(fileReader) {
            var markers = [];
        
            if (fileReader.getByte(0) != 0xFF || fileReader.getByte(1) != 0xD8) {
                return false; // not a valid jpeg
            }
        
            var offset = 2;
            var totalLength = fileReader.length;
            while (offset < totalLength) {
                if (fileReader.getByte(offset) != 0xFF) {
                    if (isDebug) console.log('Not a valid marker at offset ' + offset + ', found: ' + fileReader.getByte(offset));
                    return false; // not a valid marker, something is wrong
                }
        
                var marker = fileReader.getByte(offset + 1);
        
                // we could implement handling for other markers here, 
                // but we're only looking for 0xFFE1 for EXIF data
        
                if (marker == 0x5780) {
                    if (isDebug) console.log('Found 0xFFE1 marker');
                    return readEXIFData(fileReader, offset + 4, fileReader.getWord(offset + 2, true) - 2);
                    offset += 2 + fileReader.getWord(offset + 2, true);
        
                } else if (marker == 0xE1) {
                    // 0xE1 = Application-specific 1 (for EXIF)
                    if (isDebug) console.log('Found 0xFFE1 marker');
                    return readEXIFData(fileReader, offset + 4, fileReader.getWord(offset + 2, true) - 2);
        
                } else {
                    offset += 2 + fileReader.getWord(offset + 2, true);
                }
            }
        }
        
        function readTags(fileReader, tiffStart, dirStart, strings, isBigEnd) {
            var entries = fileReader.getWord(dirStart, isBigEnd);
            var tags = {};
            for (var i = 0;i < entries;i++) {
                var entryOffset = dirStart + i * 12 + 2;
                var tag = strings[fileReader.getWord(entryOffset, isBigEnd)];
                if (!tag && isDebug) console.log('Unknown tag: ' + fileReader.getWord(entryOffset, isBigEnd));
                tags[tag] = readTagValue(fileReader, entryOffset, tiffStart, dirStart, isBigEnd);
            }
            return tags;
        }
        
        function readTagValue(fileReader, entryOffset, tiffStart, dirStart, isBigEnd) {
            var type = fileReader.getWord(entryOffset + 2, isBigEnd);
            var values = fileReader.getDWord(entryOffset + 4, isBigEnd);
            var valueOffset = fileReader.getDWord(entryOffset + 8, isBigEnd) + tiffStart;
        
            switch (type) {
                case 1: // byte, 8-bit unsigned int
                case 7: // undefined, 8-bit byte, value depending on field
                    if (values == 1) {
                        return fileReader.getByte(entryOffset + 8, isBigEnd);
                    } else {
                        var valOffset = values > 4 ? valueOffset : (entryOffset + 8);
                        var vals = [];
                        for (var n = 0;n < values;n++) {
                            vals[n] = fileReader.getByte(valOffset + n);
                        }
                        return vals;
                    }
                    break;
        
                case 2: // ascii, 8-bit byte
                    var stringOffset = values > 4 ? valueOffset : (entryOffset + 8);
                    return fileReader.getString(stringOffset, values - 1);
                    break;
        
                case 3: // short, 16 bit int
                    if (values == 1) {
                        return fileReader.getWord(entryOffset + 8, isBigEnd);
                    } else {
                        var valOffset = values > 2 ? valueOffset : (entryOffset + 8);
                        var vals = [];
                        for (var n = 0;n < values;n++) {
                            vals[n] = fileReader.getWord(valOffset + 2 * n, isBigEnd);
                        }
                        return vals;
                    }
                    break;
        
                case 4: // long, 32 bit int
                    if (values == 1) {
                        return fileReader.getDWord(entryOffset + 8, isBigEnd);
                    } else {
                        var vals = [];
                        for (var n = 0;n < values;n++) {
                            vals[n] = fileReader.getDWord(valueOffset + 4 * n, isBigEnd);
                        }
                        return vals;
                    }
                    break;
                case 5:	// rational = two long values, first is numerator, second is denominator
                    if (values == 1) {
                        return fileReader.getDWord(valueOffset, isBigEnd) / fileReader.getDWord(valueOffset + 4, isBigEnd);
                    } else {
                        var vals = [];
                        for (var n = 0;n < values;n++) {
                            vals[n] = fileReader.getDWord(valueOffset + 8 * n, isBigEnd) / fileReader.getDWord(valueOffset + 4 + 8 * n, isBigEnd);
                        }
                        return vals;
                    }
                    break;
                case 9: // slong, 32 bit signed int
                    if (values == 1) {
                        return fileReader.getUDWord(entryOffset + 8, isBigEnd);
                    }
                    else {
                        var vals = [];
                        for (var n = 0;n < values;n++) {
                            vals[n] = fileReader.getUDWord(valueOffset + 4 * n, isBigEnd);
                        }
                        return vals;
                    }
                    break;
                case 10: // signed rational, two slongs, first is numerator, second is denominator
                    if (values == 1) {
                        return fileReader.getUDWord(valueOffset, isBigEnd) / fileReader.getUDWord(valueOffset + 4, isBigEnd);
                    } else {
                        var vals = [];
                        for (var n = 0;n < values;n++) {
                            vals[n] = fileReader.getUDWord(valueOffset + 8 * n, isBigEnd) / fileReader.getUDWord(valueOffset + 4 + 8 * n, isBigEnd);
                        }
                        return vals;
                    }
                    break;
            }
        }
        
        function readEXIFData(fileReader, start, length) {
            if (fileReader.getString(start, 4) != 'Exif') {
                if (isDebug) console.log('Not valid EXIF data! ' + fileReader.getString(start, 4));
                return false;
            }
        
            var isBigEnd, 
                tiffOffset = start + 6;
        
            // test for TIFF validity and endianness
            if (fileReader.getWord(tiffOffset) == 0x4949) {
                isBigEnd = false;
            }
            else if (fileReader.getWord(tiffOffset) == 0x4D4D) {
                isBigEnd = true;
            }
            else {
                if (isDebug) console.log('Not valid TIFF data! (no 0x4949 or 0x4D4D)');
                return false;
            }
        
            if (fileReader.getWord(tiffOffset + 2, isBigEnd) != 0x002A) {
                if (isDebug) console.log('Not valid TIFF data! (no 0x002A)');
                return false;
            }
        
            if (fileReader.getDWord(tiffOffset + 4, isBigEnd) != 0x00000008) {
                if (isDebug) console.log('Not valid TIFF data! (First offset not 8)', fileReader.getWord(tiffOffset + 4, isBigEnd));
                return false;
            }
        
            var tags = readTags(fileReader, tiffOffset, tiffOffset + 8, that.TiffTags, isBigEnd);
        
            if (tags.ExifIFDPointer) {
                var exifTags = readTags(fileReader, tiffOffset, tiffOffset + tags.ExifIFDPointer, that.Tags, isBigEnd);
                for (var tag in exifTags) {
                    switch (tag) {
                        case 'LightSource':
                        case 'Flash':
                        case 'MeteringMode':
                        case 'ExposureProgram':
                        case 'SensingMethod':
                        case 'SceneCaptureType':
                        case 'SceneType':
                        case 'CustomRendered':
                        case 'WhiteBalance': 
                        case 'GainControl': 
                        case 'Contrast':
                        case 'Saturation':
                        case 'Sharpness': 
                        case 'SubjectDistanceRange':
                        case 'FileSource':
                            exifTags[tag] = that.StringValues[tag][exifTags[tag]];
                            break;
                        case 'ExifVersion':
                        case 'FlashpixVersion':
                            exifTags[tag] = String.fromCharCode(exifTags[tag][0], exifTags[tag][1], exifTags[tag][2], exifTags[tag][3]);
                            break;
                        case 'ComponentsConfiguration': 
                            exifTags[tag] = 
                                that.StringValues.Components[exifTags[tag][0]]
                                + that.StringValues.Components[exifTags[tag][1]]
                                + that.StringValues.Components[exifTags[tag][2]]
                                + that.StringValues.Components[exifTags[tag][3]];
                            break;
                    }
                    tags[tag] = exifTags[tag];
                }
            }
        
            if (tags.GPSInfoIFDPointer) {
                var gpsTags = readTags(fileReader, tiffOffset, tiffOffset + tags.GPSInfoIFDPointer, that.GPSTags, isBigEnd);
                for (var tag in gpsTags) {
                    switch (tag) {
                        case 'GPSVersionID': 
                            gpsTags[tag] = gpsTags[tag][0] 
                                + '.' + gpsTags[tag][1] 
                                + '.' + gpsTags[tag][2] 
                                + '.' + gpsTags[tag][3];
                            break;
                    }
                    tags[tag] = gpsTags[tag];
                }
            }
        
            return tags;
        }
        
        this.getData = function(img, callback) {
            if (!img.complete) return false;
            if (!imageHasData(img)) {
                getImageData(img, callback);
            } else {
                if (callback) callback();
            }
            return true;
        }
        
        this.getTag = function(img, tag) {
            if (!imageHasData(img)) return;
            return img.exifdata[tag];
        }
        
        this.getAllTags = function(img) {
            if (!imageHasData(img)) return {};
            var data = img.exifdata;
            var tags = {};
            for (var a in data) {
                if (data.hasOwnProperty(a)) {
                    tags[a] = data[a];
                }
            }
            return tags;
        }
        
        this.pretty = function(img) {
            if (!imageHasData(img)) return '';
            var data = img.exifdata;
            var pretty = '';
            for (var a in data) {
                if (data.hasOwnProperty(a)) {
                    if (typeof data[a] == 'object') {
                        pretty += a + ': [' + data[a].length + ' values]\r\n';
                    } else {
                        pretty += a + ': ' + data[a] + '\r\n';
                    }
                }
            }
            return pretty;
        }
        
        this.readFromBinaryFile = function(fileReader) {
            return findEXIFinJPEG(fileReader);
        }
    };
    
    readEXIF.call(_exif_);
})(EXIF);
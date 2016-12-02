function renderImage(data) {
  var c = document.getElementById("floppy");
  var ctx = c.getContext("2d");
  var imgData = ctx.createImageData(100, 100);

  var i;
  for (i = 0; i < imgData.data.length; i += 4) {
    imgData.data[i + 0] = i % 255;
    imgData.data[i + 1] = 0;
    imgData.data[i + 2] = i % 255;
    imgData.data[i + 3] = 255;
  }

  ctx.putImageData(imgData, 10, 10);
}

renderImage();

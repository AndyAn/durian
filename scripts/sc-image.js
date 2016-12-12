console.clear();

function renderImage(data) {
  var c = document.getElementById("floppy");
  c.src = data;
}

var getTextStream = () => {
  return document.getElementById('editor').value;
  //return cell.encoding.utf8.encode(code);
};

function generateImage() {
  var r = cell.encoding.imgCode.encode(getTextStream());
  if (r.error.length == 0) {
    renderImage(r.dataURL);
    document.getElementById('downloadlink').innerHTML = `<a download="newImage.png" href="${r.dataURL}">download</a>`;
    
    cell.encoding.imgCode.decode(r.dataURL, (data) => {
      if (data.error.length == 0) {
        // console.log(data.code);
      }
    });
  }
}

(() => {
  var btn = document.createElement('button');
  btn.onclick = () => {
    generateImage();
  };
  btn.innerHTML = 'Generate Image';
  document.getElementById('toolbar').append(btn);
})();
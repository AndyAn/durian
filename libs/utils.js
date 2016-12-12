var cell = cell || {};

cell.utils = cell.utils || {};

// print helper
((_e_) => {
  var printing = function () {
    this.byteArray = function (data) {
    	var result = [];
    	for (var i = 0, n = data.length; i < n; i++) {
    		result.push(`0${data[i].toString(16)}`.slice(-2));
    	}
    	console.log(`\n${result.join(' ')}`);
    };
  };
  
  _e_.print = {};
  printing.call(_e_.print);
})(cell.utils);
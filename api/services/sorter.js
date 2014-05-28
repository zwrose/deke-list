module.exports = {

//   Field must be a string!!
	sortASCbyKey: function(array, key) {
    return array.sort(function(a, b) {
      var x = a[key]; var y = b[key];
      if(typeof(x) === 'string'){
        x = x.toUpperCase();
      }
      if(typeof(y) === 'string'){
        y = y.toUpperCase();
      }
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
	},
	sortDESCbyKey: function(array, key) {
    return array.sort(function(a, b) {
      var x = a[key]; var y = b[key];
      if(typeof(x) === 'string'){
        x = x.toUpperCase();
      }
      if(typeof(y) === 'string'){
        y = y.toUpperCase();
      }
      return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
	},
    sortASCbyGrad: function(array) {
    return array.sort(function(a, b) {
        if(a.CUSTOMFIELDS[1]){
            var x = a.CUSTOMFIELDS[1].FIELD_VALUE; 
        } else {
            var x = -1;
        }
        if(b.CUSTOMFIELDS[1]){
            var y = b.CUSTOMFIELDS[1].FIELD_VALUE; 
        } else {
            var y = -1;
        }
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
    },
    sortDESCbyGrad: function(array) {
    return array.sort(function(a, b) {
        if(a.CUSTOMFIELDS[1]){
            var x = a.CUSTOMFIELDS[1].FIELD_VALUE; 
        } else {
            var x = -1;
        }
        if(b.CUSTOMFIELDS[1]){
            var y = b.CUSTOMFIELDS[1].FIELD_VALUE; 
        } else {
            var y = -1;
        }
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
    },
    sortASCbyCity: function(array) {
    return array.sort(function(a, b) {
        if(a.ADDRESSES[0]){
            var x = a.ADDRESSES[0].CITY[0]; 
        } else {
            var x = '';
        }
        if(b.ADDRESSES[0]){
            var y = b.ADDRESSES[0].CITY[0]; 
        } else {
            var y = '';
        }
        console.log('x is ' + x);
        console.log('y is ' + y);
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
    },
    sortDESCbyCity: function(array) {
    return array.sort(function(a, b) {
        if(a.ADDRESSES[0]){
            var x = a.ADDRESSES[0].CITY[0]; 
        } else {
            var x = '';
        }
        if(b.ADDRESSES[0]){
            var y = b.ADDRESSES[0].CITY[0]; 
        } else {
            var y = '';
        }
        console.log('x is ' + x);
        console.log('y is ' + y);
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
    },
    sortASCbyState: function(array) {
    return array.sort(function(a, b) {
        if(a.ADDRESSES[0] && a.ADDRESSES[0].STATE !== null){
            var x = a.ADDRESSES[0].STATE.slice(0,2); 
        } else {
            var x = '';
        }
        if(b.ADDRESSES[0] && b.ADDRESSES[0].STATE !== null){
            var y = b.ADDRESSES[0].STATE.slice(0,2); 
        } else {
            var y = '';
        }
        console.log('x is ' + x);
        console.log('y is ' + y);
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
    },
    sortDESCbyState: function(array) {
    return array.sort(function(a, b) {
        if(a.ADDRESSES[0] && a.ADDRESSES[0].STATE !== null){
            var x = a.ADDRESSES[0].STATE.slice(0,2); 
        } else {
            var x = '';
        }
        if(b.ADDRESSES[0] && b.ADDRESSES[0].STATE !== null){
            var y = b.ADDRESSES[0].STATE.slice(0,2); 
        } else {
            var y = '';
        }
        console.log('x is ' + x);
        console.log('y is ' + y);
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
    },
}
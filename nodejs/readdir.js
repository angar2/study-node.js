var testFolder = './data';
var fs = require('fs');
 
fs.readdir(testFolder, function(err, filelist){
  console.log(filelist);
})
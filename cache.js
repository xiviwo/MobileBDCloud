
module.exports = Cache
var Path = require('path')
  , fs = require('fs')
  , crypto = require('crypto')
  , mkdirp = require('mkdirp'),
  	async = require("async"),
  	debug = require('debug')('cache')


function Cache(opts) {
	if (!this || this === global) return new Cache(opts)

	if (typeof opts == 'string') opts = { path: opts }
	if (typeof opts.path != 'string') throw new TypeError('path must be a string')

	this.path = opts.path + ''
}

Cache.prototype.resPath = function(hash) { return Path.join(__dirname,this.path, 'res', hash.slice(0, 2), hash) }

Cache.prototype.bodyPath = function(hash) { return Path.join(__dirname,this.path, 'body', hash.slice(0, 2), hash) }

Cache.prototype.createHash = function(url) { return crypto.createHash('sha1').update(url).digest('hex') }

var parseDate = function(data,callback){


}
var response = {

	headers : "",
	body : "",
	setheaders : function(data) { this.headers = data },
	setbody : function(data) { this.body = data }
}

Cache.prototype.getFile = function(url,callback){

	var hash = this.createHash(url)
	,resPath = this.resPath(hash)
	,bodyPath = this.bodyPath(hash)
	debug(resPath)
	debug(bodyPath)
	async.series({
	headers: function(callback){
	    readFile(resPath,function(data){
	    	callback(null,data)
	    })
	   	
	    
	},
	body : function(callback){
		readFile(bodyPath,function(data){
			callback(null,data)
		})
		
	}
	},
	function(err, results) {
	// results is now equals to: {one: 1, two: 2}
	if(err) throw new Error('Error:' + err + ' occurs .')
			callback(results)
	})
	
}

Cache.prototype.saveFile = function(url,res,body){

	var hash = this.createHash(url)
	,resPath = this.resPath(hash)
	,bodyPath = this.bodyPath(hash)

	writeFile(resPath,res)
	writeFile(bodyPath,body)
}

function writetoPath(path,obj){

	if (typeof obj == 'object') { var txt = JSON.stringify(obj); }  else  { var txt = obj ; }

  	fs.writeFile(path, txt, function(err) {
    if(err) {
        return console.log(err + " writetoPath error");
    }

    	debug("The file: " + path + " was saved!");
	})

}
function writeFile(path,txt){


	fs.exists(path, function (exists) {
		  if(!exists) 
		  {
		  		mkdirp(Path.dirname(path), function (err) {
					    if (err) console.error(err + " mkdirp error ")
					    else 
					    	{
					    		debug(path + ' create done.');
					    		writetoPath(path,txt);
					    	}
				})
		  		
		  }
		  else
		  {
		  		writetoPath(path,txt)
		  }

	})
}

function readFile(path,callback) {

	fs.exists(path, function (exists) {
	  if(!exists) throw new Error('File: ' + path + ' is not there, check server first')

	  else {

		  	fs.readFile(path, 'utf8', function (err,data) {
			
				  if (err) return console.log(err);

			     try {
			    	    
					     callback(JSON.parse(data))
					  } catch (e) {
					 	
					     callback(data)
					 }
				})
	        }
	  		
	})


}

var request = require('request')
	,Cache = require('./cache.js')
	,FileCookieStore = require('tough-cookie-filestore')
	,debug = require('debug')('cache_request')
	,fs = require('fs')
	,querystring = require('querystring')
	,url = require('url')

function createifNotExsit(path,callback){

		fs.exists(path, function (exists) {
		  if(!exists) 
		  {
		  	fs.closeSync(fs.openSync(path, 'w'))
		  	callback()
		  }
		  else
		  	{callback()}

	})
}
function isEmpty(val){

    return (typeof val == 'undefined' || !val) ? true : false
}

function getUniqueUrl(opts){
	var udict = url.parse(opts.uri,true)
	var u = udict.query
	var d = opts.form 
	var target = {}
	if ( isEmpty(u) )
		{  target = d }
	else if( isEmpty(d) ) 
		{  target = u }
	else if(isEmpty(d) && isEmpty(d) )
		{  target = {} }
	else
		{ 
			for(att in u ){ d[att] = u[att]}  
			target = d 
		}

	removelist = ['rand','time','t','logid','v','gid','dir','filename'
	,'path','size','local_ctime','local_mtime','block_list','source_path',
	'selected_idx','devuid']
	for(idx in removelist){ delete target[removelist[idx]]}

	var qs = querystring.stringify(target)
	if (!isEmpty(qs) ) { var search = "?" + qs } else { search = ''}
	udict.search = search
	debug(udict)
	link = url.format(udict)
	debug(link)
	return link

}
module.exports = function(opts,path,dry,callback){

	var cache = new Cache(path)

	if (dry == true) 
	{
		
		return cache.getFile(getUniqueUrl(opts),callback)
	}


	else
	{
		var jarfile = './cookies.json'
		createifNotExsit(jarfile,function(){

			var j = request.jar(new FileCookieStore(jarfile))
			//request = request.defaults({ jar : j })
			opts.jar = j 
			debug(opts)
			request(opts, function(error, response, body) {
				if (error) {
				    return console.error('Url request failed:', error)
				 }
				 else
				 {
				 	cache.saveFile(getUniqueUrl(opts),response.headers,body)

					callback({ headers: response.headers, body: body })
				 }

			})

		})

	}
		



}
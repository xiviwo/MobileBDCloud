var config = {};

var b = new Buffer('test', 'base64')
var c = new Buffer('test', 'base64')
config.userName = 'username';
config.password = b.toString() ;
config.agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:38.0) Gecko/20100101 Firefox/38.0";
config.rsa = "B3C61EBBA4659C4CE3639287EE871F1F48F7930EA977991C7AFE3CC442FEA49643212E7D570C853F368065CC57A2014666DA8AE7D493FD47D171C0D894EEE3ED7F99F6798B7FFD7B5873227038AD23E3197631A8CB642213B9F27D4901AB0D92BFA27542AE890855396ED92775255C977F5C302F1E7ED4B1E369C12CB6B1822F";
config.bdid = 'user@baidu.com'
config.bdpw = c.toString() 
config.dry = false
config.cachepath ='xml'
config.DEVUID = '825651220575768'
config.cuid = '02EBA105673EC7EEBD1391FA8836AC4A%257C825651220575768'
config.cloudspath = "/west/"
config.sourcedir = "/New/"
config.drylogin = true

module.exports = config;

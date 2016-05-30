
var request = require("request");
//require('request-debug')(request);
//request.debug = true;
var cheerio = require("cheerio");
var config = require("./config.js");
var reqcache = require("./cache_request.js");
var debug = require('debug')('bdmb');
var crypto = require('crypto');
var path = require('path'); 
var fs = require('fs'); 
var async = require('async');
var Url = require('url');
var clean = require("./cleanTorrent.js");
var http = require("http");

function BarrettMu(a) {
	this.modulus = biCopy(a);
	this.k = biHighIndex(this.modulus) + 1;
	var b = new BigInt();
	b.digits[2 * this.k] = 1;
	this.mu = biDivide(b, this.modulus);
	this.bkplus1 = new BigInt();
	this.bkplus1.digits[this.k + 1] = 1;
	this.modulo = BarrettMu_modulo;
	this.multiplyMod = BarrettMu_multiplyMod;
	this.powMod = BarrettMu_powMod
}
function BarrettMu_modulo(h) {
	var g = biDivideByRadixPower(h, this.k - 1);
	var e = biMultiply(g, this.mu);
	var d = biDivideByRadixPower(e, this.k + 1);
	var c = biModuloByRadixPower(h, this.k + 1);
	var k = biMultiply(d, this.modulus);
	var b = biModuloByRadixPower(k, this.k + 1);
	var a = biSubtract(c, b);
	if (a.isNeg) {
		a = biAdd(a, this.bkplus1)
	}
	var f = biCompare(a, this.modulus) >= 0;
	while (f) {
		a = biSubtract(a, this.modulus);
		f = biCompare(a, this.modulus) >= 0
	}
	return a
}
function BarrettMu_multiplyMod(a, c) {
	var b = biMultiply(a, c);
	return this.modulo(b)
}
function BarrettMu_powMod(c, f) {
	var b = new BigInt();
	b.digits[0] = 1;
	var d = c;
	var e = f;
	while (true) {
		if ((e.digits[0] & 1) != 0) {
			b = this.multiplyMod(b, d)
		}
		e = biShiftRight(e, 1);
		if (e.digits[0] == 0 && biHighIndex(e) == 0) {
			break
		}
		d = this.multiplyMod(d, d)
	}
	return b
}
var biRadixBase = 2;
var biRadixBits = 16;
var bitsPerDigit = biRadixBits;
var biRadix = 1 << 16;
var biHalfRadix = biRadix >>> 1;
var biRadixSquared = biRadix * biRadix;
var maxDigitVal = biRadix - 1;
var maxInteger = 9999999999999998;
var maxDigits;
var ZERO_ARRAY;
var bigZero, bigOne;

function setMaxDigits(b) {
	maxDigits = b;
	ZERO_ARRAY = new Array(maxDigits);
	for (var a = 0; a < ZERO_ARRAY.length; a++) {
		ZERO_ARRAY[a] = 0
	}
	bigZero = new BigInt();
	bigOne = new BigInt();
	bigOne.digits[0] = 1
}
setMaxDigits(20);
var dpl10 = 15;
var lr10 = biFromNumber(1000000000000000);

function BigInt(a) {
	if (typeof a == "boolean" && a == true) {
		this.digits = null
	} else {
		this.digits = ZERO_ARRAY.slice(0)
	}
	this.isNeg = false
}
function biFromDecimal(e) {
	var d = e.charAt(0) == "-";
	var c = d ? 1 : 0;
	var a;
	while (c < e.length && e.charAt(c) == "0") {
		++c
	}
	if (c == e.length) {
		a = new BigInt()
	} else {
		var b = e.length - c;
		var f = b % dpl10;
		if (f == 0) {
			f = dpl10
		}
		a = biFromNumber(Number(e.substr(c, f)));
		c += f;
		while (c < e.length) {
			a = biAdd(biMultiply(a, lr10), biFromNumber(Number(e.substr(c, dpl10))));
			c += dpl10
		}
		a.isNeg = d
	}
	return a
}
function biCopy(b) {
	var a = new BigInt(true);
	a.digits = b.digits.slice(0);
	a.isNeg = b.isNeg;
	return a
}
function biFromNumber(c) {
	var a = new BigInt();
	a.isNeg = c < 0;
	c = Math.abs(c);
	var b = 0;
	while (c > 0) {
		a.digits[b++] = c & maxDigitVal;
		c >>= biRadixBits
	}
	return a
}
function reverseStr(c) {
	var a = "";
	for (var b = c.length - 1; b > -1; --b) {
		a += c.charAt(b)
	}
	return a
}
var hexatrigesimalToChar = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z");

function biToString(d, f) {
	var c = new BigInt();
	c.digits[0] = f;
	var e = biDivideModulo(d, c);
	var a = hexatrigesimalToChar[e[1].digits[0]];
	while (biCompare(e[0], bigZero) == 1) {
		e = biDivideModulo(e[0], c);
		digit = e[1].digits[0];
		a += hexatrigesimalToChar[e[1].digits[0]]
	}
	return (d.isNeg ? "-" : "") + reverseStr(a)
}
function biToDecimal(d) {
	var c = new BigInt();
	c.digits[0] = 10;
	var e = biDivideModulo(d, c);
	var a = String(e[1].digits[0]);
	while (biCompare(e[0], bigZero) == 1) {
		e = biDivideModulo(e[0], c);
		a += String(e[1].digits[0])
	}
	return (d.isNeg ? "-" : "") + reverseStr(a)
}
var hexToChar = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");

function digitToHex(c) {
	var b = 15;
	var a = "";
	for (i = 0; i < 4; ++i) {
		a += hexToChar[c & b];
		c >>>= 4
	}
	return reverseStr(a)
}
function biToHex(b) {
	var a = "";
	var d = biHighIndex(b);
	for (var c = biHighIndex(b); c > -1; --c) {
		a += digitToHex(b.digits[c])
	}
	return a
}
function charToHex(k) {
	var d = 48;
	var b = d + 9;
	var e = 97;
	var h = e + 25;
	var g = 65;
	var f = 65 + 25;
	var a;
	if (k >= d && k <= b) {
		a = k - d
	} else {
		if (k >= g && k <= f) {
			a = 10 + k - g
		} else {
			if (k >= e && k <= h) {
				a = 10 + k - e
			} else {
				a = 0
			}
		}
	}
	return a
}
function hexToDigit(d) {
	var b = 0;
	var a = Math.min(d.length, 4);
	for (var c = 0; c < a; ++c) {
		b <<= 4;
		b |= charToHex(d.charCodeAt(c))
	}
	return b
}
function biFromHex(e) {
	var b = new BigInt();
	var a = e.length;
	for (var d = a, c = 0; d > 0; d -= 4, ++c) {
		b.digits[c] = hexToDigit(e.substr(Math.max(d - 4, 0), Math.min(d, 4)))
	}
	return b
}
function biFromString(l, k) {
	var a = l.charAt(0) == "-";
	var e = a ? 1 : 0;
	var m = new BigInt();
	var b = new BigInt();
	b.digits[0] = 1;
	for (var d = l.length - 1; d >= e; d--) {
		var f = l.charCodeAt(d);
		var g = charToHex(f);
		var h = biMultiplyDigit(b, g);
		m = biAdd(m, h);
		b = biMultiplyDigit(b, k)
	}
	m.isNeg = a;
	return m
}
function biDump(a) {
	return (a.isNeg ? "-" : "") + a.digits.join(" ")
}
function biAdd(b, g) {
	var a;
	if (b.isNeg != g.isNeg) {
		g.isNeg = !g.isNeg;
		a = biSubtract(b, g);
		g.isNeg = !g.isNeg
	} else {
		a = new BigInt();
		var f = 0;
		var e;
		for (var d = 0; d < b.digits.length; ++d) {
			e = b.digits[d] + g.digits[d] + f;
			a.digits[d] = e & 65535;
			f = Number(e >= biRadix)
		}
		a.isNeg = b.isNeg
	}
	return a
}
function biSubtract(b, g) {
	var a;
	if (b.isNeg != g.isNeg) {
		g.isNeg = !g.isNeg;
		a = biAdd(b, g);
		g.isNeg = !g.isNeg
	} else {
		a = new BigInt();
		var f, e;
		e = 0;
		for (var d = 0; d < b.digits.length; ++d) {
			f = b.digits[d] - g.digits[d] + e;
			a.digits[d] = f & 65535;
			if (a.digits[d] < 0) {
				a.digits[d] += biRadix
			}
			e = 0 - Number(f < 0)
		}
		if (e == -1) {
			e = 0;
			for (var d = 0; d < b.digits.length; ++d) {
				f = 0 - a.digits[d] + e;
				a.digits[d] = f & 65535;
				if (a.digits[d] < 0) {
					a.digits[d] += biRadix
				}
				e = 0 - Number(f < 0)
			}
			a.isNeg = !b.isNeg
		} else {
			a.isNeg = b.isNeg
		}
	}
	return a
}
function biHighIndex(b) {
	var a = b.digits.length - 1;
	while (a > 0 && b.digits[a] == 0) {
		--a
	}
	return a
}
function biNumBits(c) {
	var f = biHighIndex(c);
	var e = c.digits[f];
	var b = (f + 1) * bitsPerDigit;
	var a;
	for (a = b; a > b - bitsPerDigit; --a) {
		if ((e & 32768) != 0) {
			break
		}
		e <<= 1
	}
	return a
}
function biMultiply(h, g) {
	var o = new BigInt();
	var f;
	var b = biHighIndex(h);
	var m = biHighIndex(g);
	var l, a, d;
	for (var e = 0; e <= m; ++e) {
		f = 0;
		d = e;
		for (j = 0; j <= b; ++j, ++d) {
			a = o.digits[d] + h.digits[j] * g.digits[e] + f;
			o.digits[d] = a & maxDigitVal;
			f = a >>> biRadixBits
		}
		o.digits[e + b + 1] = f
	}
	o.isNeg = h.isNeg != g.isNeg;
	return o
}
function biMultiplyDigit(a, g) {
	var f, e, d;
	result = new BigInt();
	f = biHighIndex(a);
	e = 0;
	for (var b = 0; b <= f; ++b) {
		d = result.digits[b] + a.digits[b] * g + e;
		result.digits[b] = d & maxDigitVal;
		e = d >>> biRadixBits
	}
	result.digits[1 + f] = e;
	return result
}
function arrayCopy(e, h, c, g, f) {
	var a = Math.min(h + f, e.length);
	for (var d = h, b = g; d < a; ++d, ++b) {
		c[b] = e[d]
	}
}
var highBitMasks = new Array(0, 32768, 49152, 57344, 61440, 63488, 64512, 65024, 65280, 65408, 65472, 65504, 65520, 65528, 65532, 65534, 65535);

function biShiftLeft(b, h) {
	var d = Math.floor(h / bitsPerDigit);
	var a = new BigInt();
	arrayCopy(b.digits, 0, a.digits, d, a.digits.length - d);
	var g = h % bitsPerDigit;
	var c = bitsPerDigit - g;
	for (var e = a.digits.length - 1, f = e - 1; e > 0; --e, --f) {
		a.digits[e] = ((a.digits[e] << g) & maxDigitVal) | ((a.digits[f] & highBitMasks[g]) >>> (c))
	}
	a.digits[0] = ((a.digits[e] << g) & maxDigitVal);
	a.isNeg = b.isNeg;
	return a
}
var lowBitMasks = new Array(0, 1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383, 32767, 65535);

function biShiftRight(b, h) {
	var c = Math.floor(h / bitsPerDigit);
	var a = new BigInt();
	arrayCopy(b.digits, c, a.digits, 0, b.digits.length - c);
	var f = h % bitsPerDigit;
	var g = bitsPerDigit - f;
	for (var d = 0, e = d + 1; d < a.digits.length - 1; ++d, ++e) {
		a.digits[d] = (a.digits[d] >>> f) | ((a.digits[e] & lowBitMasks[f]) << g)
	}
	a.digits[a.digits.length - 1] >>>= f;
	a.isNeg = b.isNeg;
	return a
}
function biMultiplyByRadixPower(b, c) {
	var a = new BigInt();
	arrayCopy(b.digits, 0, a.digits, c, a.digits.length - c);
	return a
}
function biDivideByRadixPower(b, c) {
	var a = new BigInt();
	arrayCopy(b.digits, c, a.digits, 0, a.digits.length - c);
	return a
}
function biModuloByRadixPower(b, c) {
	var a = new BigInt();
	arrayCopy(b.digits, 0, a.digits, 0, c);
	return a
}
function biCompare(a, c) {
	if (a.isNeg != c.isNeg) {
		return 1 - 2 * Number(a.isNeg)
	}
	for (var b = a.digits.length - 1; b >= 0; --b) {
		if (a.digits[b] != c.digits[b]) {
			if (a.isNeg) {
				return 1 - 2 * Number(a.digits[b] > c.digits[b])
			} else {
				return 1 - 2 * Number(a.digits[b] < c.digits[b])
			}
		}
	}
	return 0
}
function biDivideModulo(g, f) {
	var a = biNumBits(g);
	var e = biNumBits(f);
	var d = f.isNeg;
	var o, m;
	if (a < e) {
		if (g.isNeg) {
			o = biCopy(bigOne);
			o.isNeg = !f.isNeg;
			g.isNeg = false;
			f.isNeg = false;
			m = biSubtract(f, g);
			g.isNeg = true;
			f.isNeg = d
		} else {
			o = new BigInt();
			m = biCopy(g)
		}
		return new Array(o, m)
	}
	o = new BigInt();
	m = g;
	var k = Math.ceil(e / bitsPerDigit) - 1;
	var h = 0;
	while (f.digits[k] < biHalfRadix) {
		f = biShiftLeft(f, 1);
		++h;
		++e;
		k = Math.ceil(e / bitsPerDigit) - 1
	}
	m = biShiftLeft(m, h);
	a += h;
	var u = Math.ceil(a / bitsPerDigit) - 1;
	var B = biMultiplyByRadixPower(f, u - k);
	while (biCompare(m, B) != -1) {
		++o.digits[u - k];
		m = biSubtract(m, B)
	}
	for (var z = u; z > k; --z) {
		var l = (z >= m.digits.length) ? 0 : m.digits[z];
		var A = (z - 1 >= m.digits.length) ? 0 : m.digits[z - 1];
		var w = (z - 2 >= m.digits.length) ? 0 : m.digits[z - 2];
		var v = (k >= f.digits.length) ? 0 : f.digits[k];
		var c = (k - 1 >= f.digits.length) ? 0 : f.digits[k - 1];
		if (l == v) {
			o.digits[z - k - 1] = maxDigitVal
		} else {
			o.digits[z - k - 1] = Math.floor((l * biRadix + A) / v)
		}
		var s = o.digits[z - k - 1] * ((v * biRadix) + c);
		var p = (l * biRadixSquared) + ((A * biRadix) + w);
		while (s > p) {
			--o.digits[z - k - 1];
			s = o.digits[z - k - 1] * ((v * biRadix) | c);
			p = (l * biRadix * biRadix) + ((A * biRadix) + w)
		}
		B = biMultiplyByRadixPower(f, z - k - 1);
		m = biSubtract(m, biMultiplyDigit(B, o.digits[z - k - 1]));
		if (m.isNeg) {
			m = biAdd(m, B);
			--o.digits[z - k - 1]
		}
	}
	m = biShiftRight(m, h);
	o.isNeg = g.isNeg != d;
	if (g.isNeg) {
		if (d) {
			o = biAdd(o, bigOne)
		} else {
			o = biSubtract(o, bigOne)
		}
		f = biShiftRight(f, h);
		m = biSubtract(f, m)
	}
	if (m.digits[0] == 0 && biHighIndex(m) == 0) {
		m.isNeg = false
	}
	return new Array(o, m)
}
function biDivide(a, b) {
	return biDivideModulo(a, b)[0]
}
function biModulo(a, b) {
	return biDivideModulo(a, b)[1]
}
function biMultiplyMod(b, c, a) {
	return biModulo(biMultiply(b, c), a)
}
function biPow(c, e) {
	var b = bigOne;
	var d = c;
	while (true) {
		if ((e & 1) != 0) {
			b = biMultiply(b, d)
		}
		e >>= 1;
		if (e == 0) {
			break
		}
		d = biMultiply(d, d)
	}
	return b
}
function biPowMod(d, g, c) {
	var b = bigOne;
	var e = d;
	var f = g;
	while (true) {
		if ((f.digits[0] & 1) != 0) {
			b = biMultiplyMod(b, e, c)
		}
		f = biShiftRight(f, 1);
		if (f.digits[0] == 0 && biHighIndex(f) == 0) {
			break
		}
		e = biMultiplyMod(e, e, c)
	}
	return b
}
function RSAKeyPair(b, c, a) {
	this.e = biFromHex(b);
	this.d = biFromHex(c);
	this.m = biFromHex(a);
	this.chunkSize = 2 * biHighIndex(this.m);
	this.radix = 16;
	this.barrett = new BarrettMu(this.m)
}
function twoDigit(a) {
	return (a < 10 ? "0" : "") + String(a)
}
function encryptedString(l, o) {
	var h = new Array();
	var b = o.length;
	var f = 0;
	while (f < b) {
		h[f] = o.charCodeAt(f);
		f++
	}
	while (h.length % l.chunkSize != 0) {
		h[f++] = 0
	}
	var g = h.length;
	var p = "";
	var e, d, c;
	for (f = 0; f < g; f += l.chunkSize) {
		c = new BigInt();
		e = 0;
		for (d = f; d < f + l.chunkSize; ++e) {
			c.digits[e] = h[d++];
			c.digits[e] += h[d++] << 8
		}
		var n = l.barrett.powMod(c, l.e);
		var m = l.radix == 16 ? biToHex(n) : biToString(n, l.radix);
		p += m + " "
	}
	return p.substring(0, p.length - 1)
}
var guideRandom = function() {
		return "xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(f) {
			var e = Math.random() * 16 | 0,
				d = f == "x" ? e : (e & 3 | 8);
			return d.toString(16)
		}).toUpperCase()
	}
var tt = function(){
	var time = new Date().getTime()
	return time.toString()
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

var logid = function(time){
	var logstr = time + ',fe80::42c6:2aff:fe19:dbc8%wlan0,' + randomInt(0,999999)
	debug(logstr)
	var logbuf = new Buffer( logstr)
	return logbuf.toString('base64')
}
function sha1(str){
	shasum = crypto.createHash('sha1');
	shasum.update(str);
	return shasum.digest('hex');
}
var rand = function(time,bduss,uid){

	var uinfo = 'VI98LcuBwes4SVKTsN0HS59uyYLOHOMAFK6PkXxwA/M='
	var sk = 'ebrcUYiuxaZv2XGu7KIYKxUrqfnOfpDF'
	debug(sha1(bduss))
	debug
	return sha1(sha1(bduss) + uid + sk + time.slice(0,-3) + config.DEVUID )

}

function getFilesizeInBytes(filename) {
 var stats = fs.statSync(filename)
 var fileSizeInBytes = stats["size"]
 return fileSizeInBytes
}

var BDMB = function() {
	//if (!this || this === global) return new BDMB()
	this.bduss = ''
	this.uid = ''
	this.bdstoken = ''

}


BDMB.prototype.index = function (callback){
debug('----------------------index --------------------------------') 
		var self = this

		var url = "http://wappass.baidu.com/passport/login?\
clientfrom=native&tpl=netdisk&login_share_strategy=choice\
&client=android&adapter=3&t=1461183700873&act=implicit\
&loginLink=0&smsLoginLink=0&lPFastRegLink=0&lPlayout=0"

		var header =  {
		    "Host":"wappass.baidu.com",
		    "User-Agent":config.agent,
		    "Connection":"keep-alive"
			}
		var opts = {
		   uri: url ,
		   headers: header,
		}
		//me.referer = opts.uri
	    reqcache(opts ,config.cachepath,config.drylogin,function(data){
	    	callback(null,data)
	    })
		
	}


BDMB.prototype.login = function(data,callback){ 
	debug('----------------------login --------------------------------')
		var self = this
		setMaxDigits(131)
		
		var m = new RSAKeyPair("10001","",config.rsa)
		var es = encryptedString(m,config.bdpw)

		debug('es:' + es)
		function getpublicData(body){
			var $ = cheerio.load(body)

			$("script").each(function(){
				var script = $(this).text()
				if(script.indexOf("apiDomain") > -1)
					self.scriptjson = $(this).text()
			},self)
		}

		// getpublicData(data.body)
		// debug('scriptjson:' + self.scriptjson)
		// var publicData = JSON.parse(self.scriptjson.match(/{[^}]*}/g)[0])
		// debug('publicData: ' + JSON.stringify(publicData))



		var header = { 
				'Content-Type':'application/x-www-form-urlencoded',
				'Origin':'http://wappass.baidu.com',
				"Host":"wappass.baidu.com",
			    "User-Agent":config.agent,
			    "Connection":"keep-alive"
				//'Referer': self.referer,
				}
		var data =  { 
				'username':config.bdid,
				'code':'',
				'password':es,
				'verifycode':'',
				'clientfrom':'native',
				'tpl':'netdisk',
				'login_share_strategy':'choice',
				'client':'android',
				'adapter':'3',
				't':tt(),
				'act':'implicit',
				'loginLink':'0',
				'smsLoginLink':'0',
				'lPFastRegLink':'0',
				'lPlayout':'0',
				'subpro':'netdiskandroid',
				'action':'login',
				'loginmerge':'1',
				'isphone':'0',
				'gid':guideRandom(),
				'countrycode':'',
				'logLoginType':'sdk_login'
				}
		var opts = {
		   uri: 'http://wappass.baidu.com/wp/api/login?v=' + tt(),
		   followAllRedirects: true,
		   method: 'POST',
		   headers: header,
		   form: data,
		}
		debug(opts)

		function getAuthData(data){
			var $ = cheerio.load(data.xml)

			$("bduss").each(function(){
				//var bduss = $(this).text()
				self.bduss = $(this).text()
				debug(self.bduss)
			},self)
			$("uid").each(function(){
				//var bduss = $(this).text()
				
				self.uid = $(this).text()
				debug(self.uid)
			},self)
			self.bdstoken = data.u.match(/ssid=([^=.]*)\./)[1]

		}
		
	    reqcache(opts ,config.cachepath,config.drylogin,function(data){
	    	var loginjson = JSON.parse(data.body)
			//debug(loginjson)
			var logindata = loginjson.data
			debug(logindata)
			getAuthData(logindata)
			//debug(self)
			config.drylogin = true
	    	callback(null)
	    })

	}

BDMB.prototype.api_list = function(data,callback){
		var self = this
		
		debug(rand(tt(),me.bduss,me.uid))
	}

BDMB.prototype.locateupload = function(callback){	
		debug('----------------------locateupload--------------------------------')	
		var self = this
		var tm = tt()	
		var url = "http://pcs.baidu.com/rest/2.0/pcs/file?method=locateupload&app_id=250528&devuid=" + config.DEVUID + "&devuid=" + config.DEVUID + "&clienttype=1&channel=android_5.1_m2_bd-netdisk_1523a&version=7.11.5&logid=" + logid(tm) + "&rand=" + rand(tm,self.bduss,self.uid) +  "&time=" + tm +"&cuid=" + config.cuid + "&network_type=wifi&bdstoken=" + self.bdstoken




		var header = { 
				"Host":"pcs.baidu.com",
			    "User-Agent":"netdisk;7.11.5;m2;android-android;5.1",
			    "Connection":"keep-alive"
				}
		var opts = {
		   uri: url,	   
		   followAllRedirects: true,
		   method: 'GET',
		   headers: header,
		  //jar: true
		}
		debug(opts)
		reqcache(opts ,config.cachepath,config.dry,function(data){
			self.host = JSON.parse(data.body).host
			debug(data.body)
			debug(typeof data.body)
			debug(self.host)
			callback(null,self.host)
		})


	}

BDMB.prototype.upload = function(filepath,host,callback){
		if(!host) {console.log("locateUpload failed, skip ");callback(true);return}
		debug('----------------------upload--------------------------------')
		var self = this
		debug(filepath)
		debug(host)
		var filename = path.basename(filepath)
		var dir = config.cloudspath + filename
		var encdir = encodeURIComponent(dir)
		var size = getFilesizeInBytes(filepath)
		//debug(me)
		var tm = tt()
		var header = { 
				"Host":host,
			    "User-Agent":"netdisk;7.11.5;m2;android-android;5.1",
			    "Connection":"keep-alive",
				"Content-Type": "multipart/form-data; boundary=--" + tm,
				"Content-Transfer-Encoding": "binary"
				}
		var formData = {
		  custom_file: {
		    value:  fs.createReadStream(filepath),
		    options: {
		      filename: filename + tm,
		      contentType: 'application/octet-stream'
		    }
		  }
		}
		var opts = {
			
		   uri: "http://c.pcs.baidu.com/rest/2.0/pcs/file?method=upload&type=tmpfile&dir="+ encdir + "&filename=" + filename + tm + "&app_id=250528&devuid=" + config.DEVUID + "&rand=" + rand(tm,self.bduss,self.uid) +  "&time=" + tm +"&network_type=wifi",
		   followAllRedirects: true,
		   method: 'POST',
		   headers: header,
		   formData:formData,
		}
		debug(opts)
		debug(opts.formData.custom_file)
		reqcache(opts ,config.cachepath,config.dry,function(data){
			debug(data)
			js = JSON.parse(data.body)
			debug(js)
			callback(null,js.md5,filename,size)

		})

		
	}

BDMB.prototype.create = function(block_list,filename,size,callback){
		sleep(500)
		if(!block_list) {console.log("Upload failed, skip ");callback(true);return;}
	    debug('----------------------create--------------------------------')
		var self = this
		var tm = tt()
		var header = { 
				"Host":"pan.baidu.com",
			    "User-Agent":"netdisk;7.11.5;m2;android-android;5.1",
			    "Connection":"keep-alive"
				//'Referer': self.referer,
				}

		var data = {
			'path': config.cloudspath + filename,
			'size': size,
			'isdir': 0,
			'local_ctime':tm,
			'local_mtime':tm,
			'block_list':'["'+block_list+'"]',
			'method':'post',

		}
		var opts = {
			
		   uri: "http://pan.baidu.com/api/create?clienttype=1&devuid=" + config.DEVUID + "&channel=android_5.1_m2_bd-netdisk_1523a&version=7.11.5&logid=" + logid(tm) + "&rand=" + rand(tm,self.bduss,self.uid) +  "&time=" + tm +"&rtype=2&network_type=wifi&cuid=" + config.cuid ,
		   followAllRedirects: true,
		   method: 'POST',
		   headers: header,
		   form: data,
		}
		debug(opts)
		reqcache(opts ,config.cachepath,config.dry,function(data){
			debug(data.body)
			callback(null,filename)
		})


	}


BDMB.prototype.query_sinfo = function(filename,callback){
	sleep(500)
	if(!filename) {console.log("Create failed, skip ");callback(true);return}
	debug('----------------------query_sinfo--------------------------------')
		var self = this
		var tm = tt()
		var header = { 
				"Host":"pan.baidu.com",
			    "User-Agent":"netdisk;7.11.5;m2;android-android;5.1",
			    "Connection":"keep-alive"
				//'Referer': self.referer,
				}

		var data = {
			'bdstoken': self.bdstoken,
			'type':2,
			'source_path':config.cloudspath + filename,
			'app_id':250528,
			'method':'query_sinfo',

		}
		var opts = {
		   uri: "http://pan.baidu.com/rest/2.0/services/cloud_dl?clienttype=1&devuid=" + config.DEVUID + "&channel=android_5.1_m2_bd-netdisk_1523a&version=7.11.5&logid=" + logid(tm) + "&rand=" + rand(tm,self.bduss,self.uid) +  "&time=" + tm +"&rtype=2&network_type=wifi&cuid=" + config.cuid ,
		   followAllRedirects: true,
		   method: 'POST',
		   headers: header,
		   form: data,
		}
		debug(opts)
		reqcache(opts ,config.cachepath,config.dry,function(data){
			//console.log(typeof data.body)
			debug(data.body)
			if ( typeof data.body == 'string') 
			{ var body = JSON.parse(data.body) }
			else { var body = data.body }

			var tor = body.torrent_info
			if(!tor) {console.log("File not parsed, skip");callback(true);}
			else {
				var sha1 = tor.sha1
				var file_list = tor.file_info
				var idx = 0
				for( var index in file_list){ 

					if( (file_list[index].size/1024/1024) > 100 ) 
					{
						idx = index
					}


				}
				debug(sha1)
				debug(parseInt(idx)+1)
				callback(null,sha1,parseInt(idx)+1,filename)
			}

		})


	}

BDMB.prototype.add_task = function(sha1,idx,filename,callback){
	sleep(500)
	if(!sha1) {console.log("query_sinfo failed, skip ");callback(true);return;}
	debug('----------------------add_task--------------------------------')
		if(!sha1 || !idx ) {console.log("File query failed, not proceeding. ")}
		var self = this
		var tm = tt()
		var header = { 
				"Host":"pan.baidu.com",
			    "User-Agent":"netdisk;7.11.5;m2;android-android;5.1",
			    "Connection":"keep-alive"
				//'Referer': self.referer,
				}

		var data = {
			'bdstoken': self.bdstoken,
			'type':2,
			'source_path':config.cloudspath + filename,
			'save_path':'/west',
			'source_url':'',
			'rate_limit':0,
			'timeout':0,
			'callback':'',
			'selected_idx':idx,
			'app_id':250528,
			'method':'add_task',
			'file_sha1':sha1,


		}
		var opts = {
		   uri: "http://pan.baidu.com/rest/2.0/services/cloud_dl?clienttype=1&devuid=" + config.DEVUID + "&channel=android_5.1_m2_bd-netdisk_1523a&version=7.11.5&logid=" + logid(tm) + "&rand=" + rand(tm,self.bduss,self.uid) +  "&time=" + tm +"&rtype=2&network_type=wifi&cuid=" + config.cuid ,
		   followAllRedirects: true,
		   method: 'POST',
		   headers: header,
		   form: data,
		}
		debug(opts)
		reqcache(opts ,config.cachepath,config.dry,function(data){
			debug(data.body)
			taskjson = JSON.parse(data.body)
			var task_id = taskjson.task_id
			var rapid_download = taskjson.rapid_download
			debug(task_id)
			debug(rapid_download)
			callback(null,task_id,rapid_download)
		})


	}


BDMB.prototype.query_task = function(task_id,callback){
	sleep(1000)
	if(!task_id) {console.log("add_task failed, skip ");callback(true);return;}
	debug('----------------------query_task --------------------------------')
		debug(task_id)
		var self = this
		var tm = tt()
		var header = { 
				"Host":"pan.baidu.com",
			    "User-Agent":"netdisk;7.11.5;m2;android-android;5.1",
			    "Connection":"keep-alive"
				//'Referer': self.referer,
				}
		var data = {
			'bdstoken': self.bdstoken,
			'op_type':0,
			'task_ids':task_id,
			'app_id':250528,
			'method':'query_task',


		}
		var opts = {
		   uri: "http://pan.baidu.com/rest/2.0/services/cloud_dl?clienttype=1&devuid=" + config.DEVUID + "&channel=android_5.1_m2_bd-netdisk_1523a&version=7.11.5&logid=" + logid(tm) + "&rand=" + rand(tm,self.bduss,self.uid) +  "&time=" + tm +"&rtype=2&network_type=wifi&cuid=" + config.cuid ,
		   followAllRedirects: true,
		   method: 'POST',
		   headers: header,
		   form: data,
		}
		debug(opts)
		reqcache(opts ,config.cachepath,config.dry,function(data){
			debug(data.body)
			debug(task_id)
			callback(null,data.body,task_id)
		})


	}

BDMB.prototype.cancel_task = function(task_id,rapid_download,callback){
	sleep(1000)
	debug('----------------------cancel_task --------------------------------')
		if(!task_id) {console.log("add_task failed, skip ");callback(true) ;return;}
		var self = this
		// taskdata = JSON.parse(data)
		// debug(taskdata.task_info)
		// var taskinfo = taskdata.task_info[task_id.toString()]
		// debug(taskinfo)
		// debug(taskinfo.finished_size)

		if (rapid_download == 1) 
			{console.log("Download in progress,not canceling."); callback(true);return;}


		var tm = tt()
		var header = { 
				"Host":"pan.baidu.com",
			    "User-Agent":"netdisk;7.11.5;m2;android-android;5.1",
			    "Connection":"keep-alive"
				//'Referer': self.referer,
				}
		var data = {
			'bdstoken': self.bdstoken,
			'task_id':task_id,
			'app_id':250528,
			'method':'cancel_task',


		}
		var opts = {

		   uri: "http://pan.baidu.com/rest/2.0/services/cloud_dl?clienttype=1&devuid=" + config.DEVUID + "&channel=android_5.1_m2_bd-netdisk_1523a&version=7.11.5&logid=" + logid(tm) + "&rand=" + rand(tm,self.bduss,self.uid) +  "&time=" + tm +"&rtype=2&network_type=wifi&cuid=" + config.cuid ,
		   followAllRedirects: true,
		   method: 'POST',
		   headers: header,
		   form: data,
		}
		debug(opts)
		reqcache(opts ,config.cachepath,config.dry,function(data){
			debug(data.body)
			callback(null,data)
		})
		
	


}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

var Tar = function(){

	this.header = function(path){
		var header = {
			"authority":"sukebei.nyaa.se",
			"method":"GET",
			"path":path,
			"scheme":"https",
			"accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
			"accept-language":"en-US,en;q=0.8",
			"upgrade-insecure-requests":"1",
			"user-agent":config.agent,
		}
		return header
	}
	this.opts = function(uri,header){

		var opts = {
		   uri: uri,
		   followAllRedirects: true,
		   method: 'GET',
		   headers: header,
		}
		return opts
	}
	this.index = function(callback){
		var uri = "https://sukebei.nyaa.se"
		var path = Url.parse(uri,true).path
		var header = this.header(path)
		var opts = this.opts(uri,header)
		debug(opts)
		reqcache(opts ,config.cachepath,config.dry,function(data){
			//debug(data.body)
			callback(null,data)
		})

	}

	this.search = function(term,page,save_path,callback){
		var uri = "https://sukebei.nyaa.se/?page=search&cats=0_0&filter=0&offset=" + page+ "&term=" + encodeURIComponent(term)
		var path = Url.parse(uri,true).path
		var header = this.header(path)
		var opts = this.opts(uri,header)
		debug(opts)
		reqcache(opts ,config.cachepath,config.dry,function(data){
			//debug(data.body)
			var $ = cheerio.load(data.body)
			var col = []
			$("td[class='tlistdownload']").each(function(){
				
				var href = $('a',this).attr('href');
				var href = "https:" + href 
				debug(href)
				//debug("Downloading..." + href)
				col.push(href)
				
			})
			//debug(col)
			callback(col,save_path)
		})
	}

	this.download = function(col,save_path,callback){
		var self = this

		var filecol = []

		async.forEachOfLimit(col,1,function (value, key,callbk) {

			var uri = value
			var query_dict = Url.parse(uri,true)
			var path = query_dict.path
			var tid = query_dict.query.tid
			var header = self.header(path)
			//pool = new http.Agent({maxSockets:1})
			var opts = {
			   uri: uri,
			   method: 'GET',
			   headers: header,
			   encoding: null,

			}
			
			debug(opts)
			var req = request.defaults({
			jar: true,                
			followAllRedirects: true ,

			})

					req.get(opts,function (error, response, body) {//).on('response', function(res) {
					//sleep(1000)
					var spath = save_path + tid + ".torrent"

					

                    fs.writeFile(spath, body, function(err) {
                            if(typeof body == 'undefined') return 
                            if(err) {
                                return console.log(err + " write error");
                            }

                            console.log("The file: " + spath + " was saved !");
                            filecol.push(spath)
                            callbk(null)//null will continue
                           })

					
				})
		},function (err) { 
						if (err) console.error(err.message)
						debug(filecol)
						callback(filecol)
					}
															    
				
		)

	}

	this.addToCloud = function(cols){

		var count = cols.length
		async.forEachOfLimit(cols, 1, function (value, key,callback) {

			console.log(count + " Tasks Left ")
			count--
			cloudadd(value,function(){
				fs.unlink(value,function(err){
					if(!err) {console.log("The file: " + value + " was removed !");}
				})
				callback()
			})

		},function (err) {
			if (err) console.error(err.message);
						    
		})

	}
			
	
}

var cloudadd = function(filepath,callback){
		var bd = new BDMB()
		async.waterfall([
		
	    bd.index.bind(bd),
	    bd.login.bind(bd),
	    bd.locateupload.bind(bd),
	    //bd.upload.bind(bd),
	    bd.upload.bind(bd).bind(null,filepath),
	    
	    bd.create.bind(bd),
	    bd.query_sinfo.bind(bd),
	    
	    bd.add_task.bind(bd),
	    //bd.query_task.bind(bd),
	    bd.cancel_task.bind(bd),

	], callback)
}

var DOWNLOAD = false
var ADDTASK = false

if(process.argv[2] == '-d') { 
	config.dry = true 
} 

else if(process.argv[2] == '-download')
{
	DOWNLOAD = true
}
else if(process.argv[2] == '-add')
{
	ADDTASK = true
}
else if(process.argv[2])
	{ var term = process.argv[2] }

if (process.argv[5] == '-l'){
	config.drylogin = false
}
if(process.argv[3]) var term = process.argv[3]
if(!term) term =''
if(process.argv[4]) var page = process.argv[4]
if(!page) page = 1
debug('process.argv' + process.argv)
debug('config.dry ' + config.dry )
debug('config.drylogin' + config.drylogin)
debug(ADDTASK)
if(!term) { console.log("No search term is specified, quit.")}
var tar = new Tar()
var save_path = path.join(__dirname,config.sourcedir)

debug(save_path)

if(DOWNLOAD)
{
	tar.search(term,page,save_path,function(href,spath){
        if (!fs.existsSync(spath)) {
            fs.mkdir(spath)
        }
		tar.download(href,spath,function(file){
			debug(file)
			//tar.addToCloud(file)
		})
	
	})
}
else if(ADDTASK)
{
	
	var filecol = fs.readdirSync(save_path)
	filecol.splice(0,1)
	for (i in filecol)
	{
		filecol[i] = save_path + filecol[i]
	}
	debug(filecol)
	tar.addToCloud(filecol)


}











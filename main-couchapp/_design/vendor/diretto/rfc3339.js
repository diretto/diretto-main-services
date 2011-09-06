/* Copyright (c) 2010 Paul GALLAGHER http://tardate.com
* Licensed under the MIT license:
* http://www.opensource.org/licenses/mit-license.php
*
*/

var parseRFC3339 = function(dString){
		  if (typeof dString != 'string') return;
		  var result;
		  var regexp = /(\d\d\d\d)(-)?(\d\d)(-)?(\d\d)(T)?(\d\d)(:)?(\d\d)?(:)?(\d\d)?([\.,]\d+)?($|Z|([+-])(\d\d)(:)?(\d\d)?)/i;
		  var d = dString.match(new RegExp(regexp));
		  if (d) {
		    var year = parseInt(d[1],10);
		    var mon = parseInt(d[3],10) - 1;
		    var day = parseInt(d[5],10);
		    var hour = parseInt(d[7],10);
		    var mins = ( d[9] ? parseInt(d[9],10) : 0 );
		    var secs = ( d[11] ? parseInt(d[11],10) : 0 );
		    var millis = ( d[12] ? parseFloat(String(1.5).charAt(1) + d[12].slice(1)) * 1000 : 0 );
		    if (d[13]) {
		      result = new Date();
		      result.setUTCFullYear(year);
		      result.setUTCMonth(mon);
		      result.setUTCDate(day);
		      result.setUTCHours(hour);
		      result.setUTCMinutes(mins);
		      result.setUTCSeconds(secs);
		      result.setUTCMilliseconds(millis);
		      if (d[13] && d[14]) {
		        var offset = (d[15] * 60)
		        if (d[17]) offset += parseInt(d[17],10);
		        offset *= ((d[14] == '-') ? -1 : 1);
		        result.setTime(result.getTime() - offset * 60 * 1000);
		      }
		    } else {
		      result = new Date(year,mon,day,hour,mins,secs,millis);
		    }
		  }
		  return result;
		};
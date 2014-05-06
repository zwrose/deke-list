/**
 * DekeListController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

sorter = require('../services/sorter');
request = require('request');

module.exports = {
    
  show: function(req, res, next){

  	var sort = req.param('sort');
  	var sortDir = req.param('sortDir');

  	if (sort === 'firstName'){

  		if(sortDir === 'desc'){

  			var insLookupURI = 'https://api.insight.ly/v2.1/contacts?$orderby=FIRST_NAME desc&$top=10'

  		} else {

  			// default to asc
  			var insLookupURI = 'https://api.insight.ly/v2.1/contacts?$orderby=FIRST_NAME asc&$top=10'

  		}

  		if(req.param('id')){

  			var page = parseInt(req.param('id'), 10);
  			insLookupURI += "&$skip=" + 10*(page - 1);

  		}

  		request.get({
	      url: insLookupURI, 
	      auth: {user: process.env.INSIGHTLY_KEY}
	    }, function(error, response, body){
	    	// make array of all contacts
	      sortedContacts = JSON.parse(body);

	      return res.view({
	      	brothers: sortedContacts
	      })

	    });

  	} else if(sort === 'gradYear'){

  	} else if(sort === 'addrCity'){

  	} else if(sort === 'addrState'){

  	} else {

  		// default to sort by last name
  		if(sortDir === 'desc'){

  			var insLookupURI = 'https://api.insight.ly/v2.1/contacts?$orderby=LAST_NAME desc&$top=10'

  		} else {

  			// default to asc
  			var insLookupURI = 'https://api.insight.ly/v2.1/contacts?$orderby=LAST_NAME asc&$top=10'

  		}

  		if(req.param('id')){

  			var page = parseInt(req.param('id'), 10);
  			insLookupURI += "&$skip=" + 10*(page - 1);

  		}

  		request.get({
	      url: insLookupURI, 
	      auth: {user: process.env.INSIGHTLY_KEY}
	    }, function(error, response, body){
	    	// make array of all contacts
	      sortedContacts = JSON.parse(body);

	      return res.view({
	      	brothers: sortedContacts
	      })

	    });

  	}

  	// get all contacts from insightly
    // var insLookupURI = 'https://api.insight.ly/v2.1/contacts';

    // request.get({
    //   url: insLookupURI, 
    //   auth: {user: process.env.INSIGHTLY_KEY}
    // }, function(error, response, body){
    // 	// make array of all contacts
    //   insAllContacts = JSON.parse(body);

    //   if(req.param('id') === 'down'){
    //   	sortedAllContacts = sorter.sortDESCbyKey(insAllContacts, 'LAST_NAME');
    //   } else {
    //   	sortedAllContacts = sorter.sortASCbyKey(insAllContacts, 'LAST_NAME');
    //   };

    //   return res.view({
    //   	brothers: sortedAllContacts
    //   })

    // });

  },

  
};

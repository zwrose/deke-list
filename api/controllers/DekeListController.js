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

  		var insLookupURI = 'https://api.insight.ly/v2.1/contacts';

  		request.get({
	      url: insLookupURI, 
	      auth: {user: process.env.INSIGHTLY_KEY}
	    }, function(error, response, body){
	    	// make array of all contacts
	      insAllContacts = JSON.parse(body);

	      var totpages = Math.ceil(insAllContacts.length/30);

	      if(sortDir === 'desc'){
	      	sortedAllContacts = sorter.sortDESCbyKey(insAllContacts, "FIRST_NAME");
	      } else {
	      	sortedAllContacts = sorter.sortASCbyKey(insAllContacts, "FIRST_NAME");
	      };

	      if(req.param('id')){

  			var page = parseInt(req.param('id'), 10);

	  			sortedAllContacts = sortedAllContacts.slice(30*(page - 1), 30*page);

	  		} else {

	  			sortedAllContacts = sortedAllContacts.slice(0, 30);

	  		}

	      return res.view({
	      	brothers: sortedAllContacts,
	      	totalPages: totpages
	      })

	    });

  	} else if(sort === 'gradYear'){

  		var insLookupURI = 'https://api.insight.ly/v2.1/contacts';

  		request.get({
	      url: insLookupURI, 
	      auth: {user: process.env.INSIGHTLY_KEY}
	    }, function(error, response, body){
	    	// make array of all contacts
	      insAllContacts = JSON.parse(body);

	      var totpages = Math.ceil(insAllContacts.length/30);

	      if(sortDir === 'desc'){
	      	sortedAllContacts = sorter.sortDESCbyGrad(insAllContacts);
	      } else {
	      	sortedAllContacts = sorter.sortASCbyGrad(insAllContacts);
	      };

	      if(req.param('id')){

  			var page = parseInt(req.param('id'), 10);

	  			sortedAllContacts = sortedAllContacts.slice(30*(page - 1), 30*page);

	  		} else {

	  			sortedAllContacts = sortedAllContacts.slice(0, 30);

	  		}

	      return res.view({
	      	brothers: sortedAllContacts,
	      	totalPages: totpages
	      })

	    });

  	} else if(sort === 'addrCity'){

  		var insLookupURI = 'https://api.insight.ly/v2.1/contacts';

  		request.get({
	      url: insLookupURI, 
	      auth: {user: process.env.INSIGHTLY_KEY}
	    }, function(error, response, body){
	    	// make array of all contacts
	      insAllContacts = JSON.parse(body);

	      var totpages = Math.ceil(insAllContacts.length/30);

	      if(sortDir === 'desc'){
	      	sortedAllContacts = sorter.sortDESCbyCity(insAllContacts);
	      } else {
	      	sortedAllContacts = sorter.sortASCbyCity(insAllContacts);
	      };

	      if(req.param('id')){

  			var page = parseInt(req.param('id'), 10);

	  			sortedAllContacts = sortedAllContacts.slice(30*(page - 1), 30*page);

	  		} else {

	  			sortedAllContacts = sortedAllContacts.slice(0, 30);

	  		}

	      return res.view({
	      	brothers: sortedAllContacts,
	      	totalPages: totpages
	      })

	    });

  	} else if(sort === 'addrState'){

  		var insLookupURI = 'https://api.insight.ly/v2.1/contacts';

  		request.get({
	      url: insLookupURI, 
	      auth: {user: process.env.INSIGHTLY_KEY}
	    }, function(error, response, body){
	    	// make array of all contacts
	      insAllContacts = JSON.parse(body);

	      var totpages = Math.ceil(insAllContacts.length/30);

	      if(sortDir === 'desc'){
	      	sortedAllContacts = sorter.sortDESCbyState(insAllContacts);
	      } else {
	      	sortedAllContacts = sorter.sortASCbyState(insAllContacts);
	      };

	      if(req.param('id')){

  			var page = parseInt(req.param('id'), 10);

	  			sortedAllContacts = sortedAllContacts.slice(30*(page - 1), 30*page);

	  		} else {

	  			sortedAllContacts = sortedAllContacts.slice(0, 30);

	  		}

	      return res.view({
	      	brothers: sortedAllContacts,
	      	totalPages: totpages
	      })

	    });

  	} else {

  		// default to sort by last name
  		var insLookupURI = 'https://api.insight.ly/v2.1/contacts';

  		request.get({
	      url: insLookupURI, 
	      auth: {user: process.env.INSIGHTLY_KEY}
	    }, function(error, response, body){
	    	// make array of all contacts
	      insAllContacts = JSON.parse(body);

	      var totpages = Math.ceil(insAllContacts.length/30);

	      if(sortDir === 'desc'){
	      	sortedAllContacts = sorter.sortDESCbyKey(insAllContacts, "LAST_NAME");
	      } else {
	      	sortedAllContacts = sorter.sortASCbyKey(insAllContacts, "LAST_NAME");
	      };

	      if(req.param('id')){

  			var page = parseInt(req.param('id'), 10);

	  			sortedAllContacts = sortedAllContacts.slice(30*(page - 1), 30*page);

	  		} else {

	  			sortedAllContacts = sortedAllContacts.slice(0, 30);

	  		}

	      return res.view({
	      	brothers: sortedAllContacts,
	      	totalPages: totpages
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
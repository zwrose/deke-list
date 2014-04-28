/**
 * Bootstrap
 *
 * An asynchronous boostrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#documentation
 */

 module.exports = {
  appName: 'ASTADKE Secure',
};

module.exports.bootstrap = function (cb) {

	// get list of countries insightly uses
	var request = require('request');
	var insLookupLivingURI = 'https://api.insight.ly/v2.1/countries';
	request.get({
	  url: insLookupLivingURI, 
	  auth: {user: process.env.INSIGHTLY_KEY}
	}, function(error, response, body){

	  countriesPull = JSON.parse(body);

	  var insCountries = [];

	  for(var i=0; i<countriesPull.length; i++){
	  	insCountries.push(countriesPull[i].COUNTRY_NAME);
	  }

	  sails.config.insCountries = insCountries;

	});

	// create reusable transport method (opens pool of SMTP connections)
	var nodemailer = require('nodemailer');
  sails.config.smtpTransport = nodemailer.createTransport("SMTP",{
      service: "Gmail",
      auth: {
          user: "astadke@gmail.com",
          pass: process.env.ASTADKE_GMAIL
      }
  });
  // It's very important to trigger this callack method when you are finished 
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
  cb();
};
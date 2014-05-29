/**
 * UserController.js 
 *
 * @description ::
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var bcrypt = require('bcrypt');
var request = require('request');
var moment = require('moment');
var nodemailer = require("nodemailer");
var fs = require('fs');

module.exports = {
	
	new: function(req, res){
    res.view();
  },

  create: function(req, res, next){
  	
    if (req.param('passphrase') !== process.env.SIGMATAU_PASSPHRASE){
      var wrongPassphrase = [{name: 'wrongPassphrase', message: 'Please enter the correct passphrase!'}]
      req.session.flash = {
          err: wrongPassphrase
      }
      return res.redirect('user/new');
    }
    
    if (!req.param('firstName')){
      var missingFirstName = [{name: 'missingFirstName', message: 'Please enter your first name! All information on this form is required.'}]
      req.session.flash = {
          err: missingFirstName
      }
      return res.redirect('user/new');
    }
    
    if (!req.param('lastName')){
      var missingLastName = [{name: 'missingLastName', message: 'Please enter your last name! All information on this form is required.'}]
      req.session.flash = {
          err: missingLastName
      }
      return res.redirect('user/new');
    }
    
    if (!req.param('gradYear')){
      var missingGradYear = [{name: 'missingGradYear', message: 'Please enter your grad year! All information on this form is required.'}]
      req.session.flash = {
          err: missingGradYear
      }
      return res.redirect('user/new');
    }

    var userObj = {
        email: req.param('email'),
        password: req.param('password'),
        firstName: req.param('firstName'),
        lastName: req.param('lastName'),
        gradYear: req.param('gradYear')
    }

    // Check to make sure the password and password confirmation match before creating record
    if (userObj.password != req.param('confirmation')) {
      var pwMismatch = [{name: 'pwMismatch', message: 'Passwords did not match - please retry!'}]
      req.session.flash = {
  				err: pwMismatch
  		}
  		return res.redirect('user/new');
    }

  	//Create a user with the params from the signup form
  	User.create(userObj, function userCreated(err, user){
  		
  		if(err){
  			
  			console.log(err);

  			return res.redirect('user/new');
  		}

  		//After successfully creating the user
      //Log the user in
      req.session.authenticated = true;
      req.session.User = user;
  		
      // Poll insightly based on email
      var insLookupEmailURI = 'https://api.insight.ly/v2.1/contacts?email=' + user.email;

      request({
        url: insLookupEmailURI, 
        auth: {user: process.env.INSIGHTLY_KEY}
      }, function(error, response, body){
        insContactsEmail = JSON.parse(body);

        // create reusable transport method (opens pool of SMTP connections)
        // moved to bootstrap config, left open continuously
        // var smtpTransport = nodemailer.createTransport("SMTP",{
        //     service: "Gmail",
        //     auth: {
        //         user: "astadke@gmail.com",
        //         pass: process.env.ASTADKE_GMAIL
        //     }
        // });

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: "ASTADKE Webmaster <astadke@gmail.com>", // sender address
            to: user.firstName + ' ' + user.lastName + ' <' + user.email + '>', // list of receivers
            bcc: "astadke@gmail.com",
            subject: "Welcome to ASTADKE Online!", // Subject line
            text: "Hi " + user.firstName + ",\n\n" +
                  "Thank you for registering with ASTADKE Online! We hope you'll find the site useful for keeping up " +
                  "with everything that is happening with both the active and alumni chapters of Sigma Tau DKE. If you have any questions, " + 
                  "or run into any issues with the site, please dont hesitate to shoot us an email: astadke@gmail.com.\n\n" + 
                  "ITB,\n\n" + "Zach Rose '10\n" + "ASTADKE Online Webmaster"
        }

        // send mail with defined transport object
        sails.config.smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                console.log(error);
            }else{
                console.log("Message sent: " + response.message);
            }

        });
        
        // If there's a unique insightly match, save the insightly id
        // Then send the user to review/edit their info
        if(insContactsEmail.length === 1){
        
          user.insightlyID = insContactsEmail[0].CONTACT_ID;

          var noPersonal = true;

          // need to normalize capitalization of labels and put to insightly. Also set username to preferred email
          for(var i=0; i<insContactsEmail[0].CONTACTINFOS.length; i++){
            if(insContactsEmail[0].CONTACTINFOS[i].LABEL === 'Personal'){
              insContactsEmail[0].CONTACTINFOS[i].LABEL = 'PERSONAL';
            }
            if(insContactsEmail[0].CONTACTINFOS[i].LABEL === 'PERSONAL'){
              insContactsEmail[0].CONTACTINFOS[i].DETAIL = user.email;
              noPersonal = false;
            }
            if(insContactsEmail[0].CONTACTINFOS[i].LABEL === 'Home'){
              insContactsEmail[0].CONTACTINFOS[i].LABEL = 'HOME';
            }
            if(insContactsEmail[0].CONTACTINFOS[i].LABEL === 'Work'){
              insContactsEmail[0].CONTACTINFOS[i].LABEL = 'WORK';
            }
            if(insContactsEmail[0].CONTACTINFOS[i].LABEL === 'Mobile'){
              insContactsEmail[0].CONTACTINFOS[i].LABEL = 'MOBILE';
            }
            if(insContactsEmail[0].CONTACTINFOS[i].LABEL === 'Other'){
              insContactsEmail[0].CONTACTINFOS[i].LABEL = 'OTHER';
            }
          }

          if(noPersonal){
            console.log('Adding Personal')
            insContactsEmail[0].CONTACTINFOS.push({
              TYPE: 'EMAIL',
              LABEL: 'PERSONAL',
              DETAIL: user.email
            })
          }

          // marks in insightly that this user has linked
          insContactsEmail[0].TAGS.push({
            TAG_NAME: 'SecureLinked'
          });

          // this makes sure the label and email updates are pushed to insightly
          request.put({
            url: 'https://api.insight.ly/v2.1/contacts', 
            auth: {user: process.env.INSIGHTLY_KEY},
            json: true,
            body: insContactsEmail[0]
          }, function(error, response, body){
            console.log(response.statusCode);
            // console.log(body);

            user.save(function(err){
              if(err) return next(err);

              req.session.flash = {
                firstLogin: true
              }
              return res.redirect('user/edit/' + user.id);
            });

          });

        } else {
          
          return res.redirect('user/linkup/' + user.id);

        }

      });

  	});
  },

  destroy: function(req, res, next){

    User.findOne(req.param('id'), function foundUser(err, user){
      if(err) return next(err);

      if(!user) return next('User doesn\'t exist.');

      User.destroy(req.param('id'), function userDestroyed(err){
        if(err) return next(err);
      
      });

      res.redirect('/');

    });
  },

  show: function(req, res, next){

  	if(!req.param('id')){
  		return res.view({
  			user: req.session.User
  		});
  	}

    User.findOne(req.param('id'), function foundUser(err, user){

      if(err) return next(err);
      if(!user) return next('User doesn\'t exist.');

      req.session.User = user;

      if(user.insightlyID){
        var insLookupIDURI = 'https://api.insight.ly/v2.1/contacts/' + user.insightlyID;

        request.get({
          url: insLookupIDURI, 
          auth: {user: process.env.INSIGHTLY_KEY}
        }, function(error, response, body){
          insContactEdit = JSON.parse(body);
          // console.log(insContactEdit)
          // make insightly obj ready for use in view
          var insUserObj = {
            salutation: insContactEdit.SALUTATION,
            firstName: insContactEdit.FIRST_NAME,
            lastName: insContactEdit.LAST_NAME,
            gradYear: 'none listed',
            addrStreet: 'none listed',
            addrCity: 'none listed',
            addrState: 'none listed',
            addrZip: 'none listed',
            addrCountry: 'none listed',
            phoneOne: 'none listed',
            phoneTwo: 'none listed',
            phoneThree: 'none listed',
            emailOne: 'none listed',
            emailTwo: 'none listed',
            emailThree: 'none listed',
            updated: 'never'
          }

          if(insContactEdit.CUSTOMFIELDS.length > 0){
            insUserObj.gradYear = insContactEdit.CUSTOMFIELDS[1].FIELD_VALUE;
          }
          if(insContactEdit.CUSTOMFIELDS.length === 3){
            insUserObj.updated = insContactEdit.CUSTOMFIELDS[2].FIELD_VALUE;
          }
          if(insContactEdit.ADDRESSES.length > 0){
            insUserObj.addrStreet = insContactEdit.ADDRESSES[0].STREET;
            insUserObj.addrCity = insContactEdit.ADDRESSES[0].CITY;
            insUserObj.addrState = insContactEdit.ADDRESSES[0].STATE;
            insUserObj.addrZip = insContactEdit.ADDRESSES[0].POSTCODE;
            insUserObj.addrCountry = insContactEdit.ADDRESSES[0].COUNTRY;
          }

          // get just the phones
          var insPhones = insContactEdit.CONTACTINFOS.filter(function(obj){
            return obj.TYPE === 'PHONE';
          });
          
          // assuming there is at least 1 phone, process and put into insUserObj
          if(insPhones.length > 0){
            var phonesSorted = [];
            for(var i=0; i<insPhones.length; i++){          
              if(insPhones[i].LABEL === 'HOME'){
                phonesSorted.splice(0,0,insPhones[i].DETAIL);
              } else if(insPhones[i].LABEL === 'WORK'){
                phonesSorted.splice(1,0,insPhones[i].DETAIL);
              } else {
                phonesSorted.splice(2,0,insPhones[i].DETAIL);
              }
            }
            
            insUserObj.phoneOne = phonesSorted[0];
            if(phonesSorted.length >= 2){insUserObj.phoneTwo = phonesSorted[1];};
            if(phonesSorted.length === 3){insUserObj.phoneThree = phonesSorted[2];};
          }

          // get just the emails
          var insEmails = insContactEdit.CONTACTINFOS.filter(function(obj){
            return obj.TYPE === 'EMAIL';
          });

          // assuming there is at least 1 email, process and put into insUserObj
          if(insEmails.length > 0){
            var emailsSorted = [];
            for(var i=0; i<insEmails.length; i++){
              if(insEmails[i].LABEL ==='PERSONAL'){
                emailsSorted.splice(0,0,insEmails[i].DETAIL);
              } else if(insEmails[i].LABEL ==='WORK'){
                emailsSorted.splice(1,0,insEmails[i].DETAIL);
              } else {
                emailsSorted.splice(2,0,insEmails[i].DETAIL);
              }
            }
            insUserObj.emailOne = emailsSorted[0];
            if(emailsSorted.length >= 2){insUserObj.emailTwo = emailsSorted[1];};
            if(emailsSorted.length === 3){insUserObj.emailThree = emailsSorted[2];};
          }

          // show more user-friendly "none listed" email line
          if(insUserObj.emailOne && insUserObj.emailOne === 'no.email.listed@donotsend.com'){
            insUserObj.emailOne = 'none listed';
          }
          if(insUserObj.emailTwo && insUserObj.emailTwo === 'no.email.listed@donotsend.com'){
            insUserObj.emailTwo = 'none listed';
          }
          if(insUserObj.emailThree && insUserObj.emailThree === 'no.email.listed@donotsend.com'){
            insUserObj.emailThree = 'none listed';
          }

          res.view({
            user: user,
            insightly: insUserObj
          })
        });

      } else {
        res.view({
          user: user,
          insightly: null
        });
      }

    });
  },

  edit: function(req, res, next){

    User.findOne(req.param('id'), function foundUser(err, user){

      if(err) return next(err);
      if(!user) return next('User doesn\'t exist.');

      if(user.insightlyID){
        var insLookupIDURI = 'https://api.insight.ly/v2.1/contacts/' + user.insightlyID;

        request.get({
          url: insLookupIDURI, 
          auth: {user: process.env.INSIGHTLY_KEY}
        }, function(error, response, body){
          insContactEdit = JSON.parse(body);
          // console.log(insContactEdit)
          // make insightly obj ready for use in view
          var insUserObj = {
            salutation: insContactEdit.SALUTATION,
            firstName: insContactEdit.FIRST_NAME,
            lastName: insContactEdit.LAST_NAME,
            gradYear: 'none listed',
            addrStreet: 'none listed',
            addrCity: 'none listed',
            addrState: 'none listed',
            addrZip: 'none listed',
            addrCountry: 'none listed',
            phoneOne: 'none listed',
            phoneTwo: 'none listed',
            phoneThree: 'none listed',
            emailOne: 'none listed',
            emailTwo: 'none listed',
            emailThree: 'none listed'
          }

          if(insContactEdit.CUSTOMFIELDS.length > 0){
            insUserObj.gradYear = insContactEdit.CUSTOMFIELDS[1].FIELD_VALUE;
          }
          if(insContactEdit.ADDRESSES.length > 0){
            insUserObj.addrStreet = insContactEdit.ADDRESSES[0].STREET;
            insUserObj.addrCity = insContactEdit.ADDRESSES[0].CITY;
            insUserObj.addrState = insContactEdit.ADDRESSES[0].STATE;
            insUserObj.addrZip = insContactEdit.ADDRESSES[0].POSTCODE;
            insUserObj.addrCountry = insContactEdit.ADDRESSES[0].COUNTRY;
          }

          // get just the phones
          var insPhones = insContactEdit.CONTACTINFOS.filter(function(obj){
            return obj.TYPE === 'PHONE';
          });
          
          // assuming there is at least 1 phone, process and put into insUserObj
          if(insPhones.length > 0){
            var phonesSorted = [];
            for(var i=0; i<insPhones.length; i++){          
              if(insPhones[i].LABEL === 'HOME'){
                phonesSorted.splice(0,0,insPhones[i].DETAIL);
              } else if(insPhones[i].LABEL === 'WORK'){
                phonesSorted.splice(1,0,insPhones[i].DETAIL);
              } else {
                phonesSorted.splice(2,0,insPhones[i].DETAIL);
              }
            }
            
            insUserObj.phoneOne = phonesSorted[0];
            if(phonesSorted.length >= 2){insUserObj.phoneTwo = phonesSorted[1];};
            if(phonesSorted.length === 3){insUserObj.phoneThree = phonesSorted[2];};
          }

          // get just the emails
          var insEmails = insContactEdit.CONTACTINFOS.filter(function(obj){
            return obj.TYPE === 'EMAIL';
          });

          // assuming there is at least 1 email, process and put into insUserObj
          if(insEmails.length > 0){
            var emailsSorted = [];
            for(var i=0; i<insEmails.length; i++){
              if(insEmails[i].LABEL ==='PERSONAL'){
                emailsSorted.splice(0,0,insEmails[i].DETAIL);
              } else if(insEmails[i].LABEL ==='WORK'){
                emailsSorted.splice(1,0,insEmails[i].DETAIL);
              } else {
                emailsSorted.splice(2,0,insEmails[i].DETAIL);
              }
            }
            insUserObj.emailOne = emailsSorted[0];
            if(emailsSorted.length >= 2){insUserObj.emailTwo = emailsSorted[1];};
            if(emailsSorted.length === 3){insUserObj.emailThree = emailsSorted[2];};
          }

          // show more user-friendly "none listed" email line
          if(insUserObj.emailOne && insUserObj.emailOne === 'no.email.listed@donotsend.com'){
            insUserObj.emailOne = 'none listed';
          }
          if(insUserObj.emailTwo && insUserObj.emailTwo === 'no.email.listed@donotsend.com'){
            insUserObj.emailTwo = 'none listed';
          }
          if(insUserObj.emailThree && insUserObj.emailThree === 'no.email.listed@donotsend.com'){
            insUserObj.emailThree = 'none listed';
          }

          res.view({
            user: user,
            insightly: insUserObj,
            countries: sails.config.insCountries
          })
        });

      } else {
        res.view({
          user: user,
          insightly: null,
          countries: sails.config.insCountries
        });
      }

    });
  },

  update: function(req, res, next){
    
    if (!req.param('loginEmail')){
      var missingEmail = [{name: 'missingEmail', message: 'Please enter your email! Email, Preferred First Name, Last Name, and Grad Year are required fields.'}]
      req.session.flash = {
          err: missingEmail
      }
      return res.redirect('user/edit/' + req.param('id'));
    }
    
    if (!req.param('prefFirstName')){
      var missingFirstName = [{name: 'missingFirstName', message: 'Please enter your preferred first name! Email, Preferred First Name, Last Name, and Grad Year are required fields.'}]
      req.session.flash = {
          err: missingFirstName
      }
      return res.redirect('user/edit/' + req.param('id'));
    }
    
    if (!req.param('lastName')){
      var missingLastName = [{name: 'missingLastName', message: 'Please enter your last name! Email, Preferred First Name, Last Name, and Grad Year are required fields.'}]
      req.session.flash = {
          err: missingLastName
      }
      return res.redirect('user/edit/' + req.param('id'));
    }
    
    if (!req.param('gradYear')){
      var missingGradYear = [{name: 'missingGradYear', message: 'Please enter your grad year! Email, Preferred First Name, Last Name, and Grad Year are required fields.'}]
      req.session.flash = {
          err: missingGradYear
      }
      return res.redirect('user/edit/' + req.param('id'));
    }
    
    var userObj = {
      email: req.param('loginEmail'),
      password: req.param('newPassword'),
      firstName: req.param('prefFirstName'),
      lastName: req.param('lastName'),
      gradYear: req.param('gradYear')
    }

    // translate blank entries to "none-listed" except for password reset fields
    var emailCheck = /\b(email).*/;
    for (var formParam in req.body) {
      if (req.body.hasOwnProperty(formParam)) {
        if((req.body[formParam] === '' || req.body[formParam] === 'none listed') && !(formParam === 'oldPassword' || formParam === 'newPassword' || formParam === 'confirmation')){
          if(emailCheck.test(formParam)){
            // console.log(formParam);
            req.body[formParam] = 'no.email.listed@donotsend.com';
          } else{
            req.body[formParam] = 'none listed';
          }
        }
      }
    }

    if(req.param('salutation')){
      var insUpdateObj = {
        salutation: req.param('salutation'),
        firstName: req.param('firstName'),
        lastName: req.param('lastName'),
        gradYear: req.param('gradYear'),
        addrStreet: req.param('addrStreet'),
        addrCity: req.param('addrCity'),
        addrState: req.param('addrState'),
        addrZip: req.param('addrZip'),
        addrCountry: req.param('addrCountry'),
        phoneOne: req.param('phoneOne'),
        phoneTwo: req.param('phoneTwo'),
        phoneThree: req.param('phoneThree'),
        emailOne: req.param('emailOne'),
        emailTwo: req.param('emailTwo'),
        emailThree: req.param('emailThree')
      }
    }
    // Check to make sure the correct old password was entered
    User.findOne(req.param('id'),function foundUser(err, user){

      if(err) {
      	req.session.flash = {
							err: err
				}
				return res.redirect('/user/edit/'+req.param('id'));
      }

      if(!user) {
      	var noUser = [{name: 'noUser', message: 'User does not exist.'}]
				req.session.flash = {
					err: noUser
				}
				return res.redirect('/user/edit/'+req.param('id'));
      }

      if(req.param('oldPassword') && !bcrypt.compareSync(req.param('oldPassword'), user.encryptedPassword)) {

				var badOldPass = [{name: 'badOldPass', message: 'Old password was incorrect - password not updated'}]
				req.session.flash = {
					err: badOldPass
				}
				return res.redirect('/user/edit/'+req.param('id'));

      }

      // Check to make sure the new password and password confirmation match before updating record
	    if (userObj.password != req.param('confirmation')) {
	      var pwMismatch = [{name: 'pwMismatch', message: 'Passwords did not match - please retry!'}]
	      req.session.flash = {
	  			err: pwMismatch
	  		}
	  		return res.redirect('/user/edit/'+req.param('id'));
	    }

      if(user.insightlyID){
        var insLookupIDURI = 'https://api.insight.ly/v2.1/contacts/' + user.insightlyID;

        request.get({
          url: insLookupIDURI, 
          auth: {user: process.env.INSIGHTLY_KEY}
          }, function(error, response, body){
          insContactEdit = JSON.parse(body);
          // console.log(insContactEdit)

          if(insContactEdit.CUSTOMFIELDS.length === 3){
            insContactEdit.CUSTOMFIELDS[2].FIELD_VALUE = moment().format("MMMM Do YYYY");
          } else {
            insContactEdit.CUSTOMFIELDS.push({
              CUSTOM_FIELD_ID: 'CONTACT_FIELD_3',
              FIELD_VALUE: moment().format("MMMM Do YYYY")
            });
          }
          
          insContactEdit.SALUTATION = insUpdateObj.salutation;
          insContactEdit.FIRST_NAME = insUpdateObj.firstName;
          insContactEdit.LAST_NAME = insUpdateObj.lastName;
          insContactEdit.CUSTOMFIELDS[1].FIELD_VALUE = insUpdateObj.gradYear;
          if(insContactEdit.ADDRESSES[0]){
            insContactEdit.ADDRESSES[0].STREET = insUpdateObj.addrStreet;
            insContactEdit.ADDRESSES[0].CITY = insUpdateObj.addrCity;
            insContactEdit.ADDRESSES[0].STATE = insUpdateObj.addrState;
            insContactEdit.ADDRESSES[0].POSTCODE = insUpdateObj.addrZip;
            insContactEdit.ADDRESSES[0].COUNTRY = insUpdateObj.addrCountry;
          } else {
            insContactEdit.ADDRESSES[0] = {
              ADDRESS_TYPE: 'HOME',
              STREET: insUpdateObj.addrStreet,
              CITY: insUpdateObj.addrCity,
              STATE: insUpdateObj.addrState,
              POSTCODE: insUpdateObj.addrZip,
              COUNTRY: insUpdateObj.addrCountry
            }
          }

          // tracking array for all contact infos
          infosArr = ['phone-home', 'phone-work', 'phone-mobile', 'email-personal', 'email-work', 'email-other'];

          // loop through already existing contact infos
          for(var i=0; i<insContactEdit.CONTACTINFOS.length; i++){
            var conObj = insContactEdit.CONTACTINFOS[i];
            // if(conObj.DETAIL === 'no.email.listed@donotsend.com'){
            //   insContactEdit.CONTACTINFOS[i].TYPE = 'DELETED'; 
            // }
            if(conObj.TYPE === 'PHONE' && conObj.LABEL === 'HOME' && _.contains(infosArr, 'phone-home')){
              insContactEdit.CONTACTINFOS[i].DETAIL = insUpdateObj.phoneOne;
              var j = infosArr.indexOf('phone-home');
              if(infosArr.length === 1){
                infosArr = [];
              } else {
                infosArr.splice(j,1);
              }
            } else if(conObj.TYPE === 'PHONE' && conObj.LABEL === 'WORK' && _.contains(infosArr, 'phone-work')){
              insContactEdit.CONTACTINFOS[i].DETAIL = insUpdateObj.phoneTwo;
              var j = infosArr.indexOf('phone-work');
              if(infosArr.length === 1){
                infosArr = [];
              } else {
                infosArr.splice(j,1);
              }
            } else if(conObj.TYPE === 'PHONE' && conObj.LABEL === 'MOBILE' && _.contains(infosArr, 'phone-mobile')){
              insContactEdit.CONTACTINFOS[i].DETAIL = insUpdateObj.phoneThree;
              var j = infosArr.indexOf('phone-mobile');
              if(infosArr.length === 1){
                infosArr = [];
              } else {
                infosArr.splice(j,1);
              }
            } else if(conObj.TYPE === 'EMAIL' && conObj.LABEL === 'PERSONAL' && _.contains(infosArr, 'email-personal')){
              insContactEdit.CONTACTINFOS[i].DETAIL = insUpdateObj.emailOne;
              var j = infosArr.indexOf('email-personal');
             if(infosArr.length === 1){
                infosArr = [];
              } else {
                infosArr.splice(j,1);
              }
            } else if(conObj.TYPE === 'EMAIL' && conObj.LABEL === 'WORK' && _.contains(infosArr, 'email-work')){
              insContactEdit.CONTACTINFOS[i].DETAIL = insUpdateObj.emailTwo;
              var j = infosArr.indexOf('email-work');
              if(infosArr.length === 1){
                infosArr = [];
              } else {
                infosArr.splice(j,1);
              }
            } else if(conObj.TYPE === 'EMAIL' && conObj.LABEL === 'OTHER' && _.contains(infosArr, 'email-other')){
              insContactEdit.CONTACTINFOS[i].DETAIL = insUpdateObj.emailThree;
              var j = infosArr.indexOf('email-other');
              if(infosArr.length === 1){
                infosArr = [];
              } else {
                infosArr.splice(j,1);
              }
            }
          }

          // create any new contact info objects to get to the standard 6
          for(var i=0; i<infosArr.length; i++){
            var conType = infosArr[i];
            if(conType === 'phone-home'){
              insContactEdit.CONTACTINFOS.push({
                CONTACT_INFO_ID: 0,
                TYPE: 'PHONE',
                LABEL: 'HOME',
                DETAIL: insUpdateObj.phoneOne
              })
            } else if(conType === 'phone-work'){
              insContactEdit.CONTACTINFOS.push({
                CONTACT_INFO_ID: 0,
                TYPE: 'PHONE',
                LABEL: 'WORK',
                DETAIL: insUpdateObj.phoneTwo
              })
            } else if(conType === 'phone-mobile'){
              insContactEdit.CONTACTINFOS.push({
                CONTACT_INFO_ID: 0,
                TYPE: 'PHONE',
                LABEL: 'MOBILE',
                DETAIL: insUpdateObj.phoneThree
              })
            } else if(conType === 'email-personal'){
              insContactEdit.CONTACTINFOS.push({
                CONTACT_INFO_ID: 0,
                TYPE: 'EMAIL',
                LABEL: 'PERSONAL',
                DETAIL: insUpdateObj.emailOne
              })
            } else if(conType === 'email-work'){
              insContactEdit.CONTACTINFOS.push({
                CONTACT_INFO_ID: 0,
                TYPE: 'EMAIL',
                LABEL: 'WORK',
                DETAIL: insUpdateObj.emailTwo
              })
            } else if(conType === 'email-other'){
              insContactEdit.CONTACTINFOS.push({
                CONTACT_INFO_ID: 0,
                TYPE: 'EMAIL',
                LABEL: 'OTHER',
                DETAIL: insUpdateObj.emailThree
              })
            }
          }

          request.put({
            url: 'https://api.insight.ly/v2.1/contacts', 
            auth: {user: process.env.INSIGHTLY_KEY},
            json: true,
            body: insContactEdit
          }, function(error, response, body){
            if(response.statusCode === (400 || 403 || 404)){
              var updateError = [{name: 'updateError', message: 'Something went wrong with saving your data - we are looking into it!'}]
              req.session.flash = {
                err: updateError
              }
              console.log(response.statusCode);
              // console.log(response);
              // console.log(body);
              return res.redirect('/user/edit/'+req.param('id'));
            }

            User.update(req.param('id'), userObj, function userUpdated(err){
              if(err){
                req.session.flash = {
                  err: err
                }
                return res.redirect('/user/edit/'+req.param('id'));
              }

              var goodUpdate = [{name: 'goodUpdate', message: 'Information updated successfully.'}]
              req.session.flash = {
                successMsg: goodUpdate
              }
              res.redirect('/user/show/'+req.param('id'));
            });
            
          });

        });

      } else {

        User.update(req.param('id'), userObj, function userUpdated(err){
          if(err){
            req.session.flash = {
              err: err
            }
            return res.redirect('/user/edit/'+req.param('id'));
          }

          var warnUpdate = [{name: 'warnUpdate', message: 'Your local information was updated successfully, but it seems as if you are not fully linked to our database - we are looking into it.'}]
          req.session.flash = {
            successMsg: warnUpdate
          }
          res.redirect('/user/show/'+req.param('id'));
        });

      }

    });

    
  },

  linkup: function(req, res, next){

    // Get all living contacts
    var insLookupLivingURI = 'https://api.insight.ly/v2.1/contacts?tag=Living';

    request.get({
      url: insLookupLivingURI, 
      auth: {user: process.env.INSIGHTLY_KEY}
    }, function(error, response, body){
      insContactsLiving = JSON.parse(body);

      User.findOne(req.param('id'), function foundUser(err, user){

        if(err) return next(err);
        if(!user) return next('User doesn\'t exist.');

        var insLastNameMatch = insContactsLiving.filter(function(obj){

          return obj.LAST_NAME === user.lastName;

        });

        if(insLastNameMatch.length === 1){
          
          user.insightlyID = insLastNameMatch[0].CONTACT_ID;

          var noPersonal = true;

          // need to normalize capitalization of labels and put to insightly
          for(var i=0; i<insLastNameMatch[0].CONTACTINFOS.length; i++){
            if(insLastNameMatch[0].CONTACTINFOS[i].LABEL === 'Personal'){
              insLastNameMatch[0].CONTACTINFOS[i].LABEL = 'PERSONAL';
            }
            if(insLastNameMatch[0].CONTACTINFOS[i].LABEL === 'PERSONAL'){
              insLastNameMatch[0].CONTACTINFOS[i].DETAIL = user.email;
              noPersonal = false;
            }
            if(insLastNameMatch[0].CONTACTINFOS[i].LABEL === 'Home'){
              insLastNameMatch[0].CONTACTINFOS[i].LABEL = 'HOME';
            }
            if(insLastNameMatch[0].CONTACTINFOS[i].LABEL === 'Work'){
              insLastNameMatch[0].CONTACTINFOS[i].LABEL = 'WORK';
            }
            if(insLastNameMatch[0].CONTACTINFOS[i].LABEL === 'Mobile'){
              insLastNameMatch[0].CONTACTINFOS[i].LABEL = 'MOBILE';
            }
            if(insLastNameMatch[0].CONTACTINFOS[i].LABEL === 'Other'){
              insLastNameMatch[0].CONTACTINFOS[i].LABEL = 'OTHER';
            }
          }

          if(noPersonal){
            insLastNameMatch[0].CONTACTINFOS.push({
              TYPE: 'EMAIL',
              LABEL: 'PERSONAL',
              DETAIL: user.email
            })
          }

          // marks in insightly that this user has linked
          insLastNameMatch[0].TAGS.push({
            TAG_NAME: 'SecureLinked'
          });

          // this makes sure the label updates are pushed to insightly
          request.put({
            url: 'https://api.insight.ly/v2.1/contacts', 
            auth: {user: process.env.INSIGHTLY_KEY},
            json: true,
            body: insLastNameMatch[0]
          }, function(error, response, body){
            console.log(response.statusCode);
            // console.log(body);

            user.save(function(err){
              if(err) return next(err);

              req.session.flash = {
                firstLogin: true
              }
              return res.redirect('user/edit/' + user.id);
            });

          });

        } else if(insLastNameMatch.length === 0){
          // not in insightly!
          return res.redirect('/user/newinsightly/' + user.id);

        } else {
          // Display matches for user to choose
          return res.view({
            matches: insLastNameMatch,
            user: user
          })
        }

      });

    });

    

  },

  join: function(req, res, next){

    // Update local user with selected insightly ID
    User.update(req.param('id'), {insightlyID: req.param('insightlyID')}, function(err, users){

      if(err) return next(err);
      
      var insLookupContactURI = 'https://api.insight.ly/v2.1/contacts/' + req.param('insightlyID');
      request.get({
        url: insLookupContactURI, 
        auth: {user: process.env.INSIGHTLY_KEY}
      }, function(error, response, body){
        insContactJoin = JSON.parse(body);

        var noPersonal = true;

        // need to normalize capitalization of labels and put to insightly
        for(var i=0; i<insContactJoin.CONTACTINFOS.length; i++){
          if(insContactJoin.CONTACTINFOS[i].LABEL === 'Personal'){
            insContactJoin.CONTACTINFOS[i].LABEL = 'PERSONAL';
          }
          if(insContactJoin.CONTACTINFOS[i].LABEL === 'PERSONAL'){
            insContactJoin.CONTACTINFOS[i].DETAIL = users[0].email;
            noPersonal = false;
          }
          if(insContactJoin.CONTACTINFOS[i].LABEL === 'Home'){
            insContactJoin.CONTACTINFOS[i].LABEL = 'HOME';
          }
          if(insContactJoin.CONTACTINFOS[i].LABEL === 'Work'){
            insContactJoin.CONTACTINFOS[i].LABEL = 'WORK';
          }
          if(insContactJoin.CONTACTINFOS[i].LABEL === 'Mobile'){
            insContactJoin.CONTACTINFOS[i].LABEL = 'MOBILE';
          }
          if(insContactJoin.CONTACTINFOS[i].LABEL === 'Other'){
            insContactJoin.CONTACTINFOS[i].LABEL = 'OTHER';
          }
        }

        if(noPersonal){
          console.log('Adding Personal')
          insContactJoin.CONTACTINFOS.push({
            TYPE: 'EMAIL',
            LABEL: 'PERSONAL',
            DETAIL: users[0].email
          })
        }

        // marks in insightly that this user has linked
        insContactJoin.TAGS.push({
          TAG_NAME: 'SecureLinked'
        });

        // this makes sure the label updates are pushed to insightly
        request.put({
          url: 'https://api.insight.ly/v2.1/contacts', 
          auth: {user: process.env.INSIGHTLY_KEY},
          json: true,
          body: insContactJoin
        }, function(error, response, body){
          console.log(response.statusCode);
          // console.log(body);

          req.session.flash = {
            firstLogin: true
          }
          return res.redirect('user/edit/' + req.param('id'));

        });

      });

    });

  },

  newinsightly: function(req, res, next){

    User.findOne(req.param('id'), function foundUser(err, user){

      if(err){
        return next(err);
      }

      res.view({
        user: user,
        countries: sails.config.insCountries
      });

    });

  },

  createinsightly: function(req, res, next){

    User.findOne(req.param('id'), function foundUser(err, user){

      if(err){
        return next(err);
      }

      // translate blank entries to "none-listed" except for password reset fields
      var emailCheck = /\b(email).*/;
      for (var formParam in req.body) {
        if (req.body.hasOwnProperty(formParam)) {
          if((req.body[formParam] === '' || req.body[formParam] === 'none listed') && !(formParam === 'oldPassword' || formParam === 'newPassword' || formParam === 'confirmation')){
            if(emailCheck.test(formParam)){
              // console.log(formParam);
              req.body[formParam] = 'no.email.listed@donotsend.com';
            } else{
              req.body[formParam] = 'none listed';
            }
          }
        }
      }

      var insUpdateObj = {
        salutation: req.param('salutation'),
        firstName: req.param('firstName'),
        lastName: req.param('lastName'),
        gradYear: req.param('gradYear'),
        addrStreet: req.param('addrStreet'),
        addrCity: req.param('addrCity'),
        addrState: req.param('addrState'),
        addrZip: req.param('addrZip'),
        addrCountry: req.param('addrCountry'),
        phoneOne: req.param('phoneOne'),
        phoneTwo: req.param('phoneTwo'),
        phoneThree: req.param('phoneThree'),
        emailOne: req.param('emailOne'),
        emailTwo: req.param('emailTwo'),
        emailThree: req.param('emailThree')
      };

      newIns = {
        SALUTATION: insUpdateObj.salutation,
        FIRST_NAME: insUpdateObj.firstName,
        LAST_NAME: insUpdateObj.lastName,
        CUSTOMFIELDS: [
          {
            CUSTOM_FIELD_ID: "CONTACT_FIELD_1",
            FIELD_VALUE: "A"
          },
          {
            CUSTOM_FIELD_ID: "CONTACT_FIELD_2",
            FIELD_VALUE: insUpdateObj.gradYear
          },
          {
            CUSTOM_FIELD_ID: "CONTACT_FIELD_3",
            FIELD_VALUE: moment().format("MMMM Do YYYY")
          }
        ],
        ADDRESSES: [
          {
            ADDRESS_TYPE: "HOME",
            STREET: insUpdateObj.addrStreet,
            CITY: insUpdateObj.addrCity,
            STATE: insUpdateObj.addrState,
            POSTCODE: insUpdateObj.addrZip,
            COUNTRY: insUpdateObj.addrCountry
          }
        ],
        CONTACTINFOS: [
          {
            TYPE: "PHONE",
            LABEL: "HOME",
            DETAIL: insUpdateObj.phoneOne
          },
          {
            TYPE: "PHONE",
            LABEL: "WORK",
            DETAIL: insUpdateObj.phoneTwo
          },
          {
            TYPE: "PHONE",
            LABEL: "MOBILE",
            DETAIL: insUpdateObj.phoneThree
          },
          {
            TYPE: "EMAIL",
            LABEL: "PERSONAL",
            DETAIL: insUpdateObj.emailOne
          },
          {
            TYPE: "EMAIL",
            LABEL: "WORK",
            DETAIL: insUpdateObj.emailTwo
          },
          {
            TYPE: "EMAIL",
            LABEL: "OTHER",
            DETAIL: insUpdateObj.emailThree
          },
        ],
        TAGS: [
          {
            TAG_NAME: "Living"
          }
        ]
      };

      request.post({
        url: 'https://api.insight.ly/v2.1/contacts', 
        auth: {user: process.env.INSIGHTLY_KEY},
        json: true,
        body: newIns
      }, function(error, response, body){
        console.log(response.statusCode);
        // console.log(body);

        user.insightlyID = body.CONTACT_ID;
        user.firstName = req.param('prefFirstName');

        req.session.User = user;

        user.save(function(err){
          if(err) return next(err);

          return res.redirect('user/show/' + user.id);
        });

      });

    });

  },

};

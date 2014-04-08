/**
 * UserController.js 
 *
 * @description ::
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var bcrypt = require('bcrypt');
var request = require('request');

module.exports = {
	
	new: function(req, res){
    res.view();
  },

  create: function(req, res, next){
  	
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
  				err: {login: pwMismatch}
  		}
  		return res.redirect('user/new');
    }

  	//Create a user with the params from the signup form
  	User.create(userObj, function userCreated(err, user){
  		
  		if(err){
  			
  			req.session.flash = {
  				err: err.ValidationError
  			}

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
        
        // If there's a unique insightly match, save the insightly id
        // Then send the user to review/edit their info
        if(insContactsEmail.length === 1){
        
          user.insightlyID = insContactsEmail[0].CONTACT_ID;
          user.save(function(err){
            if(err) return next(err);

            req.session.flash = {
              firstLogin: true
            }
            return res.redirect('user/edit/' + user.id);
          })

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

  update: function(req, res, next){

    var userObj = {
      email: req.param('loginEmail'),
      password: req.param('newPassword'),
      firstName: req.param('firstName'),
      lastName: req.param('lastName'),
      gradYear: req.param('gradYear')
    }

    // translate blank entries to "none-listed" except for password reset fields
    var emailCheck = /\b(email).*/;
    for (var formParam in req.body) {
      if (req.body.hasOwnProperty(formParam)) {
        if(req.body[formParam] === '' && !(formParam === 'oldPassword' || formParam === 'newPassword' || formParam === 'confirmation')){
          if(emailCheck.test(formParam)){
            console.log(formParam);
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
					err: {userError: noUser}
				}
				return res.redirect('/user/edit/'+req.param('id'));
      }

      if(req.param('oldPassword') && !bcrypt.compareSync(req.param('oldPassword'), user.encryptedPassword)) {

				var badOldPass = [{name: 'badOldPass', message: 'Old password was incorrect - password not updated'}]
				req.session.flash = {
					err: {login: badOldPass}
				}
				return res.redirect('/user/edit/'+req.param('id'));

      }

      // Check to make sure the new password and password confirmation match before updating record
	    if (userObj.password != req.param('confirmation')) {
	      var pwMismatch = [{name: 'pwMismatch', message: 'Passwords did not match - please retry!'}]
	      req.session.flash = {
	  			err: {login: pwMismatch}
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

          console.log(infosArr);

          // create any new contact info objects to get to the standard 6
          for(var i=0; i<infosArr.length; i++){
            var conType = infosArr[i];
            if(conType === 'phone-home'){
              insContactEdit.CONTACTINFOS.push({
                TYPE: 'PHONE',
                LABEL: 'HOME',
                DETAIL: insUpdateObj.phoneOne
              })
            } else if(conType === 'phone-work'){
              insContactEdit.CONTACTINFOS.push({
                TYPE: 'PHONE',
                LABEL: 'WORK',
                DETAIL: insUpdateObj.phoneTwo
              })
            } else if(conType === 'phone-mobile'){
              insContactEdit.CONTACTINFOS.push({
                TYPE: 'PHONE',
                LABEL: 'MOBILE',
                DETAIL: insUpdateObj.phoneThree
              })
            } else if(conType === 'email-personal'){
              insContactEdit.CONTACTINFOS.push({
                TYPE: 'EMAIL',
                LABEL: 'PERSONAL',
                DETAIL: insUpdateObj.emailOne
              })
            } else if(conType === 'email-work'){
              insContactEdit.CONTACTINFOS.push({
                TYPE: 'EMAIL',
                LABEL: 'WORK',
                DETAIL: insUpdateObj.emailTwo
              })
            } else if(conType === 'email-other'){
              insContactEdit.CONTACTINFOS.push({
                TYPE: 'EMAIL',
                LABEL: 'OTHER',
                DETAIL: insUpdateObj.emailThree
              })
            }
          }

          console.log(insContactEdit);

          request.put({
            url: 'https://api.insight.ly/v2.1/contacts', 
            auth: {user: process.env.INSIGHTLY_KEY},
            json: true,
            body: insContactEdit
          }, function(error, response, body){
            if(response.statusCode === (400 || 403 || 404)){
              var updateError = [{name: 'updateError', message: 'Something went wrong with saving your data - we are looking into it!'}]
              req.session.flash = {
                err: {updageMsg: updateError}
              }
              console.log(response.statusCode);
              // console.log(response);
              console.log(body);
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
          user.save(function(err){
            if(err) return next(err);
            req.session.flash = {
              firstLogin: true
            }
            return res.redirect('user/edit/' + user.id)
          })
          

        } else if(insLastNameMatch.length === 0){
          // not in insightly!
          return res.send("Havent built this yet!");

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

    User.update(req.param('id'), {insightlyID: req.param('insightlyID')}, function(err){
      if(err) return next(err);

      req.session.flash = {
        firstLogin: true
      }
      return res.redirect('user/edit/' + req.param('id'));

    });

  },


};

/**
 * User.js
 *
 * @description :: A basic model of a user.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

	schema: true,

  attributes: {

  	email: {
  		type: 'string',
  		email: true,
  		required: true,
  		unique: true
  	},

  	encryptedPassword: {
  		type: 'string'
  	},

    admin: {
      type: 'boolean',
      defaultsTo: false
    },

    insightlyID: {
      type: 'string'
    },

    firstName: {
      type: 'string',
      required :true
    },

    lastName: {
      type: 'string',
      required :true
    },

    gradYear: {
      type: 'string',
      required :true
    },

    toJSON: function() {
      var obj = this.toObject();
      delete obj.encryptedPassword;
      return obj;
    }

  },

  beforeCreate: function (values, next) {

    require('bcrypt').hash(values.password, 10, function passwordEncrypted(err, encryptedPassword) {
      if (err) return next(err);
      values.encryptedPassword = encryptedPassword;
      // values.online= true;
      next();
    });
  },

  beforeUpdate: function (values, next) {

    if(values.password){
      require('bcrypt').hash(values.password, 10, function passwordEncrypted(err, encryptedPassword) {
        if (err) return next(err);
        values.encryptedPassword = encryptedPassword;
        // values.online= true;
        next();
      });
    } else {
      next();
    }
  },

};

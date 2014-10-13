// Start sails and pass it command line arguments
require('newrelic');
// var config = sails.util.merge(require('optimist').argv,{
//   hooks: {
//     sockets: false,
//     pubsub: false 
//   }
// });
// require('sails').lift(config);
require('sails').lift(require('optimist').argv);
module.exports.connections = {
  mongo: {
    adapter : 'sails-mongo',
  	url: process.env.MONGODB_URI,
  	schema: true
  }
};
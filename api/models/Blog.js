/**
 * Blog
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  schema: true,
  
  attributes: {
  	
    title: {
      type: 'string',
      required: true
    },
    
    author: {
      type: 'json',
      required: true
    },
    
    published: {
      type: 'boolean',
      defaultsTo: false
    },
    
    articleBody: {
      type: 'text',
      
    }
    
    
    
  }

};

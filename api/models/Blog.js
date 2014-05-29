/**
 * Blog
 *
 * @module      :: Model
 * @description :: This model represents blog articles. 
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
    
    pubDate: {
      type: 'string'
    },
    
    pubDateSort: {
      type: 'integer'
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

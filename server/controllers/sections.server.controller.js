
/* Dependencies */
var mongoose = require('mongoose'), 
    Section = require('../models/section.server.model.js');
    
/*
  In this file, you should use Mongoose queries in order to retrieve/add/remove/update listings.
  On an error you should send a 404 status code, as well as the error message. 
  On success (aka no error), you should send the listing(s) as JSON in the response.

  HINT: if you are struggling with implementing these functions refer back to this tutorial 
  https://www.callicoder.com/node-js-express-mongodb-restful-crud-api-tutorial/
  or
  https://medium.com/@dinyangetoh/how-to-build-simple-restful-api-with-nodejs-expressjs-and-mongodb-99348012925d
  

  If you are looking for more understanding of exports and export modules - 
  https://www.sitepoint.com/understanding-module-exports-exports-node-js/
  or
  https://adrianmejia.com/getting-started-with-node-js-modules-require-exports-imports-npm-and-beyond/
 */

/* Show the current listing */
exports.read = function(req, res) {
  /* send back the listing as json from the request */
  res.json(req.section);
};

/* Update a listing - note the order in which this function is called by the router*/
exports.update = function(req, res) {
  var section = req.section;
  var waspresent = false;

  console.log('got update request');
  console.log(req.body);

  if(section) { // Section was present
    console.log('section was present');
    waspresent = true;
    if(req.body.sectionname) section.sectionname = req.body.sectionname;
    if(req.body.questions) {
      console.log('updating questions');
      for(var qupdate in req.body.questions) {
        var updatedq = false;
        for(var question in section.questions) {
          if(section.questions[question].questionid == req.body.questions[qupdate].questionid) { // Found the question, update it
            console.log('found question to update');
            updatedq = true;
            section.questions[question].question = req.body.questions[qupdate].question;
            section.questions[question].tips = req.body.questions[qupdate].tips;
          }
        }
        if(!updatedq) { // Was not present to update, go ahead and add it
          console.log('inserting question');
          section.questions.push(req.body.questions[qupdate]);
        }
      }
    }
    if(req.body.removequestions) {
      section.questions = section.questions.filter(function (quest, index, array) {
        return !req.body.removequestions.includes(quest.questionid);
      });
      console.log('removed questions');
    }
  } else { // Section doesn't exist yet
    req.body.removequestions = undefined;
    console.log('inserting section');
    section = new Section(req.body);
    section.sectionid = req.params.sectionId;
  }

  console.log(section);
 
  /* Save the listing */
  section.save(err => {
    if(err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      if(waspresent) {
        res.status(200).end();
      } else {
        res.status(201).end();
      }
    }
  })

};

/* Delete a listing */
exports.delete = function(req, res) {
  var section = req.section;
  var isPresent = false;
  if(section) isPresent = true;

  /* Add your code to remove the listins */

  Section.deleteOne(section, err => {
    if(err) {
      console.log(err);
      res.status(400).send(err);
    } else {
      if(isPresent)
        res.status(200).end();
      else
        res.status(404).end();
    }
  });

};

/* Retreive all the directory listings, sorted alphabetically by listing code */
exports.list = function(req, res) {
  /* Add your code */

  Section.find({}).exec((err, sections) => {
    if(err) {
      console.log(err);
      res.status(400).send(err);
    } else {
      var respon = {sections : []};
      respon.sections = sections;
      if(req.query.include_questions != 'true') {
        var newrespon = {sections : []};
        for(var secti in respon.sections) {
          var sect = {
            sectionid: respon.sections[secti].sectionid,
            sectionname: respon.sections[secti].sectionname
          };
          newrespon.sections.push(sect);
        }
        respon = newrespon;
      }
      res.json(respon);
    }
  });
};

/* 
  Middleware: find a listing by its ID, then pass it to the next request handler. 

  HINT: Find the listing using a mongoose query, 
        bind it to the request object as the property 'listing', 
        then finally call next
 */
exports.sectionById = function(req, res, next, id) {
  req.sectionid = id;
  Section.findOne({sectionid:id}).exec(function(err, section) {
    if(err) {
      res.status(400).send(err);
      console.log(err);
    } else {
      req.section = section;
      next();
    }
  });
};
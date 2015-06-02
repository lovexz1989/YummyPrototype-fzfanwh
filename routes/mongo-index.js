/*jslint node:true*/

/*
 * GET home page.
 */

var services = JSON.parse(process.env.VCAP_SERVICES);
var rest = require('restler');

if (typeof services.mongolab !== 'undefined') {
    var mongoAddress = services.mongolab[0].credentials.uri;
    var mongodb = require('mongodb');
    var MongoClient = mongodb.MongoClient;
    var ObjectID = mongodb.ObjectID;    
}



// Render the Home page
exports.home = function(req, res) {
    res.render('home');
};


// Save a new item
exports.addItem = function(req, res) {
    console.log("Adding item");
    MongoClient.connect(mongoAddress, function(err, db) {
          if (err) throw err;
          console.log("We are connected to DB");
    
          var myCollection = db.collection('yummy-items');
    
          myCollection.insert({ timestamp: new Date().getTime(),
                              item: req.body.item,
                              url: req.body.url,
                              price: "",
                              rating: ""}, function(err, docs) {
                db.close();
                res.redirect('/wishlist');
          });
    });
};

 
// Delete a wishlist item
exports.removeItem = function(req, res) {
     console.log("Removing an item");
     var itemId = req.params.id;
        
    MongoClient.connect(mongoAddress, function(err, db) {
        db.collection('yummy-items', {}, function(err, wishlist) {
            wishlist.remove({_id: ObjectID(itemId)}, function(err, result) {
                if (err) {
                    console.log(err);
                }
                console.log(result);
                db.close();
                res.redirect('/wishlist');
            });
        });
    });
};


// Display the wishlist
exports.items = function (req, res) {
    console.log("Listing item");
    
    MongoClient.connect(mongoAddress, function(err, db) {
      if (err) throw err;
      console.log("We are connected to DB");
      var myCollection = db.collection('yummy-items');
    
      myCollection.find().toArray(function(err, docs) {
        if (docs === null) {
            console.log("No collection");
            db.close();
        }
        else {
            db.close();
            res.render('wishlist', {
            inventory : docs
           });
        }  
      });
    });
};


// get info from remote server
exports.getRemoteInfo = function (req, res) {

    console.log("Get info using REST API call");
    
    var itemId = req.params.id;
    MongoClient.connect(mongoAddress, function(err, db) {
        db.collection('yummy-items', {}, function(err, wishlist) {
            wishlist.findOne({_id: ObjectID(itemId)}, function(err, doc) {
                if (err) {
                    console.log(err);
                }
                console.log(doc);
                
                // format the Rest API URL /api/menuitem/:id'
                var targetURL  = doc.url.replace("/menuitem/", "/api/menuitem/");
                console.log("YummyRation REST..........:   " + targetURL);
                // Get infor from YummyRation (RESTful service)
                rest.get(targetURL).on('complete', function(info) {
                    if (info instanceof Error) {
                      console.log('Error:', info.message);
                      //this.retry(5000); // try again after 5 sec
                    } else {
                      console.log(info);
                      // Update the database
                      MongoClient.connect(mongoAddress, function(err, db) {
                            db.collection('yummy-items', {}, function(err, wishlist) {
                                wishlist.update({_id: ObjectID(itemId)},{ $set: {price: info.price , rating: info.rating}}, function(err, result) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    console.log(result);
                                    db.close();
                                    res.redirect('/wishlist');
                                });
                            });
                      });

                     }
                    
                    
                    
                    
                    
                    
                });
                
               
                db.close();
                //res.redirect('/action/wishlist');
            });
        });
    });

};
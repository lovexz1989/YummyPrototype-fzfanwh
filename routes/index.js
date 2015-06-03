/*jslint node:true*/

/*
 * GET home page.
 */

// Use rester for REST API calls
var rest = require('restler');


var dbCredentials = {
	dbName : 'my_sample_db'
};
var cloudant;


function initDBConnection() {
	
	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		if(vcapServices.cloudantNoSQLDB) {
			dbCredentials.host = vcapServices.cloudantNoSQLDB[0].credentials.host;
			dbCredentials.port = vcapServices.cloudantNoSQLDB[0].credentials.port;
			dbCredentials.user = vcapServices.cloudantNoSQLDB[0].credentials.username;
			dbCredentials.password = vcapServices.cloudantNoSQLDB[0].credentials.password;
			dbCredentials.url = vcapServices.cloudantNoSQLDB[0].credentials.url;
		}
		console.log('VCAP Services: '+JSON.stringify(process.env.VCAP_SERVICES));
	}

	cloudant = require('cloudant')(dbCredentials.url);
	
	//check if DB exists if not create
	cloudant.db.create(dbCredentials.dbName, function (err, res) {
		if (err) { console.log('could not create db ', err); }
    });
	db = cloudant.use(dbCredentials.dbName);
}


initDBConnection();




// Render the Home page
exports.home = function(req, res) {
    res.render('home');
};



// Display the wishlist
exports.items = function (req, res) {
    console.log("Listing item");
    
    db.list(function(err, docs) {
    	if (!err) {
			var len = docs.rows.length;
			console.log('total # of docs -> '+len);
			if(len !== 0) {
				var docList = [];
				var i = 0;
				docs.rows.forEach(function(document) {
					db.get(document.id, { revs_info: true }, function(err, doc) {
						if (!err) {
							console.log("Logging items............TEST Mardi Console");
							console.log(doc);
							docList.push(doc);
							i++;
							if(i >= len) {
								console.log("++++++++++++Number of items in the list"+ docList.length);
								res.render('wishlist', {
									inventory : docList
								});
	
							}
						}
						
					});
					
				});
			}
		}
    });
};



// Save a new item
exports.addItem = function(req, res) {
    console.log("Adding item");
    var id = '';
	db.insert({
		timestamp: new Date().getTime(),
        item: req.body.item,
        url: req.body.url,
        price: "",
        rating: ""
	}, id, function(err, doc) {
		if(err) {
			console.log(err);
			res.send(500);
		} else
			res.redirect('/wishlist');
	});
};



 
// Delete a wishlist item
exports.removeItem = function(req, res) {
     console.log("Removing an item");
     var itemId = req.params.id;
        
	db.get(itemId, { revs_info: true }, function(err, doc) {
			if (!err) {
				db.destroy(doc._id, doc._rev, function (err, result) {
					// Handle response
					if(err) {
						console.log(err);
						res.send(500);
					} else {
						res.redirect('/wishlist');
					}
				});
			}
		});
};





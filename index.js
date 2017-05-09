'use strict';

var express = require("express");
var mongodb = require("mongodb");
var bodyParser = require("body-parser");
//var dotenv = require("dotenv");
//dotenv.load();

var app = express();
var mongoClient = mongodb.MongoClient;
var port = process.env.PORT || 5000;
var dburl = process.env.MONGO_URI;


class URL {
    
    
    
    constructor() {
        this.url = "";
        var pMethod = "";
    };
    
    /*getarea = function () {
        
    };*/
};

function getRandomIP()
{
    var randomIP = Math.floor(Math.random() * (255 - 1)) + 1;
    return randomIP;
}

function getShortUrl(db, urls, url, response) {

    

    // CHECK IF SHORTURL EXISTS FOR FULLURL FIRST
    urls.findOne({
        fullurl: url
    }, function(err, item) {
        if (err) {
            console.log(err);
        }
        else if (item) {
            var urlObject = {
                "original_url": url,
                "short_url": "https://urlshortened.herokuapp.com/" + item.shorturl
            };
            response.send(urlObject);
            db.close();

        }
        else {
            var randomShortUrl = Math.floor(Math.random() * (65000 - 1001)) + 1000;

            urls.count({
                shorturl: randomShortUrl
            }, function(err, count) {
                if (err) return console.log(err);

                if (count === 0) {
                    var urlObject = {
                        "original_url": url,
                        "short_url": "https://urlshortened.herokuapp.com/" + randomShortUrl
                    };

                    // INSERT INTO MONGO
                    urls.insert({
                        shorturl: randomShortUrl,
                        fullurl: url
                    }, function(err, ids) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            response.send(urlObject);
                        }

                        db.close();
                    });
                }
                else {
                    getShortUrl(db, urls, url, response);
                }
            });
        }
    });
};

app.use(bodyParser.urlencoded({
    extended: false
}));

app.get("/short/:SHORT", function(request, response) {
    var shortUrl = request.params.SHORT;
    var shortIntUrl = parseInt(shortUrl);
    console.log(request.url);

    if (shortIntUrl) {
        mongoClient.connect(dburl, function(err, db) {
            if (err) {
                console.log(err);
            }
            else {
                var urls = db.collection("url");

                // fIND URL IF SHORT URL AND REDIRECT TO PAGE
                urls.findOne({
                    shorturl: shortIntUrl
                }, function(err, item) {
                    if (err) {
                        console.log(err);
                    }
                    else if (item) {
                        response.writeHead(301, {
                            Location: item.fullurl
                        });
                        response.end();
                    }
                    else {
                        response.send("Short URL does not exist.");
                    }

                    db.close();
                });
            }
        });
    }
    else {
        response.send("Invalid shortened URL");
    }
});

app.get("/random", function (request,response) {
   
   var ip = "";
   
   for (var i = 0; i < 4; i++)
   {
       ip += getRandomIP() + ".";
   }
   
   ip = ip.substring(0,ip.length-1);
   
   response.send({"random":ip});
    
});

app.get("*", function(request, response) {

    if (request.url.indexOf("/new/") > -1) {
        var url = request.url.replace("/new/", "");

        mongoClient.connect(dburl, function(err, db) {
            if (err) {
                console.log(err);
            }
            else {
                var urls = db.collection("url");

                // FIRST GET SHORTENED URL VIA RANDOM
                getShortUrl(db, urls, url, response);
            }
        });
    }
    else {
        response.send("404!");
    }

});

app.listen(port, function() {
    console.log("App listening on port " + port);
});

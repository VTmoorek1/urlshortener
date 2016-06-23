var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");

var app = express();
var mongoClient = mongodb.MongoClient;
var port = process.env.PORT || 5000;
var dburl = "mongodb://localhost:27017/testdb";


function getShortUrl(db,urls,url,response) {
    var randomShortUrl = Math.floor(Math.random() * (65000 - 1001)) + 1000;

    urls.count({
        shorturl: randomShortUrl
    }, function(err, count) {
        if (err) return console.log(err);

        if (count === 0) {
            var urlObject = { "original_url":url,
            "short_url":"https://urlshortened.herokuapp.com/" + randomShortUrl};
            
            // INSERT INTO MONGO
            urls.insert({shorturl:randomShortUrl,fullurl:url}, function (err,ids) {
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
            getShortUrl(db,urls);
        }
    });
}

app.use(bodyParser.urlencoded({
    extended: false
}));

app.get("/:SHORT", function(request, response) {
    var shortUrl = request.params.SHORT;
    var shortIntUrl = parseInt(shortUrl);
    console.log(request.url);
    
    if (shortIntUrl)
    {
       mongoClient.connect(dburl, function(err, db) {
        if (err) {
            console.log(err);
        }
        else {
            var urls = db.collection("url");

            // fIND URL IF SHORT URL AND REDIRECT TO PAGE
            urls.findOne({shorturl:shortIntUrl}, function (err,item) {
                if (err) { 
                    console.log(err);
                }
                else if (item) {
                    response.writeHead(301,
                      {Location: item.fullurl}
                    );
                    response.end();
                }
                else
                {
                    response.send("Short URL does not exist."); 
                }
                
                db.close();
            });
        }
    }); 
    }
    else
    {
        response.send("Invalid shortened URL");
    }
});

app.get("/new/:FULLURL", function(request, response) {
    var url = request.params.FULLURL;

    mongoClient.connect(dburl, function(err, db) {
        if (err) {
            console.log(err);
        }
        else {
            var urls = db.collection("url");

            // FIRST GET SHORTENED URL VIA RANDOM
            getShortUrl(db,urls,url,response);
        }
    });
});

app.get("*", function(request, response) {
    response.end("404!");
});

app.listen(port, function() {
    console.log("App listening on port " + port);
});

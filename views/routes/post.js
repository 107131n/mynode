const { MongoDriverError } = require('mongodb');

var router = require('express').Router();

var mongodbclient = require('mongodb').MongoClient;
const url = process.env.DB_URL;
const ObjId = require('mongodb').ObjectId;


let mydb;

mongodbclient.connect(url)
    .then(client => {
        mydb = client.db('myboard');

        console.log('몽고DB 접속 성공');
        
    })
    .catch(err =>{
        console.log(err);
    })

    router.get('/list', function(req, res){

        mydb.collection('post').find().toArray()
        .then(result => {
            res.render('list.ejs', {data : result});
        })    
    })


module.exports = router
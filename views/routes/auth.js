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

    router.get('/login', function(req, res){
        console.log(req.session);
        if(req.session.user){
            console.log('세션 유지');
            res.render('index.ejs', { user : req.session.user})
        }else{
            res.render('login.ejs');
        }  
    })
    
    router.post('/login', function(req, res){
        //1. 브라우저에서 입력한 id,pw 가져오기
        console.log('아이디 : ' + req.body.userid);
        console.log('비밀번호 : ' + req.body.userpw);
        
        //2. DB에서 id,pw 가져오기
        //몽고DB에 데이터 저장하기
         mydb.collection('account')
         .findOne({userid : req.body.userid })
         .then(result => {
            if(result.userpw == sha(req.body.userpw)){
                req.session.user = req.body;
                console.log('새로운 로그인');
                res.render('index.ejs', { user : req.session.user})
            }else{
                res.send('비밀번호가 틀렸습니다.');
            }
        })
        .catch(err =>{
            res.send('아이디를 찾지 못했습니다.');
        })  
    })

module.exports = router
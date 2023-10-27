// MySQL + Node.js 접속 코드
let mysql = require('mysql');

var conn = mysql.createConnection({
    host : "127.0.0.1",
    user : "root",
    password : "123456",
    database : "myboard"
});

conn.connect();

// 몽고DB 접속 코드

var mongodbclient = require('mongodb').MongoClient;
const url = 'mongodb+srv://admin:a123456@cluster0.fjrr7ma.mongodb.net/?retryWrites=true&w=majority';
const ObjId = require('mongodb').ObjectId;


let mydb;

mongodbclient.connect(url)
    .then(client => {
        mydb = client.db('myboard');

        console.log('몽고DB 접속 성공');

        app.listen(8080, function(){
            console.log("포트 8080 서버 대기 중...");
        })
    })
    .catch(err =>{
        console.log(err);
    })

const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();

// 패스포트 설정
const passport = require('passport');
const LocalStrategy = require("passport-local").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

const sha = require('sha256');

app.set('view engine', 'ejs');

// cookie-parser 미들웨어 추가
let cookieParser = require('cookie-parser');

app.use(cookieParser('dltmdguqqkqh'));

app.get('/cookie', function(req, res){
    let milk = parseInt(req.signedCookies.milk) + 1000
    if(isNaN(milk)){ // NaN은 Not a Number
        milk = 0;
    }
    res.cookie('milk', milk, {signed : true}); // 쿠키 생성 // cookie(키, 값, {maxAge : 보관시간(ms)})
    res.send('product : ' + milk + '원'); // 쿠키를 브라우저로 전송
    res.clearCookie('milk');
})

app.get('/clear', function(req, res){
    res.clearCookie('milk');
    res.send('쿠키가 제거되었습니다.');
})


// expression-session 미들웨어 추가
let session = require('express-session');

app.use(session({
    secret : 'dltmdguqtoddlfcnzk',
    resave : false,
    saveUninitialized : true
}));

app.get('/session', function(req, res){
    if(isNaN(req.session.milk)){
        req.session.milk = 0;
    }
    req.session.milk = req.session.milk + 1000;
    res.send("session : " + req.session.milk + "원");
})


app.use(passport.initialize());
app.use(passport.session());


// body-parser 미들웨어 추가
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));


// '/book' 요청 시 처리 코드
app.get('/book', function(req, res){
    console.log('도서 목록 관련 페이지입니다.');
    res.send('도서 목록 관련 페이지')
})

app.get('/', function(req, res){
    res.sendFile(__dirname + '/views/index.ejs');
})

app.get('/list', function(req, res){
    // query("요청 쿼리문", 콜백 함수)
    // conn.query("select * from post", function(err, rows, fields){
    //     if(err) throw err;
    //     console.log(rows);
    // })  

    mydb.collection('post').find().toArray()
    .then(result => {
        res.render('list.ejs', {data : result});
    })
    // res.sendFile(__dirname + '/list.html');
    
})


app.get('/content/:id', function(req, res){
    console.log(req.params.id);

    req.params.id = new ObjId(req.params.id);
    mydb.collection("post")
    .findOne({_id : req.params.id})
    .then((result) => {
        console.log(result);
        res.render('content.ejs', {data : result});
    })
})

app.get('/enter', function(req, res){
    //res.sendFile(__dirname + '/enter.html');
    res.render('enter.ejs');
})

app.post('/save', function(req,res){
    console.log(req.body);
    console.log(req.body.content);
    console.log(req.body.someDate);
    
/////////////// 몽고DB에 데이터 저장하기 //////////
    mydb.collection('post').insertOne(
        {
            title : req.body.title,
            content : req.body.content,
            date : req.body.someDate
        }).then(result => {
            console.log(result);
            console.log('데이터 추가 성공');
        })
})

app.post('/edit/:id', function(req, res){
    console.log(req.params.id);

    req.params.id = new ObjId(req.params.id);
    mydb.collection("post")
    .findOne({_id : req.params.id})
    .then((result) => {
        console.log(result);
        res.render('edit.ejs', {data : result});
    })})


app.post('/delete', function(req, res){
    console.log(req.body._id);
    // deleteOne, deleteMany
    req.body._id = new ObjId(req.body._id);
    console.log(req.body._id)
    mydb.collection('post').deleteOne(req.body)
    .then(result => {
        console.log('삭제 완료');
        res.status(200).send();
    })
    .catch(err => {
        console.log(err);
        res.status(500).send();
    })
})

    // MySQL DB에 데이터 저장하기
    // let sql = "INSERT INTO post(title, content, created) values(?, ?, NOW())";
    // let params = [req.body.title, req.body.content];
    // conn.query(sql, params, function(err, result){
    //     if(err) throw err;
    //     console.log("데이터 추가 성공");
    // });


    app.post('/edit', function(req, res){

        console.log(req.body);
        req.body.id = new ObjId(req.body.id);

        // 몽고 DB에 데이터 저장하기
        mydb
        .collection('post')
        .updateOne({_id : req.body.id},
            {$set : {title : req.body.title, content : req.body.content, date : req.body.someDate}}
            
        ).then(result => {
            console.log('수정 완료');
            res.redirect('/list');
        })
        .catch(err => {
            console.log(err);
        })
    })

app.get('/login', function(req, res){
    console.log(req.session);
    if(req.session.user){
        console.log('세션 유지');
        res.render('index.ejs', {user : req.session.user});
    }
    else{
        res.render('login.ejs');
    }
})

app.post('/login', 
    passport.authenticate("local",{
        succeessRedirect : "/",
        failureRedirect : "/login"
    }), 
    function(req, res){
        console.log(req.session);
        console.log(req.session.passport);
    }
);

passport.use(new LocalStrategy(
    {
        usernameField : "userid",
        passwordField : "userpw",
        session : true,
        passReqToCallback : false
    },

    function(inputid, inputpw, done){
        mydb.collection('account')
        .findOne({userid : inputid})
        .then((result) => {
            if(result.userpw == sha(inputpw))
            {
                console.log('새로운 로그인');
                done(null, result);
            }
            else
            {
                console.log('비밀번호가 틀렸습니다.');
                done(null, false, {message : "비밀번호가 틀렸습니다."});
            }
        })
    }
))

// 최초 로그인
passport.serializeUser(function(user, done){
    console.log('serializerUser');
    console.log(user);
    done(null, user)
})

// 세션 유지
passport.deserializeUser(function(puserid, done){
    console.log('deserializerUser');
    console.log(puserid);

    mydb.collection('account')
    .findOne({userkey : user.userkey})
    .then(result => {
        console.log(result);
        done(null, result);
    })
})


app.get('/logout', function(req, res){
    console.log('로그아웃');
    req.session.destroy();
    res.render('index.ejs', {user : null});
})

app.get('/signup', function(req, res){
    res.render('signup.ejs');
})

app.post('/signup', function(req, res){
    console.log(req.body.userid);
    console.log(sha(req.body.userpw));
    console.log(req.body.usergroup);
    console.log(req.body.useremail);

    mydb.collection('account')
    .insertOne({ 
        userid : req.body.userid, 
        userpw : sha(req.body.userpw),
        usergroup : req.body.usergroup,
        useremail : req.body.useremail
    })
    .then(result => {
       console.log('회원 가입 성공했습니다.');
    })
    res.redirect('/');
})

app.get('/facebook', passport.authenticate('facebook'));

app.get(
    'facebook/callback',
    passport.authenticate(
        'facebook',
    {
        succeessRedirect : '/',
        failureRedirect : 'fail'
    }),
    function (req, res){
        console.log(req.session);
        console.log(req.session.passport);
        res.render('index.ejs', {user : req.session.passport});
    }
)

app.get('/login', function(req, res){
    console.log(req.session);
    if(req.session.user){
        console.log('세션 유지');
        res.render('index.ejs', {user : req.session.user});
    }
    else{
        res.render('login.ejs');
    }
})

app.post('/login', 
    passport.authenticate("local",{
        succeessRedirect : "/",
        failureRedirect : "/login"
    }), 
    function(req, res){
        console.log(req.session);
        console.log(req.session.passport);
    }
);

passport.use(new FacebookStrategyStrategy(
    {
       clientId : '',
       clientSecret : '',
       callback : '/facebook/callback'
    },

    function(accessToken, refreshToken, profile, done){

        let authkey = 'facebook' + profile.id;
        let authName = profile.displayName;

        let loop = 0;
        mydb.collection('account')
        .findOne({userid : authkey})
        .then((result) => {
            if(result != null)
            {
                done(null, result);
            }
            else
            {
                mydb.collection('account')
                .insertOne({
                    userkey : authkey,
                    userid : authName
                })
            }
        })
        .catch(error => {
                done(null, false, error)
        })
        loop++;    
    }
))


//서버는 껐다 켜야 결과가 반영됨
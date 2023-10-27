// MySQL + Node.js 접속 코드
let mysql = require('mysql');

var conn = mysql.createConnection({
    host : "127.0.0.1",
    user : "root",
    password : "123456",
    database : "myboard"
});

conn.connect();


const dotenv = require('dotenv').config();



// 몽고DB 접속 코드

var mongodbclient = require('mongodb').MongoClient;
const url = process.env.DB_URL;
const ObjId = require('mongodb').ObjectId;


let mydb;

mongodbclient.connect(url)
    .then(client => {
        mydb = client.db('myboard');

        console.log('몽고DB 접속 성공');

        app.listen(process.env.PORT, function(){
            console.log("포트 8080 서버 대기 중...");
        })
    })
    .catch(err =>{
        console.log(err);
    })

const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();

let imagepath = '';

const sha = require('sha256');

app.set('view engine', 'ejs');

app.use('/public', express.static('public'));

app.use('/', require('./routes/post.js'));
app.use('/', require('./routes/auth.js'));
app.use('/', require('./routes/add.js'));


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


app.post('/save', function(req,res){
    console.log(req.body);
    console.log(req.body.content);
    console.log(req.body.someDate);
    
/////////////// 몽고DB에 데이터 저장하기 //////////
    mydb.collection('post').insertOne(
        {
            title : req.body.title,
            content : req.body.content,
            date : req.body.someDate,
            path : imagepath
        }).then(result => {
            console.log(result);
            console.log('데이터 추가 성공');
        })
})

app.get('/edit/:id', function(req, res){
    //console.log(req.params.id);

    req.params.id = new ObjId(req.params.id);
    mydb.collection("post")
    .findOne({ _id : req.params.id })
    .then((result)=>{
        console.log(result);
        res.render('edit.ejs', {data : result});
    })
})

app.post('/edit', function(req, res){

    console.log(req.body.id);
    req.body.id = new ObjId(req.body.id);

    console.log(req.body.content);
    //몽고DB에 데이터 저장하기
    mydb.collection('post').updateOne({_id : req.body.id}, 
        {$set : {title : req.body.title, content : req.body.content, date : req.body.someDate}}
        ).then(result => {
            console.log(result);
            console.log('수정완료');
            res.redirect('/list');
        })
        .catch(err =>{
            console.log(err);
        })

})


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
    mydb.collection('post')
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


let multer = require('multer');

let storage = multer.diskStorage({ // memoryStorage()
    destination : function(req, file, done){
        done(null, './public/image')
    },
    filename : function(req, file, done){
        done(null, file.originalname)
    }

})

let upload = multer({storage : storage});


app.post('/photo', upload.single('picture'), function(req, res){
    console.log('서버에 파일 첨부하기');
    console.log(req.file.path);
    imagepath = '\\' + req.file.path; // public\image\lee1.jfif
})

app.get('/search', function(req, res){
    console.log(req.query);
    mydb.collection('post')
    .find({title : req.query.value}).toArray()
    .then((result) => {
        console.log(result);
        res.render('sresult.ejs', {data : result});
    })
})

//서버는 껐다 켜야 결과가 반영됨

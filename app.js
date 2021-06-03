//Name is name of test created by school teacher
//Uname is name of student


require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const ejs = require("ejs");
var session = require('express-session');
const MemoryStore = require('memorystore')(session);
const passport = require('passport');
const { google } = require("googleapis");


const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const fs = require('fs');


const date = require(__dirname + "/appfiles/date.js");
var uniqueValidator = require('mongoose-unique-validator');

const findOrCreate = require("mongoose-findorcreate");
const passportLocalMongoose = require("passport-local-mongoose");
const { parse } = require('path');
const nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'subashraj89304@gmail.com',
        pass: 'sagarseth'
    }
});







var count = [];
for (var i = 0; i <= 100000; i++) {
    count.push(i);
}
var rnd1 = count[Math.floor(Math.random() * count.length)];
var rnd2 = count[Math.floor(Math.random() * count.length)];
var rnd = rnd1 + rnd2;
var Name; //Name is name of test created by school teacher
var Uname; //Uname is name of user or student
var counter = 0;

var visit;



const app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');

var cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(session({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,

}));


app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

mongoose.connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
});



//const mongoURI = "mongodb://localhost:27017/etestzoneDB";
//const conn = mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });




var userSchema = new mongoose.Schema({

    local: {
        username: String,
        password: String
    },
    name: String,
    googleId: String

});


var resultSchema = new mongoose.Schema({
    test_name: { type: String, required: true, unique: true },
    teacher: String,
    result: Array
});

var testSchema = new mongoose.Schema({
    // test_no: String,
    name: String,
    teacher: String,
    no: Number,
    date: String,
    etime: String,
    timer: Number,
    pmarks: Number,
    nmarks: Number,
    tmarks: Number,
    question: [Array]
});


var mypdfSchema = new mongoose.Schema({
    domain: String,
    name: String,
    image: String,
    pdf: String,
    teacher: String,
    division: String
});

var reviewSchema = new mongoose.Schema({
    domain: String,
    tsname: String,
    total: Number,
    comments: Array
});


var mytnameSchema = new mongoose.Schema({
    tname: String,
    questions: Array
});

const Mytname = new mongoose.model("Mytname", mytnameSchema);

var mytestSchema = new mongoose.Schema({
    domain: String,
    total_test: Number,
    completed: String,
    qno: Number,
    tsname: String,
    teacher: String,
    no: Number,
    notification: String,
    pmarks: Number,
    rating: Number,
    nmarks: Number,
    tmarks: Number,
    amount: Number,
    date: String,
    etime: String,
    time: Number,
    test: [mytnameSchema]
});




var acessSchema = new mongoose.Schema({
    mytestname: String,
    acess: [Array]
});


var myresultSchema = new mongoose.Schema({
    key: String,
    results: Array
});
const Myresult = new mongoose.model('Myresult', myresultSchema);


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
resultSchema.plugin(uniqueValidator);
const Result = new mongoose.model('Result', resultSchema);
const Test = new mongoose.model('Test', testSchema);
const Mytest = new mongoose.model('Mytest', mytestSchema);
const Acess = new mongoose.model('Acess', acessSchema);
const Mypdf = new mongoose.model('Mypdf', mypdfSchema);
const Review = new mongoose.model('Review', reviewSchema);



passport.use(User.createStrategy());


passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});




var g = 0;
app.get("/", function(req, res) {
    res.render("index", { g: g });
    g = 0;
});


app.get('/index', function(req, res) {
    res.render("index");
});

app.get('/login', function(req, res) {
    res.render("login", { g: g });
});

app.get('/signup', function(req, res) {
    res.render('signup', { g: g });
});

app.get('/contact', function(req, res) {
    res.render('bcontact');
});




app.get('/sitemap.xml', function(req, res) {
    res.sendFile('/sitemap.xml');
});


app.get('/robots.txt', function(req, res) {
    res.sendFile('/robots.txt');
});


app.get('/sitemap.xml/BingSiteAuth.xml', function(req, res) {
    res.sendFile('/BingSiteAuth.xml');
});

app.use(function(req, res, next) {
    res.removeHeader("X-Powered-By");
    next();
});


//my drive image uploads begin here


const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);


oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
});




const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/")
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    },
})

const uploadStorage = multer({ storage: localStorage });



async function generatelink(fileid, type) {
    //console.log("here we are");
    try {
        await drive.permissions.create({
            fileId: fileid,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });
        const result = await drive.files.get({
            fileId: fileid,
            fields: 'webViewLink,webContentLink'
        });

        if (type == 'application/pdf') {
            //console.log("this is a pdf");
            //console.log(result.data);
            var link = result.data.webViewLink;
        } else {
            var link = "https://drive.google.com/thumbnail?id=" + fileid.toString();
        }
        //console.log(link);
        return link;
    } catch (error) {
        console.log(error.message);
    }
}



async function uploadFile(myimage) {
    try {
        //console.log(myimage);
        const response = await drive.files.create({
            requestBody: {
                name: myimage.originalname,
                mimeType: myimage.mimetype
            },
            media: {
                mimeType: myimage.mimetype,
                body: fs.createReadStream(myimage.path)
            }
        });

        var link = await generatelink(response.data.id, myimage.mimetype);
        //console.log(link);
        return link;
    } catch (error) {
        console.log(error.message);
    }

}


async function delete_from_drive(image_id) {
    try {
        const response = await drive.files.delete({
            fileId: image_id,
        });
        //console.log(response.status);
    } catch (error) {
        console.log(error.message);
    }
}





app.post('/mydrive_pdf_info', uploadStorage.array('mypdf', 2), async function(req, res) {


    if (!req.files) {
        //console.log("no file");
    } else if (req.files.length == 1) {
        var mypdf = req.files[0];
        var pdflink = await uploadFile(mypdf);
        var pdf = new Mypdf({
            name: req.body.fname,
            domain: req.body.domain,
            image: 'https://drive.google.com/thumbnail?id=1g933aAAk4X33UCF5Xh3sF7nQUD5W-h8c',
            pdf: pdflink,
            teacher: req.user.username,
            division: req.body.division
        });
        pdf.save();
        fs.unlinkSync(mypdf.path);
        res.json({ file: req.files });
    } else {
        //console.log(req.files);
        if (req.files[0].mimetype == 'application/pdf') {
            var mypdf = req.files[0];
            var image = req.files[1];
        } else {
            var mypdf = req.files[1];
            var image = req.files[0];
        }

        // console.log(pdf.originalname);
        // console.log(image.originalname);

        async function insert() {
            var pdflink = await uploadFile(mypdf);
            var imagelink = await uploadFile(image);

            var pdf = new Mypdf({
                name: req.body.fname,
                domain: req.body.domain,
                image: imagelink,
                pdf: pdflink,
                teacher: req.user.username,
                division: req.body.division
            });
            pdf.save();
            res.json({ file: req.files });
        }
        await insert();

        fs.unlinkSync(mypdf.path);
        fs.unlinkSync(image.path);
    }
});





app.delete("/delfiles/:filename", (req, res) => {

    console.log("reached in delete");
    Mypdf.findOne({ _id: req.params.filename }, function(err, file) {
        var myimage = file.image;
        myimage = myimage.substring(38);
        if (myimage != '1g933aAAk4X33UCF5Xh3sF7nQUD5W-h8c') {
            delete_from_drive(myimage);
        }
        var mypdf = file.pdf;
        mypdf = mypdf.substring(32, mypdf.length);
        mypdf = mypdf.slice(0, -18);
        delete_from_drive(mypdf);
    });


    Mypdf.deleteOne({ _id: req.params.filename }, function(err) {
        if (err) return handleError(err);
    });
    res.redirect('/uploaded_files');
});




//my drive image uploads ends here


















// app.post("/mypdf_info", function(req, res) {
//     //console.log(req.files[0].filename);

//     var pdf = new Mypdf({
//         name: req.body.fname,
//         domain: req.body.domain,
//         image: req.body.image,
//         pdf: req.body.pdf,
//         teacher: req.user.username,
//         division: req.body.division
//     });
//     pdf.save();

//     res.json({ file: req.files });
// });


//my authentication


// app.delete("/delfiles/:file", function(req, res) {
//     Mypdf.deleteOne({ _id: req.params.file }, function(err) {
//         if (err) return handleError(err);
//     });
// });

app.get("/uploaded_files", function(req, res) {
    Mypdf.find({ teacher: req.user.username }, null, { sort: { division: -1 } }, function(err, found) {
        res.render("myUploaded_files", { files: found });
    });
});


app.get('/my2001', function(req, res) {
    res.render('my_home');
});

app.get('/my_signup', function(req, res) {
    res.render('my_signup');
});

app.get('/my_signin', function(req, res) {
    res.setHeader('content-Type', 'text/html');
    res.render('my_signin');
});

app.post("/my_signup", function(req, res) {

    if (req.body.key == process.env.KEY) {
        User.register({ username: req.body.username, active: false }, req.body.password, function(err, user) {

            if (err) {
                console.log(err);
                res.redirect("/my_signup");
            } else {
                passport.authenticate("local")(req, res, function() {
                    res.redirect("/my_page");
                });
            }
        });
    } else {
        console.log('unvalid key');
        res.redirect("/my2001");
    }
});

app.post("/my_signin", function(req, res) {
    if (req.body.key == process.env.KEY) {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        req.login(user, function(err) {
            if (err) {
                return next(err);
            } else {
                passport.authenticate("local")(req, res, function() {
                    res.redirect("/my_page");
                });
            }
        });
    } else {
        console.log('unvalid key');
    }
});


app.get('/my_page', function(req, res) {
    //console.log('reached');
    var test = [];
    var tname = req.user.username;
    //console.log(tname);
    var name = tname.substring(0, tname.length - 10);
    Mytest.find({ teacher: tname }, function(err, found) {

        //console.log(' ');

        res.render('my_page', {
            user: name,
            tests: found

        });
    });

});

app.get("/upload_pdf", function(req, res) {
    res.render('my_pdf_info');
});

app.get('/mytest_create', function(req, res) {
    visit = 0;
    res.render('mytest_info', { visit: visit });
});

app.post("/mpdf_info", function(req, res) {
    var fname = req.body.fname;
    //console.log(fname);
    var myfile = req.body.myfile;
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        res.write('File uploaded', files);

        res.end();
        // console.log("files");
        // console.log(files.type);
        // console.log("fields");
        // console.log(fields);
        var pdf = new Mypdf({
            domain: req.body.domain,
            name: myfile,
            pdf: files
        });
        pdf.save();
    });

    //console.log(myfile);
});

app.post("/mytest_info", function(req, res) {
    Mytest.findOne({ tsname: req.body.tsname, teacher: req.user.username }, function(err, found) {
        if (found) {
            visit = 1;
            res.render('mytest_info', { visit: visit });
        } else {
            var y;
            var x = req.body.nmark;
            if (x < 0) {
                y = (-(x));
            } else {
                y = x;
            }

            var test_series = req.body.tsname;
            var mytest = req.body.tname;

            const newtest = new Mytest({

                tsname: req.body.tsname,
                domain: req.body.domain,
                teacher: req.user.username,
                time: req.body.time,
                pmarks: req.body.mark,
                nmarks: y,
                notification: "no",
                total_test: 1,
                rating: 4,
                completed: "no",
                qno: req.body.qno,
                tmarks: req.body.tmarks,
                amount: req.body.amount,
                test: { tname: req.body.tname, questions: [] }
            });
            newtest.save();

            const itsreview = new Review({
                domain: req.body.domain,
                tsname: req.body.tsname,
                total: 0,
                comments: []
            });
            itsreview.save();

            var mykey = req.body.domain + req.body.tsname + req.body.tname;
            const tresult = new Myresult({
                key: newtest.test[0]._id,
                results: [{ name: 'sagar', marks: 0, result: [] }]
            });
            tresult.save();
            res.redirect('/mytest/' + req.body.tsname + '/' + req.body.tname);
        }
    });
});



app.post('/selected_test_series', function(req, res) {
    Mytest.findOne({ tsname: req.body.test_series }, function(err, found) {
        //console.log(found.test);
        var test_names = [];
        for (var i = 0; i < found.test.length; i++) {
            test_names.push({ tname: found.test[i].tname });
        }
        var USER = req.user.username;
        res.render('test_series', {
            user: USER,
            tests: test_names,
            test_series: found.tsname,
            ts_id: found._id,
            domain: found.domain
        });
    });
});


app.post("/publish_ts", function(req, res) {
    //console.log(req.body.ts_id);
    Mytest.findOne({ _id: req.body.ts_id }, function(err, found) {
        //console.log(req.body.completed);
        //console.log(found);
        found.completed = req.body.completed;
        found.save();
    });
});

app.post("/my_tests", function(req, res) {
    var test_series = req.body.test_series;
    var mytest = req.body.test;
    res.redirect('/mytest/' + test_series + '/' + mytest);
});

app.get('/mytest/:test_series/:mytest', function(req, res) {
    Mytest.findOne({ tsname: req.params.test_series, teacher: req.user.username }, function(err, found) {

        if (found.test == null) {
            res.render('mytest', {
                testname: req.params.mytest,
                no: found.no,
                pmark: found.pmarks,
                nmark: found.nmarks,
                tmark: found.tmark,
                time: found.time,
                show: show
            });
        } else {

            found.test.forEach(paper => {
                //console.log(paper.tname);
                //console.log(mytest);
                //console.log(" ");
                if (paper.tname == req.params.mytest) {
                    var no = paper.questions.length;
                    //console.log(no);
                    // var show = 0;
                    //console.log(req.params.mytest);
                    res.render('mytest', {
                        testname: paper.tname,
                        tsname: found.tsname,
                        questions: paper.questions,
                        no: no,
                        pmark: found.pmarks,
                        nmark: found.nmarks,
                        tmark: found.tmark,
                        time: found.time,
                        //show: show
                    });
                }
            });
        }
    });
});

app.post('/my_create', function(req, res) {
    //console.log("add a question");
    Mytest.findOne({ tsname: req.body.test_series, teacher: req.user.username }, function(err, found) {
        //console.log(found.test[0].tname);
        var x = found.test.length;
        for (var i = 0; i < x; i++) {
            if (found.test[i].tname == req.body.tname) {
                found.test[i].questions.push({
                    question: req.body.Q,
                    a: req.body.a,
                    b: req.body.b,
                    c: req.body.c,
                    d: req.body.d,
                    ans: req.body.A
                });
                found.test[i].markModified("question");
                found.save();
            }
        }
    });
    res.redirect('/mytest/' + req.body.test_series + '/' + req.body.tname);
});



app.post('/my_create_image', uploadStorage.array('image', 2), async function(req, res) {
    //console.log("add a question");


    if (!req.files) {
        //console.log("no file");
    } else {
        console.log(req.files);
        if (req.files[0].originalname < req.files[1].originalname) {
            var question = req.files[0];
            var answer = req.files[1];
        } else {
            var question = req.files[1];
            var answer = req.files[0];
        }
        // console.log(req.body.test_series);
        // console.log(req.body.tname);
        // console.log(question.path);
        // console.log(answer.path);



        async function insert() {
            var qlink = await uploadFile(question);
            //console.log(qlink);
            var alink = await uploadFile(answer);
            //console.log(alink);

            Mytest.findOne({ tsname: req.body.test_series, teacher: req.user.username }, function(err, found) {
                //console.log(found.test[0].tname);
                var x = found.test.length;
                for (var i = 0; i < x; i++) {
                    if (found.test[i].tname == req.body.tname) {

                        found.test[i].questions.push({
                            question: qlink,
                            a: req.body.a,
                            b: req.body.b,
                            c: req.body.c,
                            d: req.body.d,
                            ans: req.body.A,
                            solution: alink
                        });
                        found.test[i].markModified("question");
                        found.save();

                    }

                }
            });
        }
        await insert();
        fs.unlinkSync(question.path);
        fs.unlinkSync(answer.path);
        res.redirect('/mytest/' + req.body.test_series + '/' + req.body.tname);
    }
});






app.post('/add_test', function(req, res) {
    var test_series = req.body.test_series;
    var mytest = req.body.tname;
    Mytest.findOne({ tsname: test_series, teacher: req.user.username }, function(err, found) {
        const mtest = new Mytname({
            tname: mytest,
            questions: []
        });
        found.test.push(mtest);
        found.total_test = parseInt(found.total_test) + 1;
        found.save();
        var mykey = req.body.domain + req.body.test_series + req.body.tname;
        const tresult = new Myresult({
            key: mtest._id,
            results: [{ name: 'sagar', marks: 0, result: [] }]
        });
        tresult.save();
    });
    res.redirect('/mytest/' + test_series + '/' + mytest);
});


app.post('/my_delete', function(req, res) {

    Mytest.findOne({ tsname: req.body.test_series, teacher: req.user.username }, function(err, found) {
        found.test.forEach(paper => {
            mytest = req.body.tname;
            if (paper.tname == mytest) {
                var length = paper.questions.length;
                for (var i = 0; i < length; i++) {
                    if (i == req.body.qno - 1) {
                        var question_id = paper.questions[i].question;
                        var solution_id = paper.questions[i].solution;
                        question_id = question_id.substring(38);
                        solution_id = solution_id.substring(38);
                        delete_from_drive(question_id);
                        delete_from_drive(solution_id);
                        paper.questions.splice(i, 1);
                    }
                }
            }
        });
        found.save();
    });
    res.redirect('/mytest/' + req.body.test_series + '/' + req.body.tname);
});


app.get("/quick_test", function(req, res) {
    visit = 0;
    res.render("my_qtest_info", { visit: visit });
});




app.post("/qtest_info", function(req, res) {

    Mytest.findOne({ tsname: req.body.tsname }, function(err, found) {
        if (found) {
            //console.log("already created");
            visit = 1;
            res.render('my_qtest_info', { visit: visit });
        } else {
            //console.log("new quick test is going to create");
            var x = req.body.year + '/' + req.body.month + '/' + req.body.day;
            var stime = req.body.shours + ':' + req.body.smin;
            var ehours = req.body.ehours + ':' + req.body.emin;
            var dat = x + '  ' + stime;
            var edat = x + '  ' + ehours;
            var time = (((parseInt(req.body.ehours) * 60) + parseInt(req.body.emin)) - ((parseInt(req.body.shours) * 60) + parseInt(req.body.smin)));

            var current = date();
            if ((current <= dat) && (dat < edat)) {
                //console.log("every thing is ok");
                var y;
                var x = req.body.nmark;
                if (x < 0) {
                    y = (-(x));
                } else {
                    y = x;
                }

                var test_series = req.body.name;
                var mytest = req.body.name;

                const newtest = new Mytest({
                    domain: req.body.domain,
                    tsname: test_series,
                    teacher: req.user.username,
                    qno: req.body.no,
                    pmarks: req.body.mark,
                    nmarks: y,
                    tmarks: req.body.tmarks,
                    date: dat,
                    notification: "yes",
                    completed: "yes",
                    total_test: 1,
                    etime: edat,
                    time: time,
                    amount: req.body.amount,
                    test: { tname: req.body.name, questions: [] }
                });
                newtest.save();

                const itsreview = new Review({
                    domain: req.body.domain,
                    tsname: req.body.name,
                    rating: 4,
                    comments: []
                });
                itsreview.save();

                var mykey = req.body.domain + req.body.name + req.body.name;
                const tresult = new Myresult({
                    key: newtest.test[0]._id,
                    results: [{ name: 'sagar', marks: 0, result: [] }]
                });
                tresult.save();
                res.redirect('/mytest/' + test_series + '/' + mytest);
            } else {
                visit = 2;
                res.render('my_qtest_info', { visit: visit });
            }
        }
    });
});

//my authentication yha tk


//std page


app.get("/cbse_papers", function(req, res) {
    //var USER = req.user.username;
    res.render('cbse', {});
});

app.post("/class6", function(req, res) {
    //var USER = req.user.username;
    res.render('subject', { cl: 'class6' });
});

app.post("/class7", function(req, res) {
    //var USER = req.user.username;
    res.render('subject', { cl: 'class7', user: USER });
});

app.post("/class8", function(req, res) {
    var USER = req.user.username;
    res.render('subject', { cl: 'class8', user: USER });
});

app.get("/class9", function(req, res) {
    //var USER = req.user.username;
    res.render('subject', { cl: 'class9' });
});

app.get("/class10", function(req, res) {
    //var USER = req.user.username;
    res.render('subject', { cl: 'class10' });
});

app.get("/class12", function(req, res) {
    //console.log("class 12");
    //var USER = req.user.username;
    res.render('mob11_12', { cl: 'class12' });
});

app.get("/class11", function(req, res) {
    //var USER = req.user.username;
    res.render('mob11_12', { cl: 'class11' });
});

app.post("/domain", function(req, res) {
    res.redirect("/domain/" + req.body.domain);
});



app.post("/class6/subject", function(req, res) {
    var std_class = 'class6';
    var subject = req.body.subject;
    res.redirect("/cbse/" + std_class + "/" + subject);
});

app.post("/class7/subject", function(req, res) {
    var std_class = 'class7';
    var subject = req.body.subject;
    res.redirect("/cbse/" + std_class + "/" + subject);
});


app.post("/class8/subject", function(req, res) {
    var std_class = 'class8';
    var subject = req.body.subject;
    res.redirect("/cbse/" + std_class + "/" + subject);
});

app.post("/class9/subject", function(req, res) {
    var std_class = 'class9';
    var subject = req.body.subject;
    res.redirect("/cbse/" + std_class + "/" + subject);
});

app.post("/class10/subject", function(req, res) {
    var std_class = 'class10';
    var subject = req.body.subject;
    res.redirect("/cbse/" + std_class + "/" + subject);
});


//for mobile users
app.post("/class12/subject", function(req, res) {
    var std_class = 'class12';
    var subject = req.body.subject;
    res.redirect("/cbse/" + std_class + "/" + subject);
});

app.post("/class11/subject", function(req, res) {
    var std_class = 'class11';
    var subject = req.body.subject;
    res.redirect("/cbse/" + std_class + "/" + subject);
});

//finish

app.post("/class12d", function(req, res) {
    var std_class = 'class12';
    var subject = req.body.subject;
    res.redirect("/cbse/" + std_class + "/" + subject);
});



app.post("/class11d", function(req, res) {
    var std_class = 'class11';
    var subject = req.body.subject;
    res.redirect("/cbse/" + std_class + "/" + subject);
});

app.get("/cbse/:std_class/:subject", function(req, res) {
    var book1pdf = [];
    var book1 = [];
    var book2pdf = [];
    var book2 = [];
    var book3 = [];
    var book3pdf = [];
    var paper = [];
    var paperpdf = [];
    var books = [];
    var bookspdf = [];
    var notes = [];
    var notespdf = [];
    var mydivision = req.params.std_class + req.params.subject;

    Mypdf.find({ division: { '$regex': mydivision } }, function(err, found) {
        for (var i = 0; i < found.length; i++) {

            if (found[i].division.match(/.*book1.*/)) {
                book1.push(found[i]);

            }

            if (found[i].division.match(/.*book2.*/)) {
                book2.push(found[i]);

            }

            if (found[i].division.match(/.*book3.*/)) {
                book3.push(found[i]);

            }
            if (found[i].division.match(/.*paper.*/)) {
                paper.push(found[i]);

            }

            if (found[i].division.match(/.*books.*/)) {
                books.push(found[i]);

            }

            if (found[i].division.match(/.*notes.*/)) {
                notes.push(found[i]);

            }
        }
        //var USER = req.user.username;
        res.render('material', {
            book1: book1,
            book2: book2,
            book1pdf: book1pdf,
            book2pdf: book2pdf,
            book3: book3,
            book3pdf: book3pdf,
            paper: paper,
            paperpdf: paperpdf,
            books: books,
            bookspdf: bookspdf,
            notes: notes,
            notespdf: notespdf,
            //user: USER
        });
    });
});


app.post("/cbse", function(req, res) {
    // var USER = req.user.username;
    console.log("reached");
    res.redirect('/cbse');
    //console.log("cbse clicked");
});

app.get('/cbse', function(req, res) {
    res.render('cbse');
});



//student user






app.post("/std_signup", function(req, res) {

    User.register({ username: req.body.username, active: false }, req.body.password, function(err, user) {

        if (err) {
            console.log(err);
            if (req.body.username && req.body.password) {
                g = 1;
            } else {
                g = 2;
            }

            res.redirect("/signup");
        } else {
            passport.authenticate("local")(req, res, function() {
                Uname = req.user.username;
                USER = Uname.substr(0, Uname.length - 10);
                //console.log(USER);
                res.redirect("/std_page");
            });
        }
    });
});


app.get("/std_signup/:object", function(req, res, next) {

    var user_info = JSON.parse(req.params.object);
    User.register({ username: user_info.username, active: false }, user_info.password, function(err, user) {

        if (err) {
            console.log(err);
            if (user_info.username && user_info.password) {
                g = 1;
            } else {
                g = 2;
            }

            res.redirect("/");
        } else {
            next();
        }
    });
}, passport.authenticate('local', {
    successRedirect: '/std_page',
    failureRedirect: '/'
}));

//app.get('/std_login/:username/:password', (req, res) => passport.authenticate('local', { successRedirect: '/std_page', failureRedirect: '/', })(req, res));


app.get("/std_login", function(req, res) {

    const user = new User({
        username: req.query.uname,
        password: req.query.pw
    });
    // if (!(user_info.username && user_info.password)) {
    //     g = 3;
    //     res.redirect("/");
    // }
    //app.use(req.session);
    req.login(user, function(err) {
        if (err) {
            return next(err);
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/std_page");
            });
        }
    });
});


app.post("/std_signin", function(req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    if (!(req.body.username && req.body.password)) {
        g = 3;
        res.redirect("/login");
    }
    //console.log(user);
    req.login(user, function(err) {
        if (err) {
            g = 3;
            res.redirect("/login");
            //return next(err);
        } else {
            passport.authenticate("local")(req, res, function(err) {
                if (err) {
                    g = 3;
                    res.redirect("/login");
                }
                res.redirect("/std_page");
            });
        }
    });
});



app.get('/std_page', function(req, res) {

    Mytest.find({ notification: "yes" }, function(err, found) {
        var current = date();
        var notify = [];
        for (var i = 0; i < found.length; i++) {
            if (found[i].etime < current) {
                found[i].notification = "no";
                found[i].save();
            } else {
                notify.push(found[i]);
            }
        }

        res.render('std_page', { notify: notify, current: current });
    });
});

app.get("/domain/:domain", function(req, res) {
    Mytest.find({ domain: req.params.domain, notification: "no", completed: "yes" }, { test: 0 }, function(err, found) {
        Review.find({ domain: req.params.domain }, function(err, review) {
            res.render('std_domain', { test_series: found, review: review });
        });
    });
});



app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});


//yha tk h student

//................................ab authentication start kro.............................................................................


function check_user(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.use(check_user);




app.get("/comments/:tsname/:domain", function(req, res) {
    //console.log(req.params.tsname);
    Review.findOne({ domain: req.params.domain, tsname: req.params.tsname }, function(err, review) {
        //console.log(review);
        var USER = req.user.username;
        res.render("comments", { review: review, user: USER });
    });
});


app.get("/delete_comment/:review_id/:user/:domain/:tsname", function(req, res) {
    Review.findOne({ _id: req.params.review_id }, function(err, found) {
        if (found) {
            var comment = found.comments;
            for (var i = 0; i < comment.length; i++) {
                if (comment[i].user == req.params.user) {
                    comment.splice(i, 1);
                }
            }
        }
        found.save();
    });
    res.redirect('/comments/' + req.params.tsname + "/" + req.params.domain);
})

// app.post("/test_series", function(req, res) {
//     var ts_id = req.body.ts_id;

//     res.redirect("/test_series/" + ts_id);
// });

app.post("/selected_test", function(req, res) {
    var test_series = req.body.test_series;
    var domain = req.body.domain;
    mytest = req.body.test;
    var ts_id = req.body.ts_id;
    Mytest.findOne({ _id: ts_id }, function(err, found) {
        found.test.forEach(paper => {
            //console.log(paper.tname);
            if (paper.tname == mytest) {
                //console.log("finally got matched");
                var t_given = req.body.key;
                Myresult.findOne({ key: t_given }, function(err, given) {
                    var attempt = 0;
                    for (var k = 0; k < given.results.length; k++) {
                        if (given.results[k].name == req.user.username) {
                            attempt = 1;
                            //console.log("test already attempted");
                            var no = paper.questions.length;
                            var perc = ((given.results.length - k) / given.results.length) * 100;
                            perc = perc.toFixed(3);
                            //console.log("show key");
                            //console.log(paper._id);
                            var USER = req.user.username;
                            res.render('std_ts_result', {
                                testname: paper.tname,
                                key: paper._id,
                                tsname: found.tsname,
                                questions: paper.questions,
                                result: given.results[k].result,
                                mymarks: given.results[k].marks,
                                no: no,
                                pmarks: found.pmarks,
                                domain: found.domain,
                                _id: found._id,
                                //found: found,
                                nmark: found.nmarks,
                                tmark: found.tmarks,
                                time: found.time,
                                rank: k + 1,
                                per: perc,
                                user: USER
                            });
                            break;
                        }
                    }

                    if (attempt == 0) {


                        var no = paper.questions.length;
                        var USER = req.user.username;
                        res.render('std_ts_test', {
                            testname: paper.tname,
                            key: paper._id,
                            tsname: found.tsname,
                            questions: paper.questions,
                            no: no,
                            //found: found,
                            pmarks: found.pmarks,
                            domain: found.domain,
                            _id: found._id,
                            nmark: found.nmarks,
                            tmark: found.tmarks,
                            time: found.time,
                            user: USER


                        });
                    }
                });
            }
        });
    });
});


app.get("/post_ts_result/:ts_id/:key", function(req, res) {

    Mytest.findOne({ _id: req.params.ts_id }, function(err, found) {
        for (var i = 0; i < found.test.length; i++) {
            if (found.test[i].tname == mytest) {
                Myresult.findOne({ key: req.params.key }, function(err, given) {
                    for (var k = 0; k < given.results.length; k++) {
                        if (given.results[k].name == req.user.username) {
                            var no = found.test[i].questions.length;
                            var perc = ((given.results.length - k) / given.results.length) * 100;
                            perc = perc.toFixed(3);
                            var USER = req.user.username;
                            res.render('std_ts_result', {
                                testname: found.test[i].tname,
                                key: found.test[i]._id,
                                tsname: found.tsname,
                                questions: found.test[i].questions,
                                result: given.results[k].result,
                                mymarks: given.results[k].marks,
                                no: no,
                                //found: found,
                                _id: found._id,
                                domain: found.domain,
                                pmarks: found.pmarks,
                                nmark: found.nmarks,
                                tmark: found.tmarks,
                                time: found.time,
                                rank: k + 1,
                                per: perc,
                                user: USER
                            });
                            break;
                        }
                    }
                });
                break;
            }
        }
    })

})


app.post("/re_attempt", function(req, res) {
    Mytest.findOne({ _id: req.body.ts_id }, function(err, found) {
        for (var i = 0; i < found.test.length; i++) {
            if (found.test[i].tname == req.body.test) {
                var t_given = req.body.key;
                Myresult.findOne({ key: t_given }, function(err, given) {

                    for (var k = 0; k < given.results.length; k++) {
                        if (given.results[k].name == req.user.username) {
                            //console.log("test already attempted");
                            given.results.splice(k, 1);
                        }
                    }
                    given.save();

                    var no = found.test[i].questions.length;
                    var USER = req.user.username;
                    res.render('std_ts_test', {
                        testname: found.test[i].tname,
                        tsname: found.tsname,
                        questions: found.test[i].questions,
                        no: no,
                        key: found.test[i]._id,
                        //found: found,
                        _id: found._id,
                        pmarks: found.pmarks,
                        domain: found.domain,
                        nmark: found.nmarks,
                        tmark: found.tmarks,
                        time: found.time,
                        user: USER
                    });
                });
                break;
            }
        }
    });
});

app.post('/std_ts_result', function(req, res) {
    var mydomain = req.body.domain;
    var quest;
    var qno = req.body.qno;
    var arr = [];
    var mark = 0;

    var ts = req.body.ts;
    var mytname = req.body.tname;

    Mytest.findOne({ _id: req.body.ts_id }, function(err, found) {
        found.test.forEach(test => {
            if (test.tname == mytname) {
                quest = test.questions;
            }
        });

        for (var i = 0; i < qno; i++) {
            var ans = 'answer' + i;
            var ans = req.body[ans];
            if (!ans) {
                ans = 'null';
            }
            arr.push(ans);
            if (ans == quest[i].ans) {
                mark = mark + found.pmarks;
            } else if (ans == 'null') {
                var fudu = 'h  tu';
            } else {
                mark = mark - found.nmarks;
            }

        }
        var new_result = {
            name: req.user.username,
            marks: mark,
            result: arr
        }
        var key = req.body.key;
        //console.log(key);
        Myresult.findOne({ key: key }, function(err, test_result) {
            //console.log(test_result);
            var index = 0;
            var flag = 0;

            for (var j = 0; j < test_result.results.length; j++) {
                if (test_result.results[j].name == req.user.username) {
                    //console.log("already given");
                    test_result.results.splice(j, 1);
                }
            }

            for (var j = 0; j < test_result.results.length; j++) {

                if (mark < test_result.results[j].marks) {
                    index++;
                } else {
                    test_result.results.splice(index, 0, new_result);
                    test_result.save();
                    flag = 1;
                    break;
                }
            }
            if (flag == 0) {
                test_result.results.push(new_result);
                test_result.save();
            }
        });
        //console.log("redirect");
        res.redirect("/post_ts_result/" + req.body.ts_id + "/" + req.body.key);
    });
});



app.post("/reviews", function(req, res) {

    var domain = req.body.domain;
    var tsname = req.body.tsname;
    //var console.log(domain)
    // console.log(tsname);

    Review.findOne({ domain: req.body.domain, tsname: req.body.tsname }, function(err, found) {
        //console.log(found);
        Mytest.findOne({ domain: req.body.domain, tsname: req.body.tsname }, function(err, testSeries) {

            var y;
            var length = found.total;
            if (length == 0) {
                var x = (parseFloat(testSeries.rating) + parseFloat(req.body.rate)) / 2;
            } else {
                var x = (((parseFloat(testSeries.rating) * length) + parseFloat(req.body.rate)) / (length + 1));
            }
            if (x < 3) {
                y = 3;
            } else {
                y = x.toFixed(2);
            }

            testSeries.rating = y;
            testSeries.save();
        });


        // var USER = req.params.user;
        if (req.body.reviews.length > 0 && req.user.username != null) {
            found.comments.push({ "user": req.user.username, "comment": req.body.reviews });
        }
        found.total++;
        found.save();
    });

    res.redirect("/test_series/" + req.body.ts_id);
});

//every thing if fine till
//now
//lets do it

//std page yha tk



//teacher authentication


app.get('/teacher_page', function(req, res) {
    //console.log(req.user);
    var upcoming = [];
    var previous = [];
    var tname = req.user.username;
    var name = tname.substring(0, tname.length - 10);
    Test.find({ teacher: tname }, function(err, tests) {
        var now = date();
        console.log(now);


        tests.forEach(test => {
            //  console.log(test.date);



            if (now < test.date) {
                upcoming.push(test);
            } else {
                previous.push(test);
            }
            //console.log(upcoming);
        });

        // console.log(' ');
        //console.log(upcoming);
        var USER = req.user.username;
        res.render('teacher', {
            user: name,
            upcoming: upcoming,
            previous: previous,
            user: USER
        });
    });
    upcoming = [];
    previous = [];

});


app.get('/teacher_create', function(req, res) {
    var USER = req.user.username;
    res.render('teacher_create', { user: USER });

});


app.post('/qpaper', function(req, res) {
    var tname = req.body.test_name;
    //console.log(Name);
    Test.findOne({ name: tname }, function(err, found) {
        var no = found.question.length;
        res.render('sample_test', { date: found.date, tmarks: found.tmarks, pmark: found.pmarks, nmark: found.nmarks, name: found.name, no: no, question: found.question, user: USER });
    });

});

app.post('/add_to_school_test', function(req, res) {
    Test.findOne({ name: req.body.tname }, function(err, found) {
        found.question.push([{
            question: req.body.Q,
            a: req.body.a,
            b: req.body.b,
            c: req.body.c,
            d: req.body.d,
            ans: req.body.A
        }]);
        found.save();
    });
    res.redirect('/sample_test/' + req.body.tname);
});

app.post('/delete_question', function(req, res) {
    Test.findOne({ name: req.body.tname }, function(err, found) {
        //console.log("found");
        var length = found.question.length;
        //console.log(length);
        //console.log(req.body.qno);
        for (j = 0; j < length; j++) {
            if (j == req.body.qno - 1) {
                //console.log("delete");
                found.question.splice(j, 1);
            }
        }
        found.save();
    });
    res.redirect('/sample_test/' + req.body.tname);
});

app.post('/delete', function(req, res) {
    var item = req.body.test;
    Test.deleteOne({ name: item }, function(err) {
        if (err) {
            //console.log("error");
        } else {
            //console.log("test successfully removed");
        }
    });
    Result.deleteOne({ test_name: item }, function(err) {
        if (err) {
            //console.log(err);
        } else {
            //console.log('result removed succesfully');
        }
    });
    res.redirect('/teacher_page');
});



//yha tk











app.get("/attempted_test", function(req, res) {
    var testresults = [];
    var testids = [];
    Result.find({}, function(err, found) {
        found.forEach(results => {
            results.result.forEach(result => {
                if (result.user == req.user.username) {
                    testresults.push(result);
                    testids.push(results.test_name);
                    //console.log(testresults);
                }
            });
        });
        var USER = req.user.username;
        //console.log(testids);
        res.render('attempted_test', { results: testresults, testids: testids, user: USER });
    });
});

app.get("/test_series/:ts_id", function(req, res) {

    //console.log("entered");
    //console.log(req.params.ts_id);
    Mytest.findOne({ _id: req.params.ts_id }, function(err, found) {
        //console.log(found);
        var test_name = [];
        for (var i = 0; i < found.test.length; i++) {
            if (found.test[i].questions.length >= found.qno) {
                test_name.push({ tname: found.test[i].tname, _id: found.test[i]._id });
            }
        }
        if (found.amount == 0) {
            var USER = req.user.username;
            res.render('selected_ts', {
                tests: test_name,
                found: found,
                user: USER
            });
        }
    });
});


app.get('/school_test', function(req, res) {
    var USER = req.user.username;
    res.render('school_test', { user: USER });
});

app.get('/teacher', function(req, res) {
    var USER = req.user.username;
    res.render('home', { user: USER });
});


app.get("/forgot_password", function(req, res) {
    res.render("forget");
});

app.post("/forget", function(req, res) {

    //console.log(req.body.username);

    var mailOptions = {
        from: 'subashraj89304@gmail.com',
        to: req.body.username,
        subject: 'Etestzone',
        text: 'Someone is trying to change your etestzone account password if you tried to change password then click on this link  http://testzone.herokuapp.com/change_pass if you didn,t tried it,ignore this message your password will remail same '
    };
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    res.redirect("/");

});

app.get("/change_pass", function(req, res) {
    res.render("change_pass");
});

app.post("/change_pass", function(req, res) {
    User.findOne({ username: req.body.username }, function(err, user) {
        //console.log(user);
        user.setPassword(req.body.password, function(err, user) {
            if (err) {
                console.log(err);
            } else {
                //console.log("password changed");
                user.save();
                res.redirect("/");
            }
        });
    });
});


app.get('/sample_test/:tname', function(req, res) {
    Test.findOne({ name: req.params.tname }, function(err, found) {
        var no = found.question.length;
        var USER = req.user.username;
        res.render('sample_test', { date: found.date, tmarks: found.tmarks, pmark: found.pmarks, nmark: found.nmarks, name: found.name, no: no, question: found.question, user: USER });
    });
});


//change the
//creation of test

app.get("/create/:tname", function(req, res) {
    //console.log(Name);
    Test.findOne({ name: req.params.tname }, function(err, found) {
        //console.log(found);
        var USER = req.user.username;
        res.render('create', { no: counter, user: USER, tname: req.params.tname });
    });
});


app.post("/sample_school_test", function(req, res) {
    const result = new Result({
        test_name: req.body.tname,
        result: [{
            user: 'default',
            name: "This is a total marks obtain by a students",
            result: []
        }]
    });
    result.save();
    res.redirect('/sample_test/' + req.body.tname);
});


app.post("/show_localtest_result", function(req, res) {
    var tname = req.body.mytest;
    var std = req.body.student;
    res.redirect('/result/' + tname);
});


app.get('/info', function(req, res) {
    visit = 0;
    //console.log(req.user.username);
    var USER = req.user.username;
    res.render('info', { visit: visit, user: USER });
});


app.get('/std_home', function(req, res) {
    var USER = req.user.username;
    res.render('student_home', { user: USER });
});







app.get("/result/:tname", function(req, res) {
    var exist = 0;
    var arr = [];
    var std = req.user.username;
    std = std.toLowerCase();
    Test.findOne({ name: req.params.tname }, function(err, test) {
        Result.findOne({ test_name: req.params.tname }, function(err, found) {
            // console.log("tname is");
            // console.log(req.params.tname);
            // console.log(found);
            var USER = req.user.username;
            if (found) {
                //console.log(UserName);
                //console.log(Name);
                //console.log(found.result);
                var USER = req.user.username;
                found.result.forEach(student => {
                    if (student.user == USER) {
                        exist = 1;
                        //console.log(student.name);
                        var no = test.question.length;
                        res.render('local_test_result', {
                            user: USER,
                            username: std,
                            name: test.name,
                            no: no,
                            questions: test.question,
                            result: student.result,
                            date: test.date,
                            pmark: test.pmarks,
                            nmark: test.nmarks
                        });

                        for (var i = 0; i < test.no; i++) {
                            //console.log(student.result[i]);
                            if (student.result[i].value == test.question[i][0].ans) {
                                //console.log('correct');
                            }
                            //console.log('question: ', test.question[i][0].ans);
                            //console.log('answer: ', student.result[i].value);
                        }
                    }
                });
                if (exist == 0) {
                    var error = 'Test is close';
                    res.render('error', { error: error, user: USER });
                }
            } else {
                //console.log('test is closed');
                var error = 'Test is close';
                res.render('error', { error: error, user: USER });
            }
        });
    });
    // console.log('result page');
    // console.log(arr);
});





app.post('/school_test', function(req, res) {
    var tname = req.body.test_name;
    tname = tname.toLowerCase();
    //console.log(Name);
    var entry = 0;
    var USER = req.user.username;
    Test.findOne({ name: tname }, function(err, test) {
        if (test) {
            //console.log(test);
            var now = date();
            var etime = test.etime;
            var std = req.body.username;
            std = std.toLowerCase();
            //console.log(etime);
            //console.log(now);
            //console.log(test.date);
            if ((now >= test.date) && (now <= test.etime)) {
                //console.log('reached');

                Result.findOne({ test_name: tname }, function(err, found) {
                    //console.log(found);

                    found.result.forEach(student => {
                        if (student.name == std) {
                            entry = 1;
                        }
                    });
                    if (entry == 1) {
                        //console.log('already present');
                        res.redirect('/result/' + tname);
                    } else {

                        Test.findOne({ name: tname }, function(err, find) {
                            //console.log(find);
                            var no = find.question.length;
                            res.render('test', { tmarks: test.tmarks, pmark: test.pmarks, nmark: test.nmarks, date: test.date, etime: test.etime, now: date(), username: std, name: find.name, no: no, question: find.question, user: USER });
                        });
                    }
                });
            } else {
                //console.log('not opened yet');
                res.redirect('/result/' + tname);
            }
        } else {
            var error = 'please enter valid Test ID';
            res.render('error', { error: error, user: USER });
        }
    });
});








app.post('/info', function(req, res) {
    var USER = req.user.username;
    Test.find({ teacher: req.user.username }, function(err, found) {
        if (found) {
            if (found.length > 2) {
                visit = 2;
                res.render('info', { visit: visit, user: USER });
            } else {
                rnd = rnd + 1;
                //console.log('start');
                var x = req.body.year + '/' + req.body.month + '/' + req.body.day;
                //console.log(x);
                var time = req.body.shours + ':' + req.body.smin;
                var ehours = req.body.ehours + ':' + req.body.emin;
                var dat = x + '  ' + time;
                var edat = x + '  ' + ehours;
                //console.log(current);
                //console.log(dat);
                //console.log(edat);

                var tname = req.body.name + rnd;
                tname = tname.toLowerCase();

                //var _no = req.body.no;
                var y;
                var x = req.body.nmark;
                if (x < 0) {
                    y = (-(x));
                } else {
                    y = x;
                }
                var current = date();
                if ((current <= dat) && (dat < edat)) {
                    const test = new Test({
                        //  test_no: count,
                        name: tname,
                        teacher: req.user.username,
                        //no: _no,
                        pmarks: req.body.mark,
                        nmarks: y,
                        tmarks: req.body.tmarks,
                        date: dat,
                        etime: edat,
                        question: []
                    });
                    test.save();
                    //counter = 0;
                    res.redirect('/create/' + tname);
                } else {
                    visit = 1;
                    res.render('info', { visit: visit, user: USER });
                }
            }
        } else {
            rnd = rnd + 1;
            //console.log('start');
            var x = req.body.year + '/' + req.body.month + '/' + req.body.day;
            //console.log(x);
            var time = req.body.shours + ':' + req.body.smin;
            var ehours = req.body.ehours + ':' + req.body.emin;
            var dat = x + '  ' + time;
            var edat = x + '  ' + ehours;
            //console.log(current);
            //console.log(dat);
            //console.log(edat);

            var tname = req.body.name + rnd;
            tname = tname.toLowerCase();

            //var _no = req.body.no;
            var y;
            var x = req.body.nmark;
            if (x < 0) {
                y = (-(x));
            } else {
                y = x;
            }
            var current = date();
            if ((current <= dat) && (dat < edat)) {
                const test = new Test({
                    //  test_no: count,
                    name: tname,
                    teacher: req.user.username,
                    //no: _no,
                    pmarks: req.body.mark,
                    nmarks: y,
                    tmarks: req.body.tmarks,
                    date: dat,
                    etime: edat,
                    question: []
                });
                test.save();
                //counter = 0;
                res.redirect('/create/' + tname);
            } else {
                visit = 1;
                res.render('info', { visit: visit, user: USER });
            }
        }
    });
});


app.post('/create', function(req, res) {
    var USER = req.user.username;
    counter++;
    Test.findOne({ name: req.body.tname }, function(err, found) {
        // console.log("inside create post");
        // console.log(req.body.tname);
        // console.log(found);

        found.question.push({
            question: req.body.Q,
            a: req.body.a,
            b: req.body.b,
            c: req.body.c,
            d: req.body.d,
            ans: req.body.A
        });
        found.save();
    });
    res.redirect('/create/' + req.body.tname);
});


app.post('/test_result', function(req, res) {
    // console.log('result');
    // console.log(' ');
    var submit = 0;

    var USER = req.user.username;
    var tname = req.body.tname;
    tname = tname.toLowerCase();
    Test.findOne({ name: tname }, function(err, test) {
        var arr = [];
        var total = req.body.total;
        var id = req.body.id;
        var std = req.body.username;
        std = std.toLowerCase();
        Result.findOne({ test_name: tname }, function(err, found) {

            found.result.forEach(student => {
                if (student.name == std) {
                    submit = 1;
                }
            });

            if (submit == 1) {
                //console.log('already submited');
                var error = 'Result is already submited';
                res.render('error', { error: error, user: USER });
            } else {

                for (i = 0; i < total; i++) {
                    var no = 'question ' + i;
                    var y = 'answer' + i;
                    var x = req.body[y];
                    //console.log(x);
                    arr.push({ question: test.question[i][0].question, value: x, ans: test.question[i][0].ans });
                }
                found.result.push({ user: req.user.username, name: std, result: arr });

                found.save();
                submit = 1;

                res.redirect('/result/' + tname);
            }
        });
    });

});


app.post('/student', function(req, res) {
    res.redirect('/std_home');
});


app.post('/teacher', function(req, res) {
    res.redirect('/teacher');
});

app.post('/new_test', function(req, res) {
    res.redirect('/info');
});



//console.log(date());








app.post('/close', function(req, res) {
    res.redirect('/');
});


app.post('/teacher_result', function(req, res) {
    var USER = req.user.username;
    res.render('teacher_result', { user: USER });
});

app.post('/tresult', function(req, res) {
    var USER = req.user.username;
    Name = req.body.test_name;
    Name = Name.toLowerCase();
    Test.findOne({ name: Name }, function(err, test) {
        if (test) {
            Result.findOne({ test_name: Name }, function(err, found) {
                var no = test.question.length;
                //console.log(found.result);
                res.render('t_result', {
                    user: USER,
                    students: found.result,
                    test: test.question,
                    no: no,
                    pmark: test.pmarks,
                    nmark: test.nmarks,
                    test_name: test.name,
                    date: test.date

                });


            })
        } else {
            var error = 'Please enter a valid Test ID';
            res.render('error', { error: error, user: USER });
        }
    });
});



let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}
app.listen(port, function(err) {
    console.log("the server is running on port 3000");
});

//app.listen(3000, function(req, res) {
//   console.log("running");
//});



//till now

//git config --global core.autocrlf true//



//till now
//till now
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const passport = require("passport");
const AWS = require("aws-sdk");
const Info = require("../models/Info");
const uploads3 = require("../middleware/awsupload");
const nodemailer = require("nodemailer");

function sendMail(to, msg) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "anand9412868527@gmail.com",
      pass: "9412868527",
    },
  });

  var mailOptions = {
    from: "anand9412868527@gmail.com",
    to: to,
    subject: "Password",
    text: `Your Password is ${msg}`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

router.get("/test2/:param", (req, res) => {
  // console.log(req.params.param)
  let bucketname = req.params.param;
  // Set Amazon Uploading Engine
  const s3 = new AWS.S3({
    // accessKeyId: process.env.ACCESS_KEY_ID,
    // secretAccessKey: process.env.SECRET_ACCESS_KEY,
    accessKeyId: "AKIASPLFO6OWBFZSCZ5I",
    secretAccessKey: "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",
    region: "ap-south-1",
  });

  async function test2() {
    await s3
      .listObjectsV2({
        Bucket: bucketname,
      })
      .promise()
      .then((data) => {
        // console.log(data.Contents);
        let result = [];
        data.Contents.forEach(
          (content) => content.Size == 0 && result.push(content.Key)
        );
        // console.log(result);
        res.status(200).json(result);
      });
  }
  test2();
  // s3.listBuckets((err, data) => {
  //   if (err) {
  //     console.log("Error", err);
  //   } else {
  //     console.log("Success", data.Buckets);
  //     res.render("upload", { buckets: data.Buckets });
  //   }
  // });
});

router.get("/test", (req, res) => {
  console.log("test");
  res.render("pdfviewer");
});

router.get("/", (req, res) => {
  res.render("welcome");
});
//Login Page
router.get("/login", (req, res) => {
  res.render("login");
});

//Register Page
router.get("/register", (req, res) => {
  res.render("register");
});

//upload file get
router.get("/upload", (req, res) => {
  // Set Amazon Uploading Engine
  const s3 = new AWS.S3({
    accessKeyId: "AKIASPLFO6OWBFZSCZ5I",
    secretAccessKey: "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",
    region: "ap-south-1",
  });

  s3.listBuckets((err, data) => {
    if (err) {
      console.log("Error", err);
    } else {
      // console.log("Success", data.Buckets);
      res.render("upload", { buckets: data.Buckets });
    }
  });
});

//upload a file post
router.post("/uploaddata", uploads3.array("img", 10), (req, res) => {
  // console.log(req.session.passport);

  let location = [];
  console.log;
  req.files.map((data) => location.push(data.location));
  console.log(location);
  const id = req.session.passport.user;

  // console.log(info);

  Info.find({ userid: id._id }).then((info) => {
    // console.log(info.length);
    const info1 = new Info({
      userid: id._id,
      dataUrl: location[location.length - 1],
    });
    if (info.length == 0) {
      info1.save().then((infor) => {
        console.log(infor);
      });
    } else {
      Info.findOneAndUpdate(
        { userid: id._id },
        { $push: { dataUrl: location[0] } }
      ).exec((err, result) => {
        if (err) console.error(err);
        console.log(result);
      });
    }
  });
  res.redirect("/dashboard");
});

//Register Handler
router.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  let errors = [];

  //Check required fields
  if (!name) {
    errors.push({ msg: "Please Fill the Name Field" });
  }
  if (!email) {
    errors.push({ msg: "Please Fill the Email Field" });
  }
  if (!password) {
    errors.push({ msg: "Please Fill the Password Field" });
  }

  //Check pass length
  if (password.length < 6) {
    errors.push({ msg: "Password must contain more than 6 character" });
  }

  if (errors.length > 0) {
    res.render("register", { errors, name, email, password });
  } else {
    const newUser = new User({
      name,
      email,
      password,
    });
    //Hash Password
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        //Set Password to hashed
        newUser.password = hash;
        newUser
          .save()
          .then((user) => {
            req.flash("success_msg", "You are now register and can log in");
            sendMail(email, password);
            res.redirect("/admin");
          })
          .catch((err) => console.log(err));
      });
    });
  }
});

const checkAuthenicated = function (req, res, next) {
  if (req.isAuthenticated()) {
    res.set(
      "Cache-Control",
      "no-cache,private,no-store,must-relative,post-check=0,pre-check=0"
    );
    return next();
  } else {
    res.redirect("/login");
  }
};
//Dashboard Handler
router.get("/dashboard", checkAuthenicated, (req, res) => {
  // console.log(req.session.passport.user);

  res.render("dashboard");
});

//Login Handler
router.post("/login", (req, res, next) => {
  const { email, password } = req.body;
  let errors = [];

  //Check required fields
  // if (!email || !password) {
  //   errors.push({ msg: "Please Fill all the fields" });
  // }
  if (!email) {
    errors.push({ msg: "Please Fill the Email Field" });
  }
  if (!password) {
    errors.push({ msg: "Please Fill the Password Field" });
  }
  if (errors.length > 0) {
    res.render("login", { errors, email, password });
  } else {
    if (email == "admin@gmail.com") {
      console.log("TEST");
      // req.session.passport.user = email;
      res.redirect("/admin");
    } else {
      passport.authenticate("local", {
        successRedirect: "/dashboard",
        failureRedirect: "/",
        failureFlash: true,
      })(req, res, next);
    }
  }
});

//Logout Handler
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "You are logged Out");
  res.redirect("/");
});

router.get("/admin", (req, res) => {
  res.render("admindashboard");
});

router.get("/adduser", (req, res) => {
  res.render("register");
});

router.get("/showalluser", async (req, res) => {
  try {
    const users = await User.find().lean();
    console.log(users);
    let info = [];
    users.map(
      (user) =>
        user.email != "admin@gmail.com" &&
        info.push({ id: user._id, name: user.name, email: user.email })
    );
    console.log(info);
    res.render("showalluser", { users: info });
    // res.render('dashboard',{
    //     name:req.user.firstName+" "+req.user.lastName,
    //     stories
    // })
    // res.render("showuser", { users });
  } catch (err) {
    console.error(err);
  }
});

router.get("/showallfiles", checkAuthenicated, async (req, res) => {
  try {
    const info = await Info.find({ userid: req.session.passport.user }).lean();
    // console.log(info[0].dataUrl);
    let result = [];
    info[0].dataUrl.map((data) => {
      console.log(data);
      result.push({ url: data, name: data.split("/").pop() });
    });
    // console.log(result);
    // res.render('dashboard',{
    //     name:req.user.firstName+" "+req.user.lastName,
    //     stories
    // })
    res.render("showAllFiles", { users: result });
  } catch (err) {
    console.error(err);
  }
});

router.get("/user/:id", async (req, res) => {
  try {
    const info = await Info.find({ userid: req.params.id }).lean();
    // console.log(info[0].dataUrl);
    let result = [];
    info[0].dataUrl.map((data) => {
      console.log(data);
      result.push({ url: data, name: data.split("/").pop() });
    });
    // console.log(result);
    // res.render('dashboard',{
    //     name:req.user.firstName+" "+req.user.lastName,
    //     stories
    // })
    res.render("showAllFiles", { users: result });
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;

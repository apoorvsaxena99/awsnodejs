// Depedencies
const multer = require("multer");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");

// Set Amazon Uploading Engine
const s3 = new AWS.S3({
  // accessKeyId: process.env.ACCESS_KEY_ID,
  // secretAccessKey: process.env.SECRET_ACCESS_KEY,
  accessKeyId: "AKIASPLFO6OWDBGJA2BS",
  secretAccessKey: "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",
  region: "ap-south-1",
});

const response = async () => {
  await s3.listObjectsV2({
    Bucket: "anandbro",
  });
};

console.log("response", response);

//
module.exports = response;

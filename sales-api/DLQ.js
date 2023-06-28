const serverless = require("serverless-http");
const express = require("express");
const app = express();

const AWS = require("aws-sdk")
const sqs = new AWS.SQS({ region: "ap-northeast-2" }) 

exports.handler = async function(event, context) {
  console.log(event)
  console.log(context)
}
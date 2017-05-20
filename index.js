'use strict';

var _ = require("lodash");
var ejs = require("ejs");
// var fs = require('fs');
const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });

var getDate = (day) => {
  var today = new Date();
  var anotherDay = new Date();
  var day = day || 0
  anotherDay.setDate(today.getDate() + day);
  return anotherDay.toLocaleDateString('en-GB');
}

var isAday = (date, day) => {
  var today = new Date();
  var anotherDay = new Date();
  var day = day || 0
  anotherDay.setDate(today.getDate() + day);
  return date.toLocaleDateString('en-GB') === anotherDay.toLocaleDateString('en-GB')
}

exports.handler = (event, context, callback) => {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const params = {
        Bucket: bucket,
        Key: key,
    };
    s3.getObject(params, (err, data) => {
        if (err) {
            callback("Error getting object: " + params + ", with error: "+ err);
        } else {
          const surfData = JSON.parse(data.Body.toString('utf-8'));
          ejs.renderFile("index.ejs", {locations: surfData,
                                       today:  getDate(),
                                       tomorrow: getDate(1),
                                       afterTomorrow: getDate(2)
                                      },
                                      (err, indexHtml) => {
                                          if(err) {
                                            console.log("Errors during ejs parsing:", err);
                                          } else {
                                            const uploadParam = {
                                              Bucket: "micheluncini.com",
                                              Key: "surf.html",
                                              Body: indexHtml,
                                              ContentType: 'text/html; charset=utf-8'
                                            }
                                            s3.upload(uploadParam, (err, data) => {
                                              if (err){
                                                  callback("Error putting object: " + params + ", with error: "+ err);
                                              } else {
                                                console.log("All good!!");           // successful response
                                                callback(null, data);
                                              }
                                            })
                                          }
                                      });
        }
    });
};

//Test:
// const p  = require("./index.js")
// const event = {
//   Records : [{
//     s3:{
//       bucket:{
//         name: "com.surfing.website"
//       },
//       object: {
//         key: "surfData.json"
//       }
//     }
//   }]
// }
//
// p.handler(event, null, (err) => console.log(err))

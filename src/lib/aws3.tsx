import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  endpoint: 'https://s3.filebase.com', // Filebase 专用端点
  region: 'us-east-1',
  credentials: {
    accessKeyId: '',
    secretAccessKey: '',
  },
  httpOptions: {
    timeout: 50000,              // 最长 50 秒
    connectTimeout: 20000,
  },
});

//
// 以下方法已经验证，如果放在前端，会发生CORS跨域异常，就算是filebase设置允许跨域也不行，是官方给出的设置方法。
//
// const s3 = new AWS.S3({
//   endpoint: 'https://s3.filebase.com', // Filebase 专用端点
//   region: 'us-east-1',
//   accessKeyId: '',
//   secretAccessKey: '',
//   signatureVersion: 'v4',
// });


export default s3;
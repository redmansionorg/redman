'use client'

import React,{useState} from 'react'

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

import AWS from 'aws-sdk';

// const s3 = new AWS.S3({
//   endpoint: 'https://s3.filebase.com', // Filebase 专用端点
//   region: 'us-east-1',
//   credentials: {
//     accessKeyId: '',
//     secretAccessKey: '',
//   },
// });

const s3 = new AWS.S3({
  endpoint: 'https://s3.filebase.com', // Filebase 专用端点
  region: 'us-east-1',
  credentials: {
    accessKeyId: '',
    secretAccessKey: '',
  },
});

// 上传文件
const uploadFile = async (file:File) => {
  const params = {
    Bucket: 'redmansion',
    Key: `books/${file.name}`,
    Body: file,
    ContentType: file.type,
  };

  try {

    //
    // 以下方法明显比较慢，不过都是可以执行的
    //
    // const data = await s3.upload(params).promise();
    // console.log(data)
    // await new Promise((res) => setTimeout(res, 1500)) // 等 1.5 秒
    // console.log("try to head object for cid")
    // const head = await s3.headObject({
    //   Bucket: data.Bucket,
    //   Key: data.Key,
    // }).promise()
    // const cid = head.Metadata?.['cid'] || null
    // console.log(`get cid return: ${cid}`)
    // if (cid) {
    //   setUploadedCid(`https://ipfs.filebase.io/ipfs/${cid}`)
    //   console.log(uploadedCid)
    //   return uploadedCid
    // } else {
    //   console.warn('❌ CID 未包含在 metadata 中，请手动在 Filebase 控制台查看。')
    //   return null
    // }

    /*
    {
    "ETag": "2f9845001c3a6a88e81c3ebac90f041b",
    "Location": "https://redmansion.s3.filebase.com/books/novel_item01.jpg",
    "key": "books/novel_item01.jpg",
    "Key": "books/novel_item01.jpg",
    "Bucket": "redmansion"
    }
    其中ETag是 Entity Tag 的缩写，是由 AWS S3 协议生成的对象的内容摘要（通常是 MD5 哈希），是一个用于验证上传完整性的标识。
     */
    const data = await s3.upload(params).promise();
    console.log('File uploaded:', data.Location);
    console.log(data)
  } catch (err) {
    console.error('Upload error:', err);
  }
};

export default function Page() {

  /* 1. React-Dropzone 高度可定制 */
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // 处理上传逻辑
    acceptedFiles.forEach((file) => {

      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      uploadFile(file)

      const reader = new FileReader()

      reader.onabort = () => console.log('file reading was aborted')
      reader.onerror = () => console.log('file reading has failed')
      reader.onload = () => {
        // Do whatever you want with the file contents
        const binaryStr = reader.result
        console.log(binaryStr)
      }
      reader.readAsArrayBuffer(file)
    })
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.webp'] },
  });

  /* 2. 只预览不上传的基础逻辑示例（Next.js + Tailwind） */
  const [preview, setPreview] = useState<string | null>(null)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    }
  }

  return (
    <div className="space-y-4">
      {/* 1 */}
      <div>
        <div {...getRootProps()} className="p-4 border-2 border-dashed">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>拖放图片到此处</p>
          ) : (
            <p>点击或拖放图片上传</p>
          )}
        </div>
      </div>
      {/* 2 */}
      <div>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {preview && (
          <img src={preview} alt="preview" className="w-48 h-auto rounded shadow" />
        )}
      </div>
      {/* 3  */}
      <div {...getRootProps()} className="border p-4 border-dashed cursor-pointer">
        <input {...getInputProps()} />
        <p>Upload directly to Filebase (for demo only)</p>
      </div>
    </div>
  )
}

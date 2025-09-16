'use client'

import React,{useState} from 'react'
import { FiArrowLeft, FiImage, FiPlus, FiInfo } from 'react-icons/fi'

import { Button } from "@/components/ui/button"

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import AWS from 'aws-sdk';

import { useForm } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"


type FormValues = {
  title: string
  description: string
  penName: string
  realName: string
  identity: string
  royalty: string
  license: string
}

//
//可以解决前端跨域问题，是chatgpt给出的方法
//
const s3 = new AWS.S3({
  endpoint: 'https://s3.filebase.com', // Filebase 专用端点
  region: 'us-east-1',
  credentials: {
    accessKeyId: '55137E4DDF91EFA9BAC5',
    secretAccessKey: 'R27gD6rUjJKggEeg1LPG9EmuKKtt5jQfd6ecXyoi',
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
//   accessKeyId: '55137E4DDF91EFA9BAC5',
//   secretAccessKey: 'R27gD6rUjJKggEeg1LPG9EmuKKtt5jQfd6ecXyoi',
//   signatureVersion: 'v4',
// });


// write novel page
export default function Page() {

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedCid, setUploadedCid] = useState<string | null>(null)

  // 上传文件
  const uploadFile = async (file:File) => {
    const params = {
      Bucket: 'redmansion',
      Key: `books/${file.name}`,
      Body: file,
      ContentType: file.type,
      //Metadata: { import: "car" } //这一句话好像没用
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

      //以下方法比较快，是官方给出的方法，好像一次性就返回了cid
      const request = s3.putObject(params);
      console.log(request)
      await new Promise((res) => setTimeout(res, 15000)) // 等 1.5 秒
      request.on('httpHeaders', (statusCode, headers) => {
        //console.log(`CID: ${headers['x-amz-meta-cid']}`);
        const cid = headers['x-amz-meta-cid']
        setUploadedCid(cid)
        //状态还不能立刻就用
        //console.log(uploadedCid)
      });
      request.on('error', (err)=>{console.log(err)})
      const result = request.send();

    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false)
    }
  };

/* 1. React-Dropzone 高度可定制 */
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selected = acceptedFiles[0]
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.webp'] },
  });

  // 点击上传按钮
  const handleUpload = async () => {
    if (!file || uploading){
      alert('请先选择图片logo')
      return
    }

    const result = checkFormInput()

    setUploading(true)
    await uploadFile(file)
    //setUploading(false)
  }

  const checkFormInput = () => {
    return false
  }

  const deployNovelBookContract = () => {

  }


  const form = useForm<FormValues>({
    defaultValues: {
      title: "",
      description: "",
      penName: "",
      realName: "",
      identity: "",
      royalty: "",
      license: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("✅ 表单通过校验，提交数据：", data)
    // 下一步：上传文件 / 创建智能合约
  }

  return (
    <div className="bg-white">

      {/* 主要内容区 */}
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* 左侧封面区域 */}
          <div className="ml-3">
            <div {...getRootProps()} className="w-[195px] md:w-[195px] lg:w-[256px] bg-gray-100 rounded-lg aspect-[3/4] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
            <input {...getInputProps()} />
              {preview && (
                <img src={preview} alt="preview" className="w-auto h-auto rounded shadow" />
              )}
              {!preview && (
                <div className='flex flex-col items-center justify-center'>
                  <FiImage className="h-12 w-12 text-gray-400 mb-2" />
                  {isDragActive ? (
                    <p className="text-gray-500 font-medium">拖放图片到此处</p>
                  ) : (
                    <p className="text-gray-500 font-medium">点击或拖放图片上传</p>
                  )}
                  <p className="text-gray-400 text-sm">512x800 ({'<'}200KB)</p>
                </div>
              )}
            </div>
          </div>

          {/* 右侧表单区域 */}
          <div className="w-[420px] md:w-[526px] lg:w-[760px] mr-3">
            <div className="mb-8">
              <div className="flex flex-wrap justify-between items-center gap-1 md:flex-row mb-6 pr-3">
                <h2 className="flex items-center text-lg font-semibold text-gray-900">Novel Details</h2>
                <div className='flex flex-row items-center gap-1'>
                  <div className='text-xs'>{uploading ? '图片上传中...' : ''}</div>
                  <Button onClick={handleUpload} disabled={uploading}>Publish</Button>
                </div>
              </div>

              {/* 标题 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Untitled Story"
                />
              </div>

              {/* 描述 */}
              <div className="mb-6">
                <div className="flex items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <FiInfo className="ml-1 h-4 w-4 text-gray-400" />
                </div>
                <textarea
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Tell readers what your story is about..."
                />
                <div>
                  <input id="BID" type="text" disabled={true} className="w-full h-8" placeholder="#04cb6512ee75424564b4f0776a3a326b" />
                </div>
              </div>

              <div className='w-full h-5'></div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Author Details</h2>

              {/* 笔名 */}
              <div className="mb-6">
                <div className="flex items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Pseudonym</label>
                  <FiInfo className="ml-1 h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Pen Name"
                />
              </div>

              {/* 版权所有者信息 */}
              <div className='w-full h-5'></div>
              <div className='flex'>
                <h2 className="flex-wrap text-lg font-semibold text-gray-900 mb-6">Copyright Owner</h2>
                <FiInfo className="mt-2 ml-1 h-4 w-4 text-gray-400" />
              </div>

              {/* 真实名称 */}
              <div className="mb-6">
                <div className="flex items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <FiInfo className="ml-1 h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Official name"
                />
              </div>

              {/* 个人身份 */}
              <div className="mb-6">
                <div className="flex items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Identity</label>
                  <FiInfo className="ml-1 h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="441818191910101314"
                />
                <div>
                  <input id="PID" type="text" disabled={true} className="w-full ml-3 h-8" placeholder="#04cb6512ee75424564b4f0776a3a326b" />
                </div>
              </div>


              {/* 授权策略 */}
              <div className='w-full h-5'></div>
              <div className='flex'>
                <h2 className="flex-wrap text-lg font-semibold text-gray-900 mb-6">License</h2>
                <FiInfo className="mt-2 ml-1 h-4 w-4 text-gray-400" />
                <input id="PIN" type="text" disabled={true} className="w-60 ml-3 h-8" placeholder="#" />
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Policy</label>
                  <FiInfo className="ml-1 h-4 w-4 text-gray-400" />
                </div>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                  <option value="1">All Rights Reserved</option>
                  <option value="2">Public Domain</option>
                  <option value="3">Creative Commons (CC) Attribution</option>
                  <option value="4">(CC) Attrib. NonCommercial</option>
                  <option value="5">(CC) Attrib. NonComm. NoDerivs</option>
                  <option value="6">(CC) Attrib. NonComm. ShareAlike</option>
                  <option value="7">(CC) Attribution-ShareAlike</option>
                  <option value="8">(CC) Attribution-NoDerivs</option>
                </select>
              </div>

              {/* 版税 */}
              <div className="mb-6">
                <div className="flex items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Royalty</label>
                  <FiInfo className="ml-1 h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="15%"
                />
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

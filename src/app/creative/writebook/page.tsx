'use client'

import React,{useState} from 'react'
import { FiArrowLeft, FiImage, FiPlus, FiInfo } from 'react-icons/fi'

import { Button } from "@/components/ui/button"

/*
 * 图片预览与IPFS上传
 */
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import AWS from 'aws-sdk';

import { useEffect } from "react"

/*
 * web3 智能合约部署与交互
 */
import { BrowserProvider, ContractFactory } from "ethers";
import { keccak256, solidityPacked, toUtf8Bytes } from 'ethers'
import LiteratureOpus from "@/contracts/LiteratureOpus.json"; // ABI + bytecode
//import factoryAbi from '@/contracts/OpusFactory.abi.json'
//import factoryBytecode from '@/contracts/OpusFactory.bytecode.json'
//import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import { useAccount } from "wagmi";
import { useConnectModal } from '@rainbow-me/rainbowkit';

/*
 * 1. FormControl 里面只能有一个Input
 */
import { useForm } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

//在13.4+使用下面这个方法会错误
// import {useRouter} from 'next/router';
import {useRouter} from "next/navigation"

import { Progress } from "@/components/ui/progress"

import {ht} from "@/utils/ht"

const factoryAddress = process.env.NEXT_PUBLIC_LITERATURE_FACTORY // OpusFactory工厂地址，可以是 Remix 部署的地址


type FormValues = {
  title: string
  synopsis: string
  pseudonym: string
  fullname: string
  identity: string
  royalty: string
  terms: string
}

//
//可以解决前端跨域问题，是chatgpt给出的方法
//
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
//   accessKeyId: '55137E4DDF91EFA9BAC5',
//   secretAccessKey: 'R27gD6rUjJKggEeg1LPG9EmuKKtt5jQfd6ecXyoi',
//   signatureVersion: 'v4',
// });


// write novel page
export default function Page() {

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null);
  const MAX_SIZE = 100 * 1024 // 100KB

  const [logoCid, setLogoCid] = useState<string | null>(null)
  const [synopsisCid, setSynopsisCid] = useState<string | null>(null)

  //contract deploying
  const [deploying, setDeploying] = useState(false);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [percent, setPercent] = useState(0);

  const router = useRouter()

  const form = useForm<FormValues>(
    {defaultValues: {title: "",synopsis: "",pseudonym: "",fullname: "",identity: "",royalty: "",terms: ""},}
  );

  /*
   *  该部分需要进一步讨论，这些变量是否有必要出现在智能合约中，还是可以只通过规定协议，大家自行验证即可
      哈希	 全称	                    结构	                            作用
      BUID	Book Universal ID	      keccak256(title + synopsis)	      核心内容标识
      PUID	Person Universal ID	    keccak256(fullname + identity)	  作者唯一身份哈希
      RUID	Right of Author	        keccak256(BUID + PUID)            某人对某书的初始确权  = Copyright ID
      LUID	License Universal ID	  keccak256(RUID + terms + royalty)	某人在某策略下授权创作
      LUID_signature		            signMessage(LUID)	                钱包对LUID签名，确保授权行为真实，供二创验证
   */
  const [BUID, setBUID] = useState("")
  const [PUID, setPUID] = useState("")
  // const [FCID, setFCID] = useState("")
  // const [LUID, setLUID] = useState("")

  const { watch } = form
  const title = watch("title")
  const synopsis = watch("synopsis")
  const pseudonym = watch("pseudonym")
  const fullname = watch("fullname")
  const identity = watch("identity")
  const royalty = watch("royalty")
  const terms = watch("terms")

  useEffect(() => {
    if(error){
      console.log("发生错误：" + error)
    }
  }, [error])

  useEffect(() => {
    // BUID
    if (title?.trim() && synopsis?.trim()) {
      const buid = keccak256(solidityPacked(['string', 'string'],[title.trim(),synopsis.trim()]))
      setBUID(buid)
    }
  }, [title, synopsis])

  useEffect(() => {
    // PUID
    if (fullname?.trim() && identity?.trim()) {
      const puid = keccak256(solidityPacked(['string', 'string'],[fullname.trim(),identity.trim()]))
      setPUID(puid)
    }
  }, [fullname, identity])

  useEffect(() => {
    // CID 图片上传到IPFS后会生成CID，此时就可以用来发起
    if (logoCid && synopsisCid && BUID && PUID) {
      console.log(`LOGO: ${logoCid}  DESC: ${synopsisCid}  BUID: ${BUID}  PUID: ${PUID}`)
      deployContract()
    }
  }, [logoCid,synopsisCid])

  useEffect(() => {
    //
    if (contractAddress&&window) {
      router.replace('/creative?refresh=true')
      //下面这个调用会导致整个SPA页面重新更新
      //window.location.replace('/creative?refresh=true')
    }
  }, [contractAddress])


  // 上传文件
  const uploadFile = async (file:File) => {
    const params = {
      Bucket: 'redmansion',
      Key: `book/${title}_cover_${address}`,
      Body: file,
      ContentType: file.type,
      //Metadata: { import: "car" } //这一句话好像没用
    };

    try {
      if(logoCid)return

      setPercent(10)
      //以下方法比较快，是官方给出的方法，好像一次性就返回了cid
      const request = s3.putObject(params);
      console.log(request)
      await new Promise((res) => setTimeout(res, 1000)) // 等 1 秒
      request.on('httpHeaders', (statusCode, headers) => {
        console.log(`LOGO_CID: ${headers['x-amz-meta-cid']}`);
        const cid = headers['x-amz-meta-cid']
        setPercent(30)
        setLogoCid(cid)
        //状态还不能立刻就用
        //console.log(uploadedCid)
      });
      request.on('error', (err)=>{console.log(err);setError(err.message || "上传概要失败");setUploading(false);})
      const result = await request.send();
      setPercent(20)
    } catch (err) {
      console.error('Upload error:', err);
      setError("上传logo失败"+err);
      setUploading(false)
    } finally {
      //
    }
  };

    // 上传文件
  const uploadSynopsis = async (desc:String) => {
    const params = {
      Bucket: 'redmansion',
      Key: `book/${title}_synopsis_${address}`,
      Body: desc,
      ContentType: 'text/plain',
      //Metadata: { import: "car" } //这一句话好像没用
    };

    try {
      if(synopsisCid)return

      setPercent(40)
      //以下方法比较快，是官方给出的方法，好像一次性就返回了cid
      const request = s3.putObject(params);
      console.log(request)
      await new Promise((res) => setTimeout(res, 1000)) // 等 1 秒
      request.on('httpHeaders', (statusCode, headers) => {
        console.log(`DESC_CID: ${headers['x-amz-meta-cid']}`);
        const cid = headers['x-amz-meta-cid']
        setPercent(50)
        setSynopsisCid(cid)
        //状态还不能立刻就用
        //console.log(uploadedCid)
      });
      request.on('error', (err)=>{console.log(err);setError(err.message || "上传概要失败");setUploading(false);})
      const result = await request.send();
      //setPercent(50)
    } catch (err) {
      console.error('Upload error:', err);
      setError("上传概要失败"+err);
      setUploading(false)
    } finally {
      //
    }
  };

  /* 1. React-Dropzone 高度可定制 */
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      if (file.size > MAX_SIZE) {
        setFileError('文件大小超出限制')
        setPreview(null)
      } else {
        setFileError(null)
        setFile(file)
        setPreview(URL.createObjectURL(file))
      }
    }
    // setFile(file)
    // setPreview(URL.createObjectURL(file))
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
  });


  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();

  const onSubmit = async(formData: FormValues) => {
    console.log("✅ 表单通过校验，提交数据：", formData)
    // 下一步：上传文件 / 创建智能合约
    if (!file){
      alert('请选择小说的logo')
      return
    }
    if(uploading || deploying || contractAddress){
      return
    }
    console.log("钱包连接状态：", isConnected, address);
    if(!isConnected){
      openConnectModal?.()
      return
    }

    // 之前可能表单准备好，但是提交部署出错了，导致没有走下去
    console.log(`CID: ${synopsisCid}  ${logoCid}`)
    if(synopsisCid&&logoCid){
      deployContract()
      return
    }

    console.log(`Try to upload logo & synopsis to ipfs`)
    setUploading(true)
    uploadFile(file)
    await new Promise((res) => setTimeout(res, 2000)) // 等 1 秒
    setUploading(true)
    uploadSynopsis(synopsis)

    //服务器返回CID header后，由监听方法useEffect->uploadedCid检测后执行
    return
  }

  const deployContract = async () => {
    if(deploying||contractAddress)return;
    try {
      setDeploying(true);
      setError(null);

      setPercent(60)

       // 连接钱包（BrowserProvider 是 v6 中的替代）
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []); 
      const signer = await provider.getSigner();

      setPercent(70)

      console.log("部署参数：", {title,synopsisCid,logoCid,pseudonym,PUID,terms,royalty,});
      // 准备合约工厂
      const factory = new ContractFactory(LiteratureOpus.abi,LiteratureOpus.bytecode,signer);
      // 部署合约
      const contract = await factory.deploy(title,synopsisCid,logoCid,pseudonym,PUID,terms,royalty,factoryAddress);
      // 等待部署确认
      await contract.waitForDeployment();
      setPercent(80)
      // 获取合约地址
      const address = await contract.getAddress();
      setPercent(90)
      setContractAddress(address);
      setPercent(100)
    } catch (err: any) {
      console.error(err);
      setError(err.message || "部署失败");
    } finally {
      setDeploying(false);
    }
  };


  return (
    <div className="bg-white">

      {/* 主要内容区 */}
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <div className='text-center text-2xl font-bold mb-7'>创建新的小说</div>
        <Progress value={percent} className="bg-gray-100 w-full h-[2px] ml-3 mr-3"/>
        <div className="flex flex-col md:flex-row gap-8 mt-3">
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
                  <p className="text-gray-400 text-sm">512x800 ({'<'}100KB)</p>
                  {fileError && (
                    <p className="text-red-500 text-xs mt-1">{fileError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* 右侧表单区域 */}
          <div className="w-full md:w-[526px] lg:w-[700px]">
            <div className="mb-8">
              <div className="flex flex-wrap justify-between items-center gap-1 md:flex-row mb-6 pr-3">
                <h2 className="flex items-center text-lg font-semibold text-gray-900">Novel Details</h2>
                <div className='flex flex-row items-center gap-1'>
                  <div className='text-xs'>
                    {uploading ? '图片上传中...' : ''}
                    {deploying ? '合约部署中...' : ''}
                  </div>
                  {contractAddress && (
                    <div className="mt-4 text-green-700">
                      🎉 小说部署成功：
                      <a
                        href={`https://aeneid.storyscan.xyz/address/${contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {contractAddress}
                      </a>
                    </div>
                  )}
                  {error && <div className="mt-4 text-red-600">❌ 错误</div>}
                  <Button className='w-20' type="submit" disabled={uploading||deploying||contractAddress!=null}>Publish</Button>
                </div>
              </div>

              {/* 标题 */}
              <FormField
                control={form.control}
                name="title"
                rules={{required:"小说名字不能为空"}}
                render={({field}) => (
                  <FormItem className="mb-6">
                    <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Title</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Untitled Story"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 描述 */}
              <FormField
                control={form.control}
                name="synopsis"
                rules={{required:"简介不能为空"}}
                render={({field}) => (
                  <FormItem>
                    <div className="flex items-center mb-1">
                      <FormLabel className="block text-sm font-medium text-gray-700">synopsis</FormLabel>
                      <FiInfo className="ml-1 h-4 w-4 text-gray-400" />
                    </div>
                    <FormControl>
                      <textarea
                        {...field}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Tell readers what your story is about..."
                      />
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}
              />
              <div className="mb-6">
                <div>
                  <input value={ht(BUID)} id="BUID" type="text" disabled className="w-full h-8 text-gray-400" placeholder="#" />
                </div>
              </div>

              <div className='w-full h-5'></div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Author Details</h2>

              {/* 笔名 */}
              <FormField
                control={form.control}
                name="pseudonym"
                rules={{required: "笔名不能为空"}}
                render={({field})=>(
                  <FormItem className="mb-6">
                    <div className="flex items-center mb-1">
                      <FormLabel className="block text-sm font-medium text-gray-700">Pseudonym</FormLabel>
                      <FiInfo className="ml-1 h-4 w-4 text-gray-400" />
                    </div>
                    <FormControl>
                      <Input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="笔名"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}
              />

              {/* 版权所有者信息 */}
              <div className='w-full h-5'></div>
              <div className='flex mb-6'>
                <h2 className="flex-wrap text-lg font-semibold text-gray-900">Copyright Owner</h2>
                <FiInfo className="mt-2 ml-1 h-4 w-4 text-gray-400" />
              </div>

              {/* 真实名称 */}
              <div className='grid grid-cols-2 gap-5'>
              <FormField
                control={form.control}
                name="fullname"
                rules={{ required: "真实姓名不能为空" }}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mb-1">
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Name</FormLabel>
                      <FiInfo className="ml-1 h-4 w-4 text-gray-400" />
                    </div>
                    <FormControl>
                      <Input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="姓名"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 个人身份 */}
              <FormField
                control={form.control}
                name="identity"
                rules={{ required: "身份证号不能为空" }}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mb-1">
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Identity</FormLabel>
                      <FiInfo className="ml-1 h-4 w-4 text-gray-400" />
                    </div>
                     <FormControl>
                      <Input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="44181819191010131X"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>                
              <div className="mb-6">
                <input value={ht(PUID)} id="PUID" type="text" disabled={true} className="w-full ml-3 h-8 text-gray-400" placeholder="#" />
              </div>


              {/* 授权策略 */}
              <div className='w-full h-5'></div>
              <div className='flex'>
                <h2 className="flex-wrap text-lg font-semibold text-gray-900 mb-6">License</h2>
                <FiInfo className="mt-2 ml-1 h-4 w-4 text-gray-400" />
              </div>
              
              <div className='flex gap-5'>
              {/* 版税 */}
              <FormField
                control={form.control}
                name="royalty"
                rules={{
                  required: "版税不能为空",
                  pattern: {
                    value: /^\d+%?$/,
                    message: "请输入合法的版税格式，如 15%",
                  }
                }}
                render={({ field }) => (
                  <FormItem className="mb-6">
                    <div className="flex items-center mb-1">
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Royalty</FormLabel>
                      <FiInfo className="ml-1 h-4 w-4 text-gray-400" />
                    </div>
                    
                    <FormControl>
                      <Input
                        maxLength={6} 
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="15%"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terms"
                rules={{ required: "请选择授权策略" }}
                render={({ field }) => (
                  <FormItem className="mb-6">
                    <div className="flex items-center mb-1">
                      <FormLabel className="block text-sm font-medium text-gray-700">Terms</FormLabel>
                      <FiInfo className="ml-1 h-4 w-4 text-gray-400" />
                    </div>                    
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value} >
                        <SelectTrigger>
                          <SelectValue placeholder="请选择授权策略" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1_All_Rights_Reserved">All Rights Reserved</SelectItem>
                          <SelectItem value="2_Public_Domain">Public Domain</SelectItem>
                          <SelectItem value="3_Creative_Commons_Attribution">Creative Commons (CC) Attribution</SelectItem>
                          <SelectItem value="4_CC_Attrib_NonCommercial">(CC) Attrib. NonCommercial</SelectItem>
                          <SelectItem value="5_CC_Attrib_NonComm_NoDerivs">(CC) Attrib. NonComm. NoDerivs</SelectItem>
                          <SelectItem value="6_CC_Attrib_NonComm_ShareAlike">(CC) Attrib. NonComm. ShareAlike</SelectItem>
                          <SelectItem value="7_CC_Attribution_ShareAlike">(CC) Attribution-ShareAlike</SelectItem>
                          <SelectItem value="8_CC_Attribution_NoDerivs">(CC) Attribution-NoDerivs</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              </div>

            </div>
          </div>

            </form>
          </Form>


        </div>
      </main>
    </div>
  )
}

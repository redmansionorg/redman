'use client'

import React,{useState} from 'react'
import { FiArrowLeft, FiImage, FiPlus, FiInfo } from 'react-icons/fi'

import { Button } from "@/components/ui/button"

/*
 * 图片预览与IPFS上传
 */
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import s3 from "@/lib/aws3"

import { useEffect } from "react"

/*
 * web3 智能合约部署与交互
 */
import { BrowserProvider, ContractFactory } from "ethers";
import { keccak256, solidityPacked, toUtf8Bytes } from 'ethers'
import ArtworkOpus from "@/contracts/ArtworkOpus.json"; // ABI + bytecode
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
import { useSearchParams } from "next/navigation";

import { Progress } from "@/components/ui/progress"

import {ht} from "@/utils/ht"

const factoryAddress = process.env.NEXT_PUBLIC_ART_FACTORY; // OpusFactory工厂地址，可以是 Remix 部署的地址


type FormValues = {
  title: string
  symbol: string
  description: string
  pseudonym: string
  fullname: string
  identity: string
  royalty: string
}


// write novel page
export default function Page() {

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null);
  const MAX_SIZE = 100 * 1024 // 100KB

  const [logoCid, setLogoCid] = useState<string | null>(null)
  const [metadataCid, setMetadataCid] = useState<string | null>(null)

  //contract deploying
  const [deploying, setDeploying] = useState(false);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // const [calling, setCalling] = useState(false);
  // const [txhash, setTxHash] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [percent, setPercent] = useState(0);

  const router = useRouter()

  const searchParams = useSearchParams();
  const bookAddress = searchParams.get('book_id');
  const bookTitle = searchParams.get('book_title');



  const form = useForm<FormValues>(
    {defaultValues: {title: "",symbol: "",description: "",pseudonym: "",fullname: "",identity: "",royalty: ""},}
  );

  /*
   *  该部分需要进一步讨论，这些变量是否有必要出现在智能合约中，还是可以只通过规定协议，大家自行验证即可
      哈希	 全称	                    结构	                            作用
      CCID	Book Universal ID	      keccak256(title + description)	      核心内容标识
      PUID	Person Universal ID	    keccak256(fullname + identity)	  作者唯一身份哈希
      RUID	Right of Author	        keccak256(CCID + PUID)            某人对某书的初始确权  = Copyright ID
      LUID	License Universal ID	  keccak256(RUID + terms + royalty)	某人在某策略下授权创作
      LUID_signature		            signMessage(LUID)	                钱包对LUID签名，确保授权行为真实，供二创验证
   */
  const [CCID, setCCID] = useState("")
  const [PUID, setPUID] = useState("")
  // const [RUID, setRUID] = useState("")
  // const [LUID, setLUID] = useState("0xluidabcdef1234567890")

  const { watch } = form
  const title = watch("title")
  const symbol = watch("symbol")
  const description = watch("description")
  const pseudonym = watch("pseudonym")
  const fullname = watch("fullname")
  const identity = watch("identity")
  const royalty = watch("royalty")
  //const terms = watch("terms")

  /*
   * 0、onSubmit用户触发执行命令
   * 1、通过form表单获得用户输入并且自动验证 - react-hook-form
   * 2、通过拖拽或点击onDrop获得logo图像文件 - react-dropzone
   * 3、上传logo到ipfs服务器 - aws3/filebase
   * 4、生成CCID（需logoCid），组装metadata - ethers
   * 5、上传metadata.json到ipfs服务器 - aws3/filebase
   * 6、准备参数并调用智能合约ArtworkOpus部署 - ethers
   */

  useEffect(() => {
    if(error){
      console.log("发生错误：" + error)
    }
  }, [error])

  useEffect(() => {
    // metadata
    if(!CCID)return;
    console.log('CCID-onsubmit: '+CCID)
    const metadata = newMetadata();
    if(!metadata) return;
    uploadMetadata(JSON.stringify(metadata))

  }, [CCID])

  useEffect(() => {
    // CCID
    if (logoCid) {
      //const buid = keccak256(toUtf8Bytes(title.trim() + logoCid.trim()))
      const buid = keccak256(solidityPacked(['string', 'string'],[title.trim(), logoCid.trim()]))
      setCCID(buid)
    }
  }, [logoCid])

  useEffect(() => {
    // PUID
    if (fullname?.trim() && identity?.trim()) {
      //const puid = keccak256(toUtf8Bytes(fullname.trim() + identity.trim()))
      const puid = keccak256(solidityPacked(['string', 'string'],[fullname.trim(), identity.trim()]))
      setPUID(puid)
    } else {
      setPUID("")
    }
  }, [fullname, identity])

  useEffect(() => {
    // CID 图片上传到IPFS后会生成CID，此时就可以用来发起
    if (metadataCid) {
      console.log(`LOGO: ${logoCid}  DESC: ${metadataCid}  CCID: ${CCID}  PUID: ${PUID}`)
      deployContract()
    } else {
      //
    }
  }, [metadataCid])

  useEffect(() => {
    //
    if (contractAddress&&window) {
      setPercent(100)
      router.replace('/creative?type=art')
      //下面这个调用会导致整个SPA页面重新更新
      //window.location.replace('/creative?refresh=true')
    }
  }, [contractAddress])


  // 上传logo图像到ipfs
  const uploadFile = async (file:File) => {
    const params = {
      Bucket: 'redmansion',
      Key: `collect/${bookTitle}_${title}_logo_${address}`,
      Body: file,
      ContentType: file.type,
    };

    setPercent(10)

    try {
      if(logoCid)return
      //以下方法比较快，是官方给出的方法，好像一次性就返回了cid
      const request = s3.putObject(params);
      console.log(request)
      await new Promise((res) => setTimeout(res, 1000)) // 等 1 秒
      request.on('httpHeaders', (statusCode, headers) => {
        console.log(`LOGO_CID: ${headers['x-amz-meta-cid']}`);
        const cid = headers['x-amz-meta-cid']
        setPercent(20)
        setLogoCid(cid)
        //状态还不能立刻就用
        //console.log(uploadedCid)
      });
      request.on('error', (err)=>{console.log(err);setError(err.message || "上传概要失败");setUploading(false);})
      const result = await request.send();

    } catch (err) {
      console.error('Upload error:', err);
      setError("上传logo失败"+err);
      setUploading(false)
    } finally {
      //
    }
  };

  const newMetadata = () => {
    console.log('AWID:'+CCID+' PUID:'+PUID)
    if(!CCID||!PUID)return;
    //const RUID = keccak256(toUtf8Bytes(CCID + PUID))
    const ruid = keccak256(solidityPacked(['bytes32', 'bytes32'],[PUID, CCID]))
    //版权
    //setRUID(ruid)
    
    const metadata = {
      name: title,
      symbol,
      description,
      image: "ipfs://" + logoCid,  // 上传封面图后获得的 CID
      external_url: 'https://redmansion.io/artwork/watchcollection',
      attributes: [
        { trait_type: "原作名称", value: bookTitle },
        { trait_type: "授权作者", value: '' },
        { trait_type: "许可协议", value: 'CC-BY-NC' },
        { trait_type: "分类", value: "科幻" },
        { trait_type: "版税", value: {royalty} },
        { trait_type: "个数", value: 0 },
        { trait_type: "作者", value: pseudonym },
        { trait_type: "建立时间", value: Date.now() }
      ],
      origin: {						                      // 原作的关键信息
        ruid: "0xruidabcdef0987654321",		      // original copyright id 原创版权、父版权ID
        luid: "0xoluidabcdef1234567890",		    // 原始授权协议指纹
        signature: "0xoriginSignaturebyowner",	// 授权owner钱包签名
        royalty: 10,					                  // MVP简化就只有一个父级，如果是多级最好是整个链条加总版税
        bookAddr: "0xOriginBookAddress",
        authorAddr: "0xWalletAddress",		      // 原创作者的钱包地址
        timestamp: Date.now()  			            // 时间戳，上链存证的
      },
      copyright: {
        ruid: ruid,
        puid: PUID,
        awid: CCID,
      },
      license: {
        terms: "Creative Commons (CC) Attribution",	// 继承自原创，不可修改，并且授权方式已经在attributes中显示（该显示不做逻辑运算控制）
        royalty: 5,							                    // 强烈建议说明此为“本合集中分润比例”，并非继承与原始，可以自行设置
        luid: "0xluidabcdef1234567890",             // 当前授权协议指纹，仅针对本集合
        signature: "0xsignaturebyownerabcdef1234567890",
      },
      properties: {
        defaultPrice: 0.5,
        tags: ['豪门','孤儿','盗贼','特工','黑客','明星','特种兵','杀手','老师','学生','胖子','宠物','蜀山'],   //用于搜索引擎个性化分类使用
        author: pseudonym,
        authorAddr: address,
        timestamp: Date.now()
      }
    };
    console.log(metadata)

    return metadata;
  }

  // 上传文件
  const uploadMetadata = async (meta:String) => {
    const params = {
      Bucket: 'redmansion',
      Key: `collect/${bookTitle}_${title}_metadata_${address}`,
      Body: meta,
      ContentType: 'text/plain',
      //Metadata: { import: "car" } //这一句话好像没用
    };
    setPercent(30)
    try {
      if(metadataCid)return
      //以下方法比较快，是官方给出的方法，好像一次性就返回了cid
      const request = s3.putObject(params);
      console.log(request)
      await new Promise((res) => setTimeout(res, 1000)) // 等 1 秒
      request.on('httpHeaders', (statusCode, headers) => {
        console.log(`DESC_CID: ${headers['x-amz-meta-cid']}`);
        const cid = headers['x-amz-meta-cid']
        setPercent(40)
        setMetadataCid(cid)
        //状态还不能立刻就用
        //console.log(uploadedCid)
      });
      request.on('error', (err)=>{console.log(err);setError(err.message || "上传概要失败");setUploading(false);})
      const result = await request.send();

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
    // setFile(selected)
    // setPreview(URL.createObjectURL(selected))
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
      alert('请选择专辑的logo')
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
    console.log(`CID: ${metadataCid}  ${logoCid}`)
    if(metadataCid&&logoCid){
      deployContract()
      return
    }

    console.log(`Try to upload logo & description to ipfs`)
    setUploading(true)
    uploadFile(file)

    //服务器返回CID header后，由监听方法useEffect->uploadedCid检测后执行
    return
  }

  const deployContract = async () => {
    if(deploying||contractAddress)return;
    try {
      setDeploying(true);
      setUploading(false);
      setError(null);

      setPercent(50)

       // 连接钱包（BrowserProvider 是 v6 中的替代）
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []); 
      const signer = await provider.getSigner();

      setPercent(60)

      console.log("部署参数：", {title,symbol,metadataCid,logoCid,pseudonym,PUID,royalty,});
      // 准备合约工厂
      const factory = new ContractFactory(ArtworkOpus.abi,ArtworkOpus.bytecode,signer);
      // 部署合约
      const contract = await factory.deploy(title,symbol,metadataCid,logoCid,pseudonym,PUID,royalty,bookAddress,factoryAddress);
      setPercent(70)
      // 等待部署确认
      await contract.waitForDeployment();
      setPercent(80)
      // 获取合约地址
      const address = await contract.getAddress();

      setPercent(90)

      setContractAddress(address);

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
        <div className='text-center text-2xl font-bold mb-7'>创建“{bookTitle}”衍生艺术品新专辑</div>
        <Progress value={percent} className="bg-gray-200 w-full h-[2px]"/>
        <div className="flex flex-col md:flex-row gap-8 mt-3">
          {/* 左侧封面区域 */}
          <div className="">
            <div {...getRootProps()} className="w-[195px] md:w-[195px] lg:w-[256px] bg-gray-100 rounded-lg aspect-[1/1] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
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
                  <p className="text-gray-400 text-sm">350x350 ({'<'}100KB)</p>
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
                <h2 className="flex items-center text-lg font-semibold text-gray-900">专辑详情（Details）</h2>
                <div className='flex flex-row items-center gap-1'>
                  <div className='text-xs'>
                    {uploading && (<span>🎨上传至IPFS...</span>)}
                    {deploying && (<span>🧠调用区块链合约...</span>)}
                    {contractAddress && (<span>✅成功添加！</span>)}
                  </div>
                  {contractAddress && (
                    <div className="mt-4 text-green-700">
                      🎉 专辑部署成功：
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
              <div className='grid grid-cols-2 gap-5'>
              <FormField
                control={form.control}
                name="title"
                rules={{required:"专辑名字不能为空"}}
                render={({field}) => (
                  <FormItem className="mb-6">
                    <FormLabel className="block text-sm font-medium text-gray-700 mb-1">专辑名</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="My Token"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="symbol"
                rules={{required:"专辑简称不能为空"}}
                render={({field}) => (
                  <FormItem className="mb-6">
                    <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Symbol</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="MTK"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              </div>

              {/* 描述 */}
              <FormField
                control={form.control}
                name="description"
                rules={{required:"简介不能为空"}}
                render={({field}) => (
                  <FormItem>
                    <div className="flex items-center mb-1">
                      <FormLabel className="block text-sm font-medium text-gray-700">Description</FormLabel>
                      <FiInfo className="ml-1 h-4 w-4 text-gray-400" />
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Tell readers what your collection is about..."
                      />
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}
              />
              <div className="mb-6">
                <div>
                  <input value={ht(CCID)} id="CCID" type="text" disabled className="w-full h-8 text-gray-400" placeholder="#" />
                </div>
              </div>

              <div className='w-full h-5'></div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">作者信息（Author）</h2>

              {/* 笔名 */}
              <FormField
                control={form.control}
                name="pseudonym"
                rules={{required: "笔名不能为空"}}
                render={({field})=>(
                  <FormItem className="mb-6">
                    <div className="flex items-center mb-1">
                      <FormLabel className="block text-sm font-medium text-gray-700">署名</FormLabel>
                      <FiInfo className="ml-1 h-4 w-4 text-gray-400" />
                    </div>
                    <FormControl>
                      <Input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="署名"
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
                <h2 className="flex-wrap text-lg font-semibold text-gray-900">版权信息（Copyright）</h2>
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
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">全名（Name）</FormLabel>
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
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">身份证（Identity）</FormLabel>
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
                <input value={ht(PUID)} id="PUID" type="text" disabled={true} className="w-full h-8 text-gray-400" placeholder="#" />
              </div>


              {/* 授权策略 */}
              <div className='w-full h-5'></div>
              <div className='flex'>
                <h2 className="flex-wrap text-lg font-semibold text-gray-900 mb-6">授权许可（License）</h2>
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
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">版税率（Royalty）</FormLabel>
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

              {/* <FormField
                control={form.control}
                name="terms"
                rules={{ required: "请选择授权策略" }}
                render={({ field }) => (
                  <FormItem className="mb-6">
                    <div className="flex items-center mb-1">
                      <FormLabel className="block text-sm font-medium text-gray-700">条款（Terms）</FormLabel>
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
              /> */}

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

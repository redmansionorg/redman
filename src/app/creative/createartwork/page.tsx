'use client'

import React,{useState} from 'react'
import { FiArrowLeft, FiImage, FiPlus, FiInfo } from 'react-icons/fi'
import { Button } from "@/components/ui/button"

/*
 * 图片预览与IPFS上传
 */
import { useCallback,useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import s3 from "@/lib/aws3"

/*
 * web3 智能合约部署与交互
 */
import { keccak256, solidityPacked,toUtf8Bytes } from "ethers";
import ArtworkOpusAbi from "@/contracts/ArtworkOpus.abi.json"; // ABI + bytecode
import { useWaitForTransactionReceipt, useWriteContract,useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseEventLogs, Log } from 'viem'

/*
 * 1. 每个FormControl 里面只能有一个Input
 */
import { useForm } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

//在13.4+使用下面这个方法会错误
// import {useRouter} from 'next/router';
import {useRouter,useSearchParams} from "next/navigation"

import { Progress } from "@/components/ui/progress"

import {ht}  from '@/utils/ht'


type FormValues = {
  title: string
  description: string
  pseudonym: string
  fullname: string
  identity: string
  royalty: string
}


// mint art page
export default function Page() {

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null);
  const MAX_SIZE = 100 * 1024 // 100KB

  const [logoCid, setLogoCid] = useState<string | null>(null)
  const [metadataCid, setMetadataCid] = useState<string | null>(null)

  //contract deploying
  // const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  //contract method invoke
  const [calling, setCalling] = useState(false);
  const [txhash, setTxHash] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [percent, setPercent] = useState(0);

  const router = useRouter()

  const searchParams = useSearchParams();
  const artAddress = searchParams.get('art_id');
  const artName = searchParams.get('art_name');  
  const tokenId = searchParams.get('token_id');
  const personId = searchParams.get('person_id');
  const author = searchParams.get('author');
  const license = searchParams.get('royalty');

  /*
   *  该部分需要进一步讨论，这些变量是否有必要出现在智能合约中，还是可以只通过规定协议，大家自行验证即可
   * 
   *  后来经过分析，只有需要在智能合约中计算，或者固定在智能合约中不变的部分，才需要放在智能合约中。
   *  1、如果title、description、terms、cid等等，全部都放在智能合约中，那么*UID就不需要重复放在智能合约中，
   *  如果要验证，也只需要创建的时候通过方法参数提供*UID，然后智能合里面代码keccak256对比是否一致就可以了
   *  2、如果title、description、terms、cid等等，都不放在智能合约中，而是放在IPFS或链下，那么就*UID就必须放在智能合约中，
   *  以方便程序在读取链下数据的时候可以通过keccak256链下的数据，对比合约中的*UID即可知道链下数据是否为真实正确的。
   * 
      哈希	 全称	                    结构	                            作用
      AWID	Artwork ID	            keccak256(title + logoCid)	      NFT的核心内容标识
      PUID	Person Universal ID	    keccak256(fullname + identity)	  作者唯一身份哈希
      RUID	Right of Author	        keccak256(AWID + PUID)            某人对某书的初始确权  = Copyright ID
      LUID	License Universal ID	  keccak256(RUID + terms + royalty)	某人在某策略下授权创作
      LUID_signature		            signMessage(LUID)	                钱包对LUID签名，确保授权行为真实，供二创验证
   */
  const [AWID, setAWID] = useState("")
  const [PUID, setPUID] = useState("")
  const [RUID, setRUID] = useState("")
  const [LUID, setLUID] = useState("")


  /*
   * 表单处理
   */
  const form = useForm<FormValues>(
    {defaultValues: {title: "",description: "",pseudonym: "",fullname: "",identity: "",royalty: ""},}
  );

  const { watch } = form
  const title = watch("title")
  const description = watch("description")
  const pseudonym = watch("pseudonym")
  const fullname = watch("fullname")
  const identity = watch("identity")
  const royalty = watch("royalty")
  //const terms = watch("terms") //条款默认继承小说的条款

  // 写入准备
  /*
   * 与智能合约交互hook监听处理等
   */
  const { writeContract, isPending, data:txData, error:callError } = useWriteContract()

  // 等待交易确认
  const { data: receipt } = useWaitForTransactionReceipt({
    hash: txhash as `0x${string}`,
    confirmations: 2,
    query: {
      enabled: !!txhash,  // 👈 加这一句，只有 hash 存在才会触发监听
    }
  })

  useEffect(() => {
    if(error){
      console.log("发生错误：" + error)
    }
  }, [error])

  useEffect(() => {
    if(personId){
      setPUID(personId)
    }
  }, [])
  
  useEffect(() => {
    // CID 图片上传到IPFS后会生成CID，此时就可以用来发起
    if (txData) {
      console.log(`TX Hash: ${txhash}`)
      setPercent(80)
      setUploading(false)
      setCalling(false)
      setTxHash(txData)
    }
  }, [txData])

  useEffect(() => {
    if (receipt) {
      const logs = parseEventLogs({
        abi: ArtworkOpusAbi,
        logs: receipt.logs,
        eventName: 'ArtMinted',
      }) as any[]

      // const addedChapter = logs?.[0]?.args;
      // console.log("章节号：", addedChapter.chapterNumber);

      const chnum = logs[0]?.args?.tokenId
      console.log("铸造返回的代币号码："+chnum);
      
      if (chnum == tokenId) {
        console.log("铸造返回的ID与目标铸造ID不一致，请检查, Target："+tokenId+" Results: "+chnum);
      }
      setPercent(100)
      setCalling(false)
      setSuccess(true)
      //setTxHash(null) //不再继续监听receipt
      console.log('艺术品新增成功：', logs)
      router.replace('/creative?type=art')
      //下面这个调用会导致页面重新更新
      //window.location.replace('/creative?refresh=true')
    }
  }, [receipt])

  useEffect(() => {
    if (callError) {
      console.error("失败！", callError);
      setError(callError.toString())
      setTxHash(null)
    }
  }, [callError]);


  /*
   * hook监听关键变量的变化，并分别做下一步的打算
   */
  useEffect(() => {
    // AWID
    if(!AWID)return;
    console.log('AWID-onsubmit: '+AWID)
    const metadata = newMetadata();
    if(!metadata) return;
    uploadMetadata(JSON.stringify(metadata))

  }, [AWID])

  useEffect(() => {
    // AWID 只对名称与logoCid存证
    console.log('create AWID: title: '+title +" logoCid: "+logoCid)
    if (title?.trim() && logoCid?.trim()) {
      //const awid = keccak256(toUtf8Bytes(title.trim() + logoCid.trim()))
      //const awid = keccak256(solidityPacked(['bytes32', 'bytes32'],[toUtf8Bytes(title.trim()), toUtf8Bytes(logoCid.trim())]))
      const awid = keccak256(solidityPacked(['string', 'string'],[title.trim(), logoCid.trim()]))
      console.log("created AWID:"+awid)
      setPercent(30)
      setAWID(awid)
    }
  }, [logoCid])

  useEffect(() => {
    // PUID
    if (fullname?.trim() && identity?.trim()) {
      //const puid = keccak256(toUtf8Bytes(fullname.trim() + identity.trim()))
      //const puid = keccak256(solidityPacked(['bytes32', 'bytes32'],[toUtf8Bytes(fullname.trim()), toUtf8Bytes(identity.trim())]))
      const puid = keccak256(solidityPacked(['string', 'string'],[fullname.trim(), identity.trim()]))
      setPUID(puid)
    }
  }, [fullname, identity])

  useEffect(() => {
    // CID 图片上传到IPFS后会生成CID，此时就可以用来发起
    if (metadataCid && AWID && PUID) {
      console.log(`TITLE: ${title} LOGO: ${logoCid}  =>  AWID: ${AWID}  PUID: ${PUID}`)
      setPercent(50)
      mintTokenContract()
    }
  }, [metadataCid])


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

  // 上传文件
  const uploadFile = async (file:File) => {
    const params = {
      Bucket: 'redmansion',
      Key: `artwork/${artName}_${tokenId}_${title}_image_${artAddress}`,
      Body: file,
      ContentType: file.type,
      //Metadata: { import: "car" } //这一句话好像没用
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
    console.log(' PUID:'+PUID + 'AWID: '+AWID)
    if(!AWID||!PUID)return;
    //const RUID = keccak256(toUtf8Bytes(PUID + AWID))
    const ruid = keccak256(solidityPacked(['bytes32', 'bytes32'],[PUID, AWID]))
    console.log('RUID: ' + ruid)
    //版权
    setRUID(ruid)
    
    const metadata = {
      name: title,
      description: description,
      // image: "ipfs://" + logoCid,  // 上传封面图后获得的 CID
      image: "ipfs://" + logoCid,  // 上传封面图后获得的 CID
      external_url: 'https://redmansion.io/artwork/watchartwork',
      attributes: [
        { trait_type: "Background", value: "Black" },
        { trait_type: "Eyeball", value: "White" },
        { trait_type: "Eyecolor", value: "Red" },
        { trait_type: "Iris", value: "Small" },
        { trait_type: "Shine", value: "Shapes" }
      ],
      copyright: {
        ruid: RUID,
        puid: PUID,
        awid: AWID
      },
      license: {
        royalty: license?Number(license):royalty
      },
      properties: {
        collectionAddr: artAddress,
        tokenId,
        price: 0.5,
        authorAddr: address,
        author: author?author:pseudonym,
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
      Key: `artwork/${artName}_${tokenId}_${title}_metadata_${artAddress}`,
      Body: meta,
      ContentType: 'text/plain',
      //Metadata: { import: "car" } //这一句话好像没用
    };
    setPercent(40)
    try {
      if(metadataCid)return
      //以下方法比较快，是官方给出的方法，好像一次性就返回了cid
      const request = s3.putObject(params);
      console.log(request)
      await new Promise((res) => setTimeout(res, 1000)) // 等 1 秒
      request.on('httpHeaders', (statusCode, headers) => {
        console.log(`META_CID: ${headers['x-amz-meta-cid']}`);
        const cid = headers['x-amz-meta-cid']
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


  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();

  /*
   * 提交表单主函数，检查Form必填项，然后检查图像文件。
   * 一步一步执行，image上传IPFS，生成AWID，上传metadata。
   * mintArt 铸造NFT。。。
   */
  const onSubmit = async(formData: FormValues) => {
    console.log("✅ 表单通过校验，提交数据：", formData)
    // 下一步：上传文件 / 创建智能合约
    if (!file){
      alert('请选择艺术品图像文件')
      return
    }
    if(uploading || calling || success){
      return
    }
    console.log("钱包连接状态：", isConnected, address);
    if(!isConnected){
      openConnectModal?.()
      return
    }

    // 之前可能表单准备好，但是提交部署出错了，导致没有走下去
    console.log(`CID: ${logoCid}`)
    if(logoCid&&metadataCid){
      mintTokenContract()
      return
    }

    console.log(`Try to upload logo ipfs`)
    setUploading(true)
    uploadFile(file)

    // 不能够立刻调用，因为AWID可能为空，它是一个useState，设置状态变量是一个异步的过程
    // const metadata = newMetadata();
    // if(!metadata) return;
    // uploadMetadata(JSON.stringify(metadata))
    return
  }

  // 调用铸造NFT合约方法
  const mintTokenContract = async () => {
    if (calling)
      return;
    setCalling(true)
    try {
      const param = {
        address: artAddress as `0x${string}`,
        abi: ArtworkOpusAbi,
        functionName: 'mintArt',
        args: ["ipfs://" + metadataCid, RUID, PUID, AWID],
      }
      console.log('Contract Invoke Parameter: ' + param)
      /*
       * writeContract()	    没有返回值（只能走回调：通过useWriteContract的hook来回调）
       * writeContractAsync()	返回 0x... 字符串（交易哈希）
       * simulateContract()	返回 { result, request }
       */
      setPercent(60)
      await writeContract(param)
      setPercent(70)
      //后面发生的事情, 通过hook获得, txData -> txhash -> receipt | error

    } catch (err) {
      console.error('创建失败：', err)
    }
  }


  return (
    <div className="bg-white">

      {/* 主要内容区 */}
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <div className='text-center text-2xl font-bold mb-7'>为“{artName}”专辑创建#{tokenId}NFT</div>
        <Progress value={percent} className="bg-gray-300 w-full h-[2px]"/>
        <div className="flex flex-col md:flex-row gap-8 mt-3">
          {/* 左侧封面区域 */}
          <div className="ml-3">
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
                <h2 className="flex items-center text-lg font-semibold text-gray-900">TOKEN详情（Details）</h2>
                <div className='flex flex-row items-center gap-1'>
                  <div className='text-xs'>
                    {uploading && (<span>🎨上传至IPFS...</span>)}
                    {calling && (<span>🧠调用区块链合约...</span>)}
                    {success && (<span>✅成功添艺术品内容</span>)}
                  </div>
                  {success && (
                    <div className="mt-4 text-green-700">
                      🎉 艺术品铸造成功：
                      <a
                        href={`https://aeneid.storyscan.xyz/address/${artAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {artAddress}
                      </a>
                    </div>
                  )}
                  {error && <div className="mt-4 text-red-600">❌ 错误</div>}
                  <Button className='w-20' type="submit" disabled={txhash!=null||success}>Publish</Button>
                </div>
              </div>

              {/* 标题 */}
              <div>
              <FormField
                control={form.control}
                name="title"
                rules={{required:"专辑名字不能为空"}}
                render={({field}) => (
                  <FormItem className="mb-6">
                    <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Name</FormLabel>
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
                      <textarea
                        {...field}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Tell readers what your token is about..."
                      />
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}
              />
              <div className="mb-6">
                <div>
                  <input value={ht(AWID)} id="AWID" type="text" disabled className="w-full h-8 text-gray-400" placeholder="#" />
                </div>
              </div>

              <div className='w-full h-5'></div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">作者信息（Author）</h2>

              {/* 笔名 */}
              {!author&&(
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
              )}

              {!personId&&(<>
              <div className='w-full h-5'></div>
              <div className='flex mb-6'>
                <h2 className="flex-wrap text-lg font-semibold text-gray-900">版权信息（Copyright）</h2>
                <FiInfo className="mt-2 ml-1 h-4 w-4 text-gray-400" />
              </div>

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
              </>)}

              <div className="mb-6">
                <input value={ht(PUID)} id="PUID" type="text" disabled={true} className="w-full ml-3 h-8 text-gray-400" placeholder="#" />
              </div>


              {!license&&(<>
              <div className='w-full h-5'></div>
              <div className='flex'>
                <h2 className="flex-wrap text-lg font-semibold text-gray-900 mb-6">授权许可（License）</h2>
                <FiInfo className="mt-2 ml-1 h-4 w-4 text-gray-400" />
                <input id="PIN" type="text" disabled={true} className="w-60 ml-3 h-8" placeholder="#" />
              </div>
              
              <div className='flex gap-5'>
              
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

              </div>
              </>)}

            </div>
          </div>

            </form>
          </Form>


        </div>
      </main>
    </div>
  )
}

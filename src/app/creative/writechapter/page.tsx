'use client'

import React from 'react'
import { Button } from "@/components/ui/button"

//react增强hook等
import { useState, useEffect } from "react"
//钱包连接rainbowkit
import { useAccount } from "wagmi";
import { useConnectModal } from '@rainbow-me/rainbowkit';

//上传到IPFS
import s3 from '@/lib/aws3';

import { Progress } from "@/components/ui/progress"

/*
 * web3 智能合约部署与交互
 */
// import { BrowserProvider, ContractFactory } from "ethers";
// import { keccak256, toUtf8Bytes } from 'ethers'
import LiteratureOpusAbi from "@/contracts/LiteratureOpus.abi.json"; // ABI
import { parseEventLogs, Log } from 'viem'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
/*
 * 1. FormControl 里面只能有一个Input
 */
import { set, useForm } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

import { useSearchParams } from "next/navigation";

//在13.4+使用下面这个方法会错误
//import { useRouter } from 'next/router'
import {useRouter} from "next/navigation"


type FormValues = {
  title: string
  content: string
}


export default function Page() {

    //const [title, setTitle] = useState<string | null>(null)
    //const [content, setContent] = useState<string | null>(null)
    const [contentCid, setContentCid] = useState<string | null>(null)

    //contract calling
    const [uploading, setUploading] = useState(false)
    const [calling, setCalling] = useState(false);
    const [txhash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [percent, setPercent] = useState(0);

    const {isConnected, address} = useAccount();
    const {openConnectModal} = useConnectModal();

    const form = useForm<FormValues>(
        {defaultValues: {title: "",content: ""},}
    );

    const { watch } = form
    const title = watch("title")
    const content = watch("content")

    const searchParams = useSearchParams();
    const bookAddress = searchParams.get('book_id');
    const bookTitle = searchParams.get('book_title');
    const chapterId = searchParams.get('chapter_id');

    const router = useRouter()

    // 写入准备
    const { writeContract, isPending, data:txData, error:callError } = useWriteContract()

    // 等待交易确认
    const { data: receipt } = useWaitForTransactionReceipt({
        hash: txhash  as `0x${string}`,
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
        // CID 图片上传到IPFS后会生成CID，此时就可以用来发起
        if (txData ) {
            setPercent(90)
            console.log(`TX Hash: ${txhash}`)
            setUploading(false)
            setCalling(false)
            setTxHash(txData)
        }
      }, [txData])
    
    useEffect(() => {
        if (receipt) {
            const logs = parseEventLogs({
                abi: LiteratureOpusAbi,
                logs: receipt.logs,
                eventName: 'ChapterAdded',
            }) as any[]

            // const addedChapter = logs?.[0]?.args;
            // console.log("章节号：", addedChapter.chapterNumber);
            setPercent(100)
            const chnum = logs[0]?.args?.chapterNumber
            if(chnum == chapterId){
                setCalling(false)
                setSuccess(true)
                console.log('小说章节新增成功：', logs)
                router.replace('/creative?refresh=true')
                //下面这个调用会导致页面重新更新
                //window.location.replace('/creative?refresh=true')
            }
        }
    }, [receipt])

    useEffect(() => {
        if (callError) {
            console.error("失败！", callError);
            setError(callError.toString())
            setTxHash(null)
        }
    }, [callError]);

    useEffect(() => {
        // CID 图片上传到IPFS后会生成CID，此时就可以用来发起
        if (contentCid ) {
            setPercent(40)
            console.log(`CONTENT CID: ${contentCid}`)
            setUploading(false)
            addChapterContract()
        } else {
          //
        }
      }, [contentCid])
    
       // 上传文件
    const uploadContent = async (text:String) => {
        const params = {
        Bucket: 'redmansion',
        Key: `chapter/${bookTitle}_${chapterId}_${title}_content_${bookAddress}`,
        Body: text,
        ContentType: 'text/plain',
        //Metadata: { import: "car" } //这一句话好像没用
        };

        try {
        if(contentCid)return
        setPercent(10)
        //以下方法比较快，是官方给出的方法，好像一次性就返回了cid
        const request = s3.putObject(params);
        console.log(request)
        await new Promise((res) => setTimeout(res, 1000)) // 等 1 秒
        request.on('httpHeaders', (statusCode, headers) => {
            console.log(`DESC_CID: ${headers['x-amz-meta-cid']}`);
            const cid = headers['x-amz-meta-cid']
            setPercent(30)
            setContentCid(cid)
            //setUploading(false)
            //状态还不能立刻就用
            //console.log(uploadedCid)
        });
        request.on('error', (err)=>{console.log(err);setError(err.message || "上传概要失败");setUploading(false);})
        const result = await request.send();
        setPercent(20)
        } catch (err) {
            console.error('Upload error:', err);
            setError("上传小说章节内容失败"+err);
            setUploading(false)
        } finally {
            //
        }
    };

    const addChapterContract = async()=>{
        if(calling)
            return;
        setCalling(true)
        try {
            const param = {
                address: bookAddress as `0x${string}`,
                abi: LiteratureOpusAbi,
                functionName: 'addChapter',
                args: [
                Number(chapterId),
                title,
                contentCid,
                0, // price
                ],
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
            //后面发生的事情
            //通过hook获得

        } catch (err) {
            console.error('创建失败：', err)
        }finally{
            //
        }

    }

    const onSubmit = async(formData: FormValues) => {
        console.log("✅ 表单通过校验，提交数据：", formData)
        // 下一步：上传文件 / 创建智能合约
        if(bookAddress == null || bookAddress.length==0){
            setError('没有指定小说，你需要在选择的小说上新建章节内容。')
        }
        if (!bookAddress||!bookAddress.startsWith('0x')||!bookTitle||!chapterId){
            setError('没有在有效的小说对象下面进行操作。')
            return
        }
        if(uploading || calling || txData){
            return
        }
        console.log("钱包连接状态：", isConnected, address);
        if(!isConnected){
            openConnectModal?.()
            return
        }

        // 之前可能表单准备好，但是提交合约交互出错了，导致没有走下去
        console.log(`CID: ${contentCid}`)
        if(title&&contentCid){
            addChapterContract()
            return
        }

        console.log(`Try to upload content to ipfs`)
        setUploading(true)
        uploadContent(content)

    }


    return (
        <div className='mt-5 w-full md:w-3xl lg:w-5xl'>
            <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className='flex flex-col gap-3'>
                <div className='flex justify-between items-center px-3 mt-3'>
                    <div className='text-gray-400'>{bookTitle} - 第{chapterId}章</div>
                    <div className='text-sm text-gray-400'>
                        {uploading && (<span>🎨上传章节至IPFS...</span>)}
                        {calling && (<span>🧠调用区块链合约...</span>)}
                        {txhash&&!success && (<span>等待区块交易打包...</span>)}
                        {success && (<span>✅成功添加章节内容！</span>)}
                    </div>
                    <div>{error&&<div className="mt-4 text-red-600">❌ 错误</div>}</div>
                    <Button className='w-20' type="submit" disabled={uploading||calling||txhash!=null}>Publish</Button>
                </div>
                <article className='p-3 shadow-xl'>

                    <FormField
                        control={form.control}
                        name="title"
                        rules={{required:"小说章节名称不能为空"}}
                        render={({field}) => (
                        <FormItem className="mb-1">
                            <FormMessage/>
                            <FormControl>
                            <input
                                type="text"
                                className="text-2xl text-center w-full p-3 min-h-[1em] outline-none empty:before:text-gray-400"
                                placeholder="Chapter Untitled"
                                {...field}
                            />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                    <Progress value={percent} className="bg-gray-200 w-full h-[2px] mb-5"/>
                    {/* <input placeholder='Chapter Untitled' className='text-2xl text-center w-full p-3 mb-3 border-b border-gray-200 min-h-[1em] outline-none empty:before:text-gray-400'/> */}
                    
                    <FormField
                        control={form.control}
                        name="content"
                        rules={{required:"小说章节内容不能为空，建议2000到2500字之间。"}}
                        render={({field}) => (
                        <FormItem>
                            <FormControl>
                            <textarea
                                {...field}
                                rows={20}
                                className="h-full w-full p-3 text-gray-800 bg-white focus:outline-none transition-all empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
                                role="textbox"
                                aria-label="Write your chapter"
                                aria-multiline="true"
                                contentEditable="true"
                                spellCheck="true"
                                placeholder="Type your text ... "
                                suppressContentEditableWarning
                            />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                        )}
                    />
                    {/* <textarea
                        rows={20}
                        className="h-full w-full p-3 text-gray-800 bg-white 
                            focus:outline-none transition-all
                            empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
                        role="textbox"
                        aria-label="Write your chapter"
                        aria-multiline="true"
                        contentEditable="true"
                        spellCheck="true"
                        placeholder="Type your text"
                        suppressContentEditableWarning
                    /> */}
                </article>
            </div>

            </form></Form>
            
        </div>
    )
}

'use client'

import React from 'react'
import { FiImage, FiInfo } from 'react-icons/fi'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useDropzone } from 'react-dropzone'
import { UseFormReturn } from 'react-hook-form'
import { FormValues } from '../types'

interface ArtworkFormProps {
  form: UseFormReturn<FormValues>
  file: File | null
  setFile: (f: File | null) => void
  preview: string | null
  setPreview: (s: string | null) => void
  awid: string
  puid: string
  ruid: string
  status: string
  error: string | null
  onSubmit: () => void
}

export default function ArtworkForm({
  form,
  file,
  setFile,
  preview,
  setPreview,
  awid,
  puid,
  ruid,
  status,
  error,
  onSubmit,
}: ArtworkFormProps) {
  const onDrop = (accepted: File[]) => {
    const f = accepted[0]
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
  })

  const { control } = form

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* 左侧图像上传区 */}
      <div className="ml-3">
        <div
          {...getRootProps()}
          className="w-[195px] md:w-[195px] lg:w-[256px] bg-gray-100 rounded-lg aspect-[1/1] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
        >
          <input {...getInputProps()} />
          {preview ? (
            <img src={preview} alt="preview" className="w-auto h-auto rounded shadow" />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <FiImage className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500 font-medium">
                {isDragActive ? '拖放图片到此处' : '点击或拖放图片上传'}
              </p>
              <p className="text-gray-400 text-sm">350x350 ({'<'}200KB)</p>
            </div>
          )}
        </div>
      </div>

      {/* 右侧表单 */}
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6 w-full">
          <div className="flex flex-wrap justify-between items-center gap-1 mb-4">
            <h2 className="text-lg font-semibold">TOKEN详情</h2>
            <div className="flex flex-row gap-2 text-sm">
              {status === 'uploading' && '🎨 上传中...'}
              {status === 'minting' && '🧠 铸造中...'}
              {status === 'success' && '✅ 成功！'}
              {error && <span className="text-red-500">❌ {error}</span>}
              <Button type="submit" disabled={status !== 'idle'}>
                发布
              </Button>
            </div>
          </div>

          <FormField
            control={control}
            name="title"
            rules={{ required: '标题不能为空' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>名称</FormLabel>
                <FormControl>
                  <Input placeholder="My Artwork" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="description"
            rules={{ required: '简介不能为空' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>简介</FormLabel>
                <FormControl>
                  <Textarea rows={4} placeholder="介绍这个艺术品的意义..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="pseudonym"
            rules={{ required: '笔名不能为空' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>署名</FormLabel>
                <FormControl>
                  <Input placeholder="作者笔名" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={control}
              name="fullname"
              rules={{ required: '全名不能为空' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>真实姓名</FormLabel>
                  <FormControl>
                    <Input placeholder="张三" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="identity"
              rules={{ required: '身份证不能为空' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>身份证号</FormLabel>
                  <FormControl>
                    <Input placeholder="440100199901011234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="royalty"
            rules={{ required: '版税不能为空' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>版税率</FormLabel>
                <FormControl>
                  <Input placeholder="15%" maxLength={6} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-2 text-sm text-gray-500">
            <input value={awid} readOnly disabled className="text-xs text-gray-400" />
            <input value={puid} readOnly disabled className="text-xs text-gray-400" />
            <input value={ruid} readOnly disabled className="text-xs text-gray-400" />
          </div>
        </form>
      </Form>
    </div>
  )
}

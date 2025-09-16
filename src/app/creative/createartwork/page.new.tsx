'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter, useSearchParams } from 'next/navigation'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

import { buildMetadata } from './utils/buildMetadata'
import { useUploadLogo } from './hooks/useUploadLogo'
import { useUploadMetadata } from './hooks/useUploadMetadata'
import { useMintArtwork } from './hooks/useMintArtwork'

import { FormValues } from './types'
import ArtworkForm from './components/ArtworkForm'

export default function CreateArtworkPage() {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [awid, setAwid] = useState('')
  const [puid, setPuid] = useState('')
  const [ruid, setRuid] = useState('')
  const [metadataCid, setMetadataCid] = useState<string | null>(null)

  const [status, setStatus] = useState<'idle' | 'uploading' | 'minting' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const artAddress = searchParams.get('art_id')
  const artName = searchParams.get('art_name')
  const tokenId = searchParams.get('token_id')||''

  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()

  const logoUploader = useUploadLogo()
  const metaUploader = useUploadMetadata()
  const mintArtwork = useMintArtwork()

  const form = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      pseudonym: '',
      fullname: '',
      identity: '',
      royalty: '',
    },
  })

  const runCreationFlow = async (data: FormValues) => {
    setStatus('uploading')
    setError(null)

    if (!isConnected) {
      openConnectModal?.()
      return
    }
    if (!file) {
      setError('请上传艺术品图片')
      return
    }

    try {
      const logoCid = await logoUploader(file, artAddress!, tokenId!, data.title)
      const [computedAWID, computedPUID, computedRUID] = buildMetadata.hashes(
        data.title,
        logoCid,
        data.fullname,
        data.identity
      )

      setAwid(computedAWID)
      setPuid(computedPUID)
      setRuid(computedRUID)

      const metadata = buildMetadata.metadata({
        ...data,
        logoCid,
        tokenId,
        authorAddr: address!,
        awid: computedAWID,
        puid: computedPUID,
        ruid: computedRUID,
        artAddress: artAddress!,
      })

      const metaCid = await metaUploader(metadata, artAddress!, tokenId!, data.title)
      setMetadataCid(metaCid)

      setStatus('minting')
      await mintArtwork(metaCid, computedPUID, computedAWID, computedRUID, artAddress!, tokenId!, () => {
        setStatus('success')
        router.replace('/creative?type=art')
      })
    } catch (err: any) {
      setError(err.message || '处理失败')
      setStatus('error')
    }
  }

  return (
    <div className="bg-white">
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="text-center text-2xl font-bold mb-10">
          为“{artName}”专辑创建#{tokenId} NFT
        </div>
        <ArtworkForm
          form={form}
          file={file}
          setFile={setFile}
          preview={preview}
          setPreview={setPreview}
          awid={awid}
          puid={puid}
          ruid={ruid}
          status={status}
          error={error}
          onSubmit={form.handleSubmit(runCreationFlow)}
        />
      </main>
    </div>
  )
}

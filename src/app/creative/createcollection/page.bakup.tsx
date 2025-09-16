import React from 'react'
import { FiArrowLeft, FiImage, FiPlus, FiInfo } from 'react-icons/fi'

import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="bg-white">
      {/* 主要内容区 */}
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <div className='text-center text-2xl font-bold mb-10'>Create a new collection for you artworks</div>
        <div className="flex flex-col md:flex-row gap-8">
          {/* 左侧封面区域 */}
          <div className="ml-3">
            <div className="w-[195px] md:w-[195px] lg:w-[256px] bg-gray-100 rounded-lg aspect-[1/1] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
              <FiImage className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-600 font-medium">Logo image</p>
            </div>
          </div>

          {/* 右侧表单区域 */}
          <div className="w-[420px] md:w-[526px] lg:w-[760px] mr-3">
            <div className="mb-8">
              {/* 合约名称 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="My Token Contract"
                />
              </div>

              {/* 代币符号 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Token symbol</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="MTC"
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
            <div className='flex justify-end mt-12'><Button>Publish</Button></div>
          </div>
        </div>
      </main>
    </div>
  )
}

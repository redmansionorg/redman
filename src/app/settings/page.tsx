import React from 'react'
import Stamp from '@/components/Stamp';

export default function Page() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Customizable Stamps</h1>
      
      <div className="space-y-12">
        {/* Default stamp */}
        <div className="border p-6 relative">
          <p>Document content with default stamp:</p>
          <Stamp text="RMC" className="absolute top-0 right-0" />
        </div>

        {/* Customized stamp */}
        <div className="border p-6 relative">
          <p>Document with BTC stamp (more rotation):</p>
          <Stamp 
            text="BTC" 
            rotate={-20}
            className="absolute bottom-8 left-8"
            width={200}
            height={90}
          />
        </div>

        {/* Multiple stamps */}
        <div className="border p-6 relative h-64">
          <p>Document with multiple stamps:</p>
          <Stamp text="APPROVED" className="absolute top-4 left-4" />
          <Stamp text="CONFIDENTIAL" rotate={-20} className="absolute bottom-4 right-4" />
        </div>
      </div>
    </div>
  )
}

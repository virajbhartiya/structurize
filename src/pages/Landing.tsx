import { useState, useEffect } from 'react'
import { convertToInterface } from '../utils/converter'

import Header from '../components/shared/Header'
import ConversionForm from '../components/conversion/ConversionForm'
import ConversionResult from '@/components/conversion/ConversionResult'
import { getRequest } from '@/utility/generalServices'
import { toast } from 'sonner'

export const Landing = () => {
  const [apiResponse, setApiResponse] = useState('')
  const [outputLanguage, setOutputLanguage] = useState(() => {
    return localStorage.getItem('outputLanguage') || 'typescript'
  })
  const [highlightStyle, setHighlightStyle] = useState(() => {
    return localStorage.getItem('highlightStyle') || 'vscDarkPlus'
  })
  const [result, setResult] = useState('')

  useEffect(() => {
    localStorage.setItem('outputLanguage', outputLanguage)
  }, [outputLanguage])

  useEffect(() => {
    localStorage.setItem('highlightStyle', highlightStyle)
  }, [highlightStyle])

  const handleConvert = async () => {
    if (!apiResponse) {
      toast.error('Please enter a valid JSON response')
      return
    }
    const converted = convertToInterface(apiResponse, outputLanguage)
    setResult(converted)

    try {
      await getRequest('/stats')
    } catch (error) {
      console.error('Failed to update total converts:', error)
    }
  }

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden">
      <Header />
      <div className="container mx-auto p-4 h-full">
        <div className="flex flex-col gap-4 md:flex-row md:h-[calc(100vh-5rem)]">
          <div className="w-full md:w-1/2 md:overflow-auto">
            <ConversionForm
              apiResponse={apiResponse}
              setApiResponse={setApiResponse}
              outputLanguage={outputLanguage}
              setOutputLanguage={setOutputLanguage}
              highlightStyle={highlightStyle}
              setHighlightStyle={setHighlightStyle}
              handleConvert={handleConvert}
            />
          </div>
          <div className="w-full md:w-1/2 md:overflow-auto">
            {result && (
              <ConversionResult
                result={result}
                outputLanguage={outputLanguage}
                highlightStyle={highlightStyle}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

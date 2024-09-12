import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import * as prismStyles from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useEffect, useRef } from 'react'

const sampleApiResponse = `{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "roles": ["user", "admin"],
    "address": {
      "city": "Anytown",
      "country": "USA"
    }
  }
}`

interface ConversionFormProps {
  apiResponse: string
  setApiResponse: (value: string) => void
  outputLanguage: string
  setOutputLanguage: (value: string) => void
  highlightStyle: string
  setHighlightStyle: (value: string) => void
  handleConvert: () => void
}

const ConversionForm = ({
  apiResponse,
  setApiResponse,
  outputLanguage,
  setOutputLanguage,
  highlightStyle,
  setHighlightStyle,
  handleConvert,
}: ConversionFormProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [apiResponse])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setApiResponse(e.target.value)
    try {
      JSON.parse(e.target.value)
      e.target.classList.remove('border-red-500')
    } catch (error) {
      e.target.classList.add('border-red-500')
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto border-[var(--accent)]">
      <CardHeader>
        <CardTitle className="text-xl font-thin">
          Convert JSON to Code
        </CardTitle>
        {/* <div className="text-center text-lg font-thin text-[var(--accent)]">
          <span className="text-gray-500">Total Converts:</span>{' '}
          <span key={totalConverts}>{totalConverts.toLocaleString()}</span>
        </div> */}
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          ref={textareaRef}
          value={apiResponse}
          onChange={handleInputChange}
          placeholder={sampleApiResponse}
          className="min-h-[300px] font-mono text-sm"
          spellCheck={false}
          wrap="off"
        />
        <div className="flex space-x-4">
          <Select
            value={outputLanguage}
            onValueChange={(value) => {
              setOutputLanguage(value)
              localStorage.setItem('outputLanguage', value)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select output language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="csharp">C#</SelectItem>
              <SelectItem value="dart">Dart</SelectItem>
              <SelectItem value="go">Go</SelectItem>
              <SelectItem value="python">Python</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={highlightStyle}
            onValueChange={(value) => {
              setHighlightStyle(value)
              localStorage.setItem('highlightStyle', value)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select highlight style" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(prismStyles).map((style) => (
                <SelectItem key={style} value={style}>
                  {style}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleConvert}>Structurize</Button>
      </CardFooter>
    </Card>
  )
}

export default ConversionForm

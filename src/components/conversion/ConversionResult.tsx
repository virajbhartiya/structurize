import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import * as prismStyles from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Button } from '../ui/button'
import { toast } from 'sonner'

const ConversionResult = ({
  result,
  outputLanguage,
  highlightStyle,
}: {
  result: string
  outputLanguage: string
  highlightStyle: string
}) => {
  return (
    <Card className="w-full h-full border-[var(--accent)] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-xl font-thin flex justify-between items-center">
          <p>Converted Result</p>
          {result && (
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(result)
                toast.success('Copied to clipboard')
              }}
            >
              Copy Result
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto min-h-0">
        <SyntaxHighlighter
          language={outputLanguage}
          style={prismStyles[highlightStyle as keyof typeof prismStyles]}
          customStyle={{
            margin: 0,
            borderRadius: '0.375rem',
            height: '100%',
          }}
        >
          {result}
        </SyntaxHighlighter>
      </CardContent>
    </Card>
  )
}

export default ConversionResult

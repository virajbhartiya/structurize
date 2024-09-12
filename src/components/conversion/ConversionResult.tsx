import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
    <Card className="w-full max-w-2xl mx-auto border-[var(--accent)]">
      <CardHeader>
        <CardTitle className="text-xl font-thin">Converted Result</CardTitle>
      </CardHeader>
      <CardContent>
        <SyntaxHighlighter
          language={outputLanguage}
          style={prismStyles[highlightStyle as keyof typeof prismStyles]}
          customStyle={{
            margin: 0,
            borderRadius: '0.375rem',
          }}
        >
          {result}
        </SyntaxHighlighter>
      </CardContent>
      <CardFooter>
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
      </CardFooter>
    </Card>
  )
}

export default ConversionResult

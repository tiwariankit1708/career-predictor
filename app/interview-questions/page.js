'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, MessageSquare, Loader2 } from 'lucide-react'

export default function InterviewQuestionsPage() {
  const [field, setField] = useState('')
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)

  const generateQuestions = async () => {
    if (!field.trim()) return

    setLoading(true)
    try {
      // TODO: Replace with actual API call to your Python backend
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field: field.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      } else {
        // Fallback with sample questions for demo
        const sampleQuestions = [
          `What are the key skills required for a ${field} role?`,
          `Describe a challenging project you've worked on in ${field}.`,
          `How do you stay updated with the latest trends in ${field}?`,
          `What tools and technologies are you proficient in for ${field}?`,
          `How do you handle tight deadlines in ${field} projects?`
        ]
        setQuestions(sampleQuestions)
      }
    } catch (error) {
      console.error('Error generating questions:', error)
      // Fallback with sample questions
      const sampleQuestions = [
        `What are the key skills required for a ${field} role?`,
        `Describe a challenging project you've worked on in ${field}.`,
        `How do you stay updated with the latest trends in ${field}?`,
        `What tools and technologies are you proficient in for ${field}?`,
        `How do you handle tight deadlines in ${field} projects?`
      ]
      setQuestions(sampleQuestions)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Interview Questions Generator
          </h1>
          <p className="text-muted-foreground">
            Enter your field of interest to generate relevant interview questions
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Generate Questions
            </CardTitle>
            <CardDescription>
              Specify your field or role to get tailored interview questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="field">Field of Interest</Label>
              <Input
                id="field"
                placeholder="e.g., Software Development, Data Science, Marketing..."
                value={field}
                onChange={(e) => setField(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && generateQuestions()}
              />
            </div>
            <Button 
              onClick={generateQuestions} 
              disabled={!field.trim() || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Interview Questions'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Questions Display */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Questions</CardTitle>
            <CardDescription>
              {questions.length > 0 
                ? `${questions.length} questions generated for ${field}`
                : 'Questions will appear here after generation'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div 
                    key={index} 
                    className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary"
                  >
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Question {index + 1}
                    </p>
                    <p className="text-foreground">{question}</p>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={() => setQuestions([])}
                  className="w-full mt-4"
                >
                  Clear Questions
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enter a field and click generate to see interview questions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
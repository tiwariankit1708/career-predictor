'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, BrainCircuit, Loader2, Send } from 'lucide-react'

export default function CareerModelPage() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])

  const askModel = async () => {
    if (!question.trim()) return

    setLoading(true)
    const currentQuestion = question.trim()
    setQuestion('')

    try {
      // TODO: Replace with actual API call to your Python backend
      const response = await fetch('/api/ask-career-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          question: currentQuestion,
          history: conversationHistory 
        }),
      })

      let modelAnswer = ''
      if (response.ok) {
        const data = await response.json()
        modelAnswer = data.answer || 'I apologize, but I could not generate an answer at this time.'
      } else {
        // Fallback response for demo
        modelAnswer = `Thank you for your question about "${currentQuestion}". While I'm not connected to the backend yet, I would provide comprehensive career guidance based on current industry trends, your background, and market demands. Please connect your Python backend to get personalized career advice.`
      }

      setAnswer(modelAnswer)
      setConversationHistory(prev => [...prev, 
        { type: 'question', content: currentQuestion },
        { type: 'answer', content: modelAnswer }
      ])

    } catch (error) {
      console.error('Error asking model:', error)
      const fallbackAnswer = `I apologize, but there was an error processing your question. Please ensure your Python backend is connected and try again.`
      setAnswer(fallbackAnswer)
      setConversationHistory(prev => [...prev, 
        { type: 'question', content: currentQuestion },
        { type: 'answer', content: fallbackAnswer }
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearConversation = () => {
    setConversationHistory([])
    setAnswer('')
    setQuestion('')
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
            Ask Model
          </h1>
          <p className="text-muted-foreground">
            Get personalized career advice from our AI model
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Question Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BrainCircuit className="w-5 h-5 mr-2" />
              Ask Your Question
            </CardTitle>
            <CardDescription>
              Ask any career-related question and get AI-powered advice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="question">Your Career Question</Label>
              <Textarea
                id="question"
                placeholder="e.g., What skills should I develop to transition into data science? How can I negotiate a better salary? What are the growth prospects in AI/ML?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    askModel()
                  }
                }}
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={askModel} 
                disabled={!question.trim() || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Ask Model
                  </>
                )}
              </Button>
              {conversationHistory.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={clearConversation}
                  disabled={loading}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Answer Display Section */}
        <Card>
          <CardHeader>
            <CardTitle>Model Response</CardTitle>
            <CardDescription>
              {conversationHistory.length > 0 
                ? `${Math.ceil(conversationHistory.length / 2)} questions asked`
                : 'AI-powered career advice will appear here'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {conversationHistory.length > 0 ? (
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {conversationHistory.map((item, index) => (
                  <div key={index}>
                    {item.type === 'question' ? (
                      <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
                        <p className="text-sm font-medium text-primary mb-1">Your Question</p>
                        <p className="text-foreground">{item.content}</p>
                      </div>
                    ) : (
                      <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-secondary">
                        <p className="text-sm font-medium text-secondary-foreground mb-1">AI Response</p>
                        <p className="text-foreground whitespace-pre-wrap">{item.content}</p>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-secondary">
                    <p className="text-sm font-medium text-secondary-foreground mb-1">AI Response</p>
                    <div className="flex items-center text-muted-foreground">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating response...
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Ask a career-related question to get started</p>
                <p className="text-sm mt-2">Examples: Career transitions, skill development, salary negotiation</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
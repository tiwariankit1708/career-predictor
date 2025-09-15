'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BrainCircuit, MessageSquare, Target } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Career Assistant
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          AI-powered career guidance and interview preparation to help you succeed in your professional journey
        </p>
      </header>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {/* Interview Questions Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Interview Questions</CardTitle>
            <CardDescription>
              Generate relevant interview questions based on your field of interest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/interview-questions">
              <Button className="w-full">Generate Questions</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Career Prediction Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <BrainCircuit className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Career Guidance</CardTitle>
            <CardDescription>
              Ask our AI model any career-related questions and get personalized advice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/career-model">
              <Button className="w-full">Ask Model</Button>
            </Link>
          </CardContent>
        </Card>

        {/* About Card */}
        <Card className="hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>About</CardTitle>
            <CardDescription>
              Learn more about how our AI tools can accelerate your career growth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Our platform combines advanced AI technology with career expertise to provide you with personalized guidance and interview preparation.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-center space-x-4">
        <Link href="/interview-questions">
          <Button variant="outline" size="lg">
            Interview Questions
          </Button>
        </Link>
        <Link href="/career-model">
          <Button variant="outline" size="lg">
            Career Model
          </Button>
        </Link>
      </div>
    </div>
  )
}
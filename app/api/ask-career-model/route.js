import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function POST(request) {
  try {
    const { question, history } = await request.json();

    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Call your orchestrator backend
    const backendResponse = await fetch(`${BACKEND_URL}/ask-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question.trim(),
        context: history ? `Previous conversation: ${history.slice(-4).map(h => `${h.type}: ${h.content}`).join(' | ')}` : null
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error('Backend error:', errorData);
      
      return NextResponse.json(
        { 
          answer: "I'm having trouble connecting to the career analysis service. Please try again in a moment.",
          error: true 
        },
        { status: 500 }
      );
    }

    const data = await backendResponse.json();
    
    return NextResponse.json({
      answer: data.polished_response || data.answer || 'Unable to generate response',
      prediction: data.prediction || null,
      confidence: data.prediction?.confidence || null,
      original_input: data.original_input || question
    });

  } catch (error) {
    console.error('API Route Error:', error);
    
    return NextResponse.json(
      { 
        answer: "There was an unexpected error processing your question. Please check your connection and try again.",
        error: true 
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
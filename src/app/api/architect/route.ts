import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { description, market } = await request.json();

    // In a real implementation, this would call the Gemini API with the system prompt
    // defined in implementation_plan.md.
    // For now, we return a mocked "generated" graph.

    const generatedGraph = {
      nodes: [
        { 
          id: 'gen-1', 
          type: 'strategy', 
          position: { x: 0, y: 0 }, 
          data: { label: 'Analyze Competitor Pricing', category: 'strategy', status: 'pending' } 
        },
        { 
          id: 'gen-2', 
          type: 'networking', 
          position: { x: 250, y: 0 }, 
          data: { label: 'Interview 10 Potential Customers', category: 'networking', status: 'pending' } 
        },
        { 
          id: 'gen-3', 
          type: 'human_loop', 
          position: { x: 125, y: 150 }, 
          data: { label: 'Finalize Product Specs', category: 'human_loop', status: 'pending' } 
        },
        { 
          id: 'gen-4', 
          type: 'automation', 
          position: { x: 125, y: 300 }, 
          data: { label: 'Setup Social Media Monitoring', category: 'automation', status: 'in-progress' } 
        },
        { 
          id: 'gen-5', 
          type: 'funding', 
          position: { x: 400, y: 150 }, 
          data: { label: 'Prepare Pitch Deck', category: 'funding', status: 'pending' } 
        }
      ],
      edges: [
        { id: 'e-gen-1-3', source: 'gen-1', target: 'gen-3', animated: true },
        { id: 'e-gen-2-3', source: 'gen-2', target: 'gen-3', animated: true },
        { id: 'e-gen-3-4', source: 'gen-3', target: 'gen-4' },
        { id: 'e-gen-3-5', source: 'gen-3', target: 'gen-5' }
      ]
    };

    // Simulate AI delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return NextResponse.json(generatedGraph);
  } catch (error) {
    console.error('Error in Architect Agent:', error);
    return NextResponse.json({ error: 'Failed to generate graph' }, { status: 500 });
  }
}

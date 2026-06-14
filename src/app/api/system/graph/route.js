import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'graphify-out', 'graph.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error reading graph.json:', error);
    return new Response(JSON.stringify({ error: 'Failed to load system graph' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

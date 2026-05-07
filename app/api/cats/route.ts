import { json } from "stream/consumers";

const cats = [
    {
        name: "George"
    },
    {
        name: "Paper"
    }
]

export async function GET(request: Request) {
    return new Response(JSON.stringify(cats), {
        status: 200,
        headers: { 'Content-Type': 'application/json'},
    })
}

export async function POST(request: Request) {
    const body = await request.json();
    const { name } = body;
    
    cats.push({ name });

    return new Response(JSON.stringify({ message: `Cat named ${name} added!` }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
    });

}
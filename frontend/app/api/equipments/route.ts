import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(request: Request) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM equipment ORDER BY created_at DESC');
    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/equipments error:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, category, image_url, total_stock } = body;

    if (!name) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    const initialStock = total_stock ? parseInt(total_stock) : 0;

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO equipment (name, description, category, image_url, total_stock, available_stock) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || null, category || null, image_url || null, initialStock, initialStock]
    );

    const insertedId = result.insertId;

    return NextResponse.json({ 
      message: 'Equipment created successfully', 
      data: { id: insertedId, name, description, category, image_url, total_stock: initialStock, available_stock: initialStock } 
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/equipments error:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

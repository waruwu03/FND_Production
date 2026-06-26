import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM equipment WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return NextResponse.json({ message: 'Equipment not found' }, { status: 404 });
    }
    
    return NextResponse.json({ data: rows[0] }, { status: 200 });
  } catch (error: any) {
    console.error(`GET /api/equipments/[id] error:`, error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, category, image_url, total_stock, available_stock } = body;

    // Check if equipment exists
    const [existing] = await pool.query<RowDataPacket[]>('SELECT * FROM equipment WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ message: 'Equipment not found' }, { status: 404 });
    }

    const currentEquipment = existing[0];
    
    // Use provided values or fallback to current values
    const updatedName = name !== undefined ? name : currentEquipment.name;
    const updatedDescription = description !== undefined ? description : currentEquipment.description;
    const updatedCategory = category !== undefined ? category : currentEquipment.category;
    const updatedImageUrl = image_url !== undefined ? image_url : currentEquipment.image_url;
    const updatedTotalStock = total_stock !== undefined ? parseInt(total_stock) : currentEquipment.total_stock;
    const updatedAvailableStock = available_stock !== undefined ? parseInt(available_stock) : currentEquipment.available_stock;

    await pool.query<ResultSetHeader>(
      'UPDATE equipment SET name = ?, description = ?, category = ?, image_url = ?, total_stock = ?, available_stock = ? WHERE id = ?',
      [updatedName, updatedDescription, updatedCategory, updatedImageUrl, updatedTotalStock, updatedAvailableStock, id]
    );

    return NextResponse.json({ 
      message: 'Equipment updated successfully',
      data: {
        id: parseInt(id),
        name: updatedName,
        description: updatedDescription,
        category: updatedCategory,
        image_url: updatedImageUrl,
        total_stock: updatedTotalStock,
        available_stock: updatedAvailableStock
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error(`PUT /api/equipments/[id] error:`, error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM equipment WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Equipment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Equipment deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`DELETE /api/equipments/[id] error:`, error);
    // Handle potential foreign key constraint errors
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return NextResponse.json({ message: 'Cannot delete equipment because it is referenced in events.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

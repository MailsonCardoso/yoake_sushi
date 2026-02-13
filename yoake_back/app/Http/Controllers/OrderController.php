<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\RestaurantTable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['items.product', 'customer', 'table']);

        if ($request->has('status')) {
            if ($request->status === 'active') {
                $query->whereIn('status', ['pending', 'preparing', 'ready']);
            } else {
                $query->where('status', $request->status);
            }
        }

        return $query->latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|uuid',
            'table_id' => 'nullable|uuid',
            'type' => 'required|string',
            'channel' => 'required|string',
            'payment_method' => 'nullable|string',
            'subtotal' => 'required|numeric',
            'delivery_fee' => 'nullable|numeric',
            'total' => 'required|numeric',
            'items' => 'required|array',
            'items.*.product_id' => 'required|uuid',
            'items.*.quantity' => 'required|integer',
            'items.*.unit_price' => 'required|numeric',
        ]);

        return DB::transaction(function () use ($validated) {
            $orderData = collect($validated)->except('items')->toArray();
            $orderData['status'] = 'pending';

            $order = Order::create($orderData);

            foreach ($validated['items'] as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                ]);
            }

            // Se for pedido de mesa, atualiza o status da mesa
            if ($order->type === 'mesa' && $order->table_id) {
                RestaurantTable::where('id', $order->table_id)->update([
                    'status' => 'occupied',
                    'current_order_id' => $order->id
                ]);
            }

            return $order->load('items');
        });
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|string']);

        $order = Order::findOrFail($id);
        $order->update(['status' => $request->status]);

        return $order;
    }

    public function show($id)
    {
        return Order::with(['items.product', 'customer', 'table'])->findOrFail($id);
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\RestaurantTable;
use Illuminate\Http\Request;

class RestaurantTableController extends Controller
{
    public function index()
    {
        return RestaurantTable::all();
    }

    public function open(Request $request, $id)
    {
        $table = RestaurantTable::findOrFail($id);
        $table->update(['status' => 'Ocupada']);
        return $table;
    }

    public function close(Request $request, $id)
    {
        $table = RestaurantTable::findOrFail($id);
        $table->update([
            'status' => 'Livre',
            'current_total' => 0,
            'current_order_id' => null
        ]);
        return $table;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'number' => 'required|string|unique:restaurant_tables,number',
            'seats' => 'required|integer|min:1',
        ]);

        $validated['status'] = 'Livre';
        $validated['current_total'] = 0;

        return RestaurantTable::create($validated);
    }
}

<?php

namespace App\Http\Controllers;

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
}

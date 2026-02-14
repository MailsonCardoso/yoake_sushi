<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'location_link' => 'nullable|string',
            'lat' => 'nullable|string',
            'lng' => 'nullable|string',
        ]);

        return Customer::create($validated);
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'location_link' => 'nullable|string',
            'lat' => 'nullable|string',
            'lng' => 'nullable|string',
        ]);

        $customer->update($validated);
        return $customer;
    }

    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);
        $customer->delete();
        return response()->json(['message' => 'Cliente excluído com sucesso']);
    }
}

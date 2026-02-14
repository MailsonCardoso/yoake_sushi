<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return User::all();
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        return response()->json($user);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if (User::count() <= 1) {
            return response()->json(['message' => 'Não é possível excluir o último usuário'], 403);
        }

        $user->delete();
        return response()->json(['message' => 'Usuário excluído com sucesso']);
    }
}

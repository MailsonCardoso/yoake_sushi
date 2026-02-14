<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Setting;

class SettingController extends Controller
{
    public function index()
    {
        return Setting::pluck('value', 'key');
    }

    public function update(Request $request)
    {
        $settings = $request->all();

        foreach ($settings as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return response()->json(['message' => 'Configurações atualizadas com sucesso']);
    }
}

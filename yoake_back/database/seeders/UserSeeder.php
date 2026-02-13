<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'administrador@yoakesushi.com.br'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('@Secur1t1@'),
            ]
        );
    }
}

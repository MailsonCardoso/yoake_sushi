<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\RestaurantTable;

class InitialDataSeeder extends Seeder
{
    public function run(): void
    {
        // Produtos
        $products = [
            ['name' => 'Burger Yoake Especial', 'price' => 38.90, 'category' => 'burgers', 'description' => 'Pão brioche, blend 180g, queijo cheddar, bacon caramelizado.'],
            ['name' => 'Ebi Tempura (8un)', 'price' => 45.00, 'category' => 'portions', 'description' => 'Camarões empanados na massa de tempurá crocante.'],
            ['name' => 'Coca-Cola 350ml', 'price' => 6.50, 'category' => 'drinks', 'description' => 'Lata gelada.'],
            ['name' => 'Sunomono Especial', 'price' => 22.00, 'category' => 'portions', 'description' => 'Salada de pepino com kani e gergelim.'],
        ];

        foreach ($products as $p) {
            Product::updateOrCreate(['name' => $p['name']], $p);
        }

        // Mesas
        for ($i = 1; $i <= 10; $i++) {
            RestaurantTable::updateOrCreate(
                ['number' => str_pad($i, 2, '0', STR_PAD_LEFT)],
                ['seats' => $i <= 4 ? 2 : 4, 'status' => 'Livre']
            );
        }
    }
}

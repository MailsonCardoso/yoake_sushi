<?php

namespace App\Http\Controllers;

use App\Models\CashRegister;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class CashRegisterController extends Controller
{
    public function status()
    {
        $current = CashRegister::where('status', 'open')->first();

        if (!$current) {
            $last = CashRegister::where('status', 'closed')->orderBy('closed_at', 'desc')->first();
            return response()->json([
                'status' => 'closed',
                'last_closing_balance' => $last ? $last->closing_balance : 0
            ]);
        }

        // Calculate current totals
        $totals = Order::where('cash_register_id', $current->id)
            ->where('status', 'Concluído')
            ->selectRaw('payment_account, sum(total) as total')
            ->groupBy('payment_account')
            ->get();

        return response()->json([
            'status' => 'open',
            'register' => $current,
            'current_totals' => $totals
        ]);
    }

    public function open(Request $request)
    {
        $request->validate([
            'opening_balance' => 'required|numeric'
        ]);

        if (CashRegister::where('status', 'open')->exists()) {
            return response()->json(['message' => 'Já existe um caixa aberto.'], 400);
        }

        $register = CashRegister::create([
            'opening_balance' => $request->opening_balance,
            'status' => 'open',
            'opened_at' => Carbon::now(),
            'user_id' => Auth::id() ?? 'system'
        ]);

        return response()->json($register);
    }

    public function close(Request $request)
    {
        $current = CashRegister::where('status', 'open')->first();

        if (!$current) {
            return response()->json(['message' => 'Nenhum caixa aberto encontrado.'], 404);
        }

        $orders = Order::where('cash_register_id', $current->id)
            ->where('status', 'Concluído')
            ->get();

        $totals = [
            'total_cash' => $orders->where('payment_account', 'DINHEIRO')->sum('total'),
            'total_nubank' => $orders->where('payment_account', 'NUBANK')->sum('total'),
            'total_picpay' => $orders->where('payment_account', 'PICPAY')->sum('total'),
            'total_pix' => $orders->where('payment_account', 'PIX')->sum('total'),
            'total_ifood' => $orders->where('payment_account', 'IFOOD')->sum('total'),
        ];

        $closingBalance = $current->opening_balance + array_sum($totals);

        $current->update(array_merge($totals, [
            'closing_balance' => $closingBalance,
            'status' => 'closed',
            'closed_at' => Carbon::now()
        ]));

        return response()->json($current);
    }

    public function history()
    {
        return response()->json(CashRegister::orderBy('created_at', 'desc')->get());
    }
}

<?php

namespace App\Console\Commands;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Console\Command;

class CreateBaristaEmployee extends Command
{
    protected $signature   = 'barista:create-employee';
    protected $description = 'Create the missing Employee record for the barista test user (barista@arbiter.com)';

    public function handle(): int
    {
        $barista = User::where('email', 'barista@arbiter.com')->first();

        if (! $barista) {
            $this->error('barista@arbiter.com not found in users table.');
            return Command::FAILURE;
        }

        $existing = Employee::where('user_id', $barista->id)->first();
        if ($existing) {
            $this->info("Employee record already exists: {$existing->employee_number}");
            return Command::SUCCESS;
        }

        $latest  = Employee::latest('id')->first();
        $nextNum = $latest ? ((int) substr($latest->employee_number, 3) + 1) : 1;
        $empNum  = 'EMP' . str_pad($nextNum, 5, '0', STR_PAD_LEFT);

        $emp = Employee::create([
            'user_id'         => $barista->id,
            'employee_number' => $empNum,
            'position'        => 'Barista',
            'department'      => 'Operations',
            'hire_date'       => now()->subYear()->toDateString(),
            'salary'          => 25000.00,
            'status'          => 'active',
        ]);

        $this->info("Created Employee {$emp->employee_number} for barista@arbiter.com (user_id={$barista->id}).");
        return Command::SUCCESS;
    }
}

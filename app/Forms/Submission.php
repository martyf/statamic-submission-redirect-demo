<?php

namespace App\Forms;

class Submission extends \Statamic\Forms\Submission
{

    public function buildRedirectUrl(): void
    {
        if ($this->get('redirect') === true) {
            $this->redirect = 'https://statamic.com';
        }
    }
}

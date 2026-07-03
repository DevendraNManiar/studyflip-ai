<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    protected $fillable = [
        'pdf_upload_id',
        'question',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'correct_answer',
        'difficulty'
    ];

    public function pdfUpload()
    {
        return $this->belongsTo(PdfUpload::class);
    }
}

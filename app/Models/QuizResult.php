<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizResult extends Model
{
    protected $fillable = [
        'user_id',
        'pdf_upload_id',
        'score',
        'total_questions',
        'correct_answers'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function pdfUpload()
    {
        return $this->belongsTo(PdfUpload::class);
    }
}

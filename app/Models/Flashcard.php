<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flashcard extends Model
{
    protected $fillable = [
        'pdf_upload_id',
        'question',
        'answer',
        'repetitions',
        'interval',
        'easiness_factor',
        'next_review_date',
    ];

    protected $casts = [
        'repetitions' => 'integer',
        'interval' => 'integer',
        'easiness_factor' => 'float',
        'next_review_date' => 'datetime',
    ];

    public function pdfUpload()
    {
        return $this->belongsTo(PdfUpload::class);
    }
}

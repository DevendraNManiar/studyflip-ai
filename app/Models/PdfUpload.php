<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PdfUpload extends Model
{
    protected $fillable = [
        'user_id',
        'category_id',
        'file_name',
        'file_path',
        'extracted_text',
        'summary',
        'status',
        'chat_history',
        'podcast_script',
        'concept_graph'
    ];

    protected $casts = [
        'chat_history' => 'array',
        'podcast_script' => 'array',
        'concept_graph' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function flashcards()
    {
        return $this->hasMany(Flashcard::class);
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class);
    }

    public function quizResults()
    {
        return $this->hasMany(QuizResult::class);
    }
}

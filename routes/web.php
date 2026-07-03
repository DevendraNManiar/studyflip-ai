<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\UploadController;
use App\Http\Controllers\StudyController;
use App\Http\Controllers\AiTutorController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [StudyController::class, 'dashboard'])->name('dashboard');
    Route::post('/uploads', [UploadController::class, 'store'])->name('uploads.store');
    Route::get('/uploads/{pdfUpload}/status', [UploadController::class, 'status'])->name('uploads.status');
    Route::get('/study/{pdfUpload}', [StudyController::class, 'show'])->name('study.show');
    Route::post('/study/{pdfUpload}/quiz', [StudyController::class, 'submitQuiz'])->name('study.quiz');
    Route::post('/study/{pdfUpload}/tutor', [AiTutorController::class, 'chat'])->name('study.tutor');
    Route::post('/study/{pdfUpload}/tutor/clear', [AiTutorController::class, 'clear'])->name('study.tutor.clear');
    Route::post('/study/{pdfUpload}/podcast', [StudyController::class, 'generatePodcast'])->name('study.podcast');
    Route::post('/study/{pdfUpload}/flashcards/{flashcard}/review', [StudyController::class, 'reviewFlashcard'])->name('study.review-flashcard');
    Route::get('/study/{pdfUpload}/concept-graph', [StudyController::class, 'getConceptGraph'])->name('study.concept-graph');
    Route::post('/study/{pdfUpload}/room/sync', [StudyController::class, 'syncRoom'])->name('study.room-sync');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\PdfUpload;
use App\Models\Category;
use App\Models\QuizResult;
use App\Models\Flashcard;
use App\Services\GeminiAiService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class StudyController extends Controller
{
    /**
     * Display the main dashboard with uploads list and categories
     */
    public function dashboard()
    {
        $userId = Auth::id();
        $uploads = PdfUpload::with('category')
            ->where('user_id', $userId)
            ->latest()
            ->get();

        $categories = Category::all();

        $quizResults = QuizResult::with('pdfUpload')
            ->where('user_id', $userId)
            ->latest()
            ->get();

        return Inertia::render('Dashboard', [
            'uploads' => $uploads,
            'categories' => $categories,
            'quizResults' => $quizResults,
        ]);
    }

    /**
     * Display a specific document study experience
     */
    public function show(PdfUpload $pdfUpload)
    {
        // Auth gate
        if ($pdfUpload->user_id !== Auth::id()) {
            abort(403);
        }

        // Only redirect to study view if completed
        if ($pdfUpload->status !== 'completed') {
            return redirect()->route('dashboard')->with('error', 'Document is still processing or has failed.');
        }

        $pdfUpload->load(['category', 'flashcards', 'quizzes', 'quizResults']);

        return Inertia::render('StudyView', [
            'upload' => $pdfUpload,
        ]);
    }

    /**
     * Submit quiz results
     */
    public function submitQuiz(Request $request, PdfUpload $pdfUpload)
    {
        if ($pdfUpload->user_id !== Auth::id()) {
            abort(403);
        }

        $request->validate([
            'correct_answers' => 'required|integer|min:0',
            'total_questions' => 'required|integer|min:1',
        ]);

        $correctAnswers = $request->correct_answers;
        $totalQuestions = $request->total_questions;
        $score = round(($correctAnswers / $totalQuestions) * 100);

        $result = QuizResult::create([
            'user_id' => Auth::id(),
            'pdf_upload_id' => $pdfUpload->id,
            'score' => $score,
            'total_questions' => $totalQuestions,
            'correct_answers' => $correctAnswers,
        ]);

        return response()->json([
            'message' => 'Quiz result saved successfully!',
            'result' => $result,
        ]);
    }

    public function generatePodcast(Request $request, PdfUpload $pdfUpload, \App\Services\GeminiAiService $aiService)
    {
        if ($pdfUpload->user_id !== Auth::id()) {
            abort(403);
        }

        $language = $request->input('language', 'English');

        $script = $aiService->generatePodcastScript($pdfUpload->extracted_text ?: '', $language);
        $pdfUpload->update(['podcast_script' => $script]);

        return response()->json([
            'podcast_script' => $pdfUpload->podcast_script,
        ]);
    }

    /**
     * Submit flashcard review (SM-2 Spaced Repetition)
     */
    public function reviewFlashcard(Request $request, PdfUpload $pdfUpload, Flashcard $flashcard)
    {
        if ($pdfUpload->user_id !== Auth::id()) {
            abort(403);
        }

        if ($flashcard->pdf_upload_id !== $pdfUpload->id) {
            abort(404, 'Flashcard not found for this document.');
        }

        $request->validate([
            'score' => 'required|integer|min:1|max:5',
        ]);

        $score = $request->score;
        $repetitions = $flashcard->repetitions ?? 0;
        $interval = $flashcard->interval ?? 0;
        $easinessFactor = $flashcard->easiness_factor ?? 2.5;

        if ($score < 3) {
            $repetitions = 0;
            $interval = 1;
        } else {
            if ($repetitions == 0) {
                $interval = 1;
            } elseif ($repetitions == 1) {
                $interval = 6;
            } else {
                $interval = (int) round($interval * $easinessFactor);
            }
            $easinessFactor = $easinessFactor + (0.1 - (5 - $score) * (0.08 + (5 - $score) * 0.02));
            $easinessFactor = max(1.3, $easinessFactor);
            $repetitions += 1;
        }

        $nextReviewDate = now()->addDays($interval);

        $flashcard->update([
            'repetitions' => $repetitions,
            'interval' => $interval,
            'easiness_factor' => $easinessFactor,
            'next_review_date' => $nextReviewDate,
        ]);

        return response()->json([
            'message' => 'Spaced repetition schedule updated!',
            'flashcard' => $flashcard,
        ]);
    }

    /**
     * Get or generate concept graph for PDF upload
     */
    public function getConceptGraph(PdfUpload $pdfUpload, GeminiAiService $aiService)
    {
        if ($pdfUpload->user_id !== Auth::id()) {
            abort(403);
        }

        if (empty($pdfUpload->concept_graph)) {
            $graph = $aiService->generateConceptGraph($pdfUpload->extracted_text ?: '');
            $pdfUpload->update(['concept_graph' => $graph]);
        }

        return response()->json($pdfUpload->concept_graph);
    }

    /**
     * Synchronize live collaborative study room state
     */
    public function syncRoom(Request $request, PdfUpload $pdfUpload)
    {
        if (!Auth::check()) {
            abort(401);
        }

        $user = Auth::user();
        $action = $request->input('action');
        $details = $request->input('details', '');

        $cacheKey = "study_room_" . $pdfUpload->id;
        $roomState = Cache::get($cacheKey, [
            'users' => [],
            'history' => []
        ]);

        // Update current user status
        $roomState['users'][$user->id] = [
            'name' => $user->name,
            'last_seen' => now()->timestamp,
            'action' => $action,
            'details' => $details
        ];

        // Clean up old users (inactive for > 15 seconds)
        $now = now()->timestamp;
        $roomState['users'] = array_filter($roomState['users'], function($u) use ($now) {
            return ($now - $u['last_seen']) < 15;
        });

        // Add history event if action is provided
        if ($action) {
            array_unshift($roomState['history'], [
                'name' => $user->name,
                'action' => $action,
                'details' => $details,
                'time' => now()->format('H:i:s')
            ]);
            // Limit history size to 20
            $roomState['history'] = array_slice($roomState['history'], 0, 20);
        }

        Cache::put($cacheKey, $roomState, now()->addHours(2));

        return response()->json($roomState);
    }
}

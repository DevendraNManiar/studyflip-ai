<?php

namespace App\Services;

use App\Models\PdfUpload;
use App\Models\Flashcard;
use App\Models\Quiz;
use Smalot\PdfParser\Parser as PdfParser;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class DocumentProcessorService
{
    protected GeminiAiService $aiService;

    public function __construct(GeminiAiService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Parse PDF and generate learning materials
     */
    public function process(PdfUpload $upload): void
    {
        try {
            $upload->update(['status' => 'processing']);

            // 1. Text extraction
            $absolutePath = storage_path('app/private/' . $upload->file_path);
            if (!file_exists($absolutePath)) {
                // Fallback to public storage if private doesn't contain it
                $absolutePath = storage_path('app/public/' . $upload->file_path);
            }

            Log::info("Extracting text from PDF at path: {$absolutePath}");

            $extractedText = null;
            try {
                if (file_exists($absolutePath)) {
                    $parser = new PdfParser();
                    $pdf = $parser->parseFile($absolutePath);
                    $extractedText = $pdf->getText();
                } else {
                    Log::error("PDF file not found at: {$absolutePath}");
                }
            } catch (\Exception $e) {
                Log::error("Smalot PDF parsing failed: " . $e->getMessage() . ". Using fallback text.");
            }

            // Fallback gracefully on empty text or failure
            if (empty(trim($extractedText))) {
                $extractedText = "This is a placeholder fallback text for the uploaded document: " . $upload->file_name . ". We encountered an error or the PDF was scanned/empty, so we have fell back to standard learning templates for you. Learn active recall and quiz testing using StudyFlip!";
            }

            $upload->update(['extracted_text' => $extractedText]);

            // 2. Summary
            Log::info("Generating study summary for PDF Upload ID: {$upload->id}");
            $summary = $this->aiService->generateSummary($extractedText);
            $upload->update(['summary' => $summary]);

            // 3. Flashcards
            Log::info("Generating active recall flashcards for PDF Upload ID: {$upload->id}");
            $flashcards = $this->aiService->generateFlashcards($extractedText);
            foreach ($flashcards as $card) {
                if (isset($card['question']) && isset($card['answer'])) {
                    Flashcard::create([
                        'pdf_upload_id' => $upload->id,
                        'question' => $card['question'],
                        'answer' => $card['answer']
                    ]);
                }
            }

            // 4. Quiz (max 10 questions)
            Log::info("Generating quizzes for PDF Upload ID: {$upload->id}");
            $quizzes = $this->aiService->generateQuiz($extractedText);
            $quizzesCount = 0;
            foreach ($quizzes as $quizItem) {
                if ($quizzesCount >= 10) break;
                if (isset($quizItem['question'], $quizItem['option_a'], $quizItem['option_b'], $quizItem['option_c'], $quizItem['option_d'], $quizItem['correct_answer'])) {
                    Quiz::create([
                        'pdf_upload_id' => $upload->id,
                        'question' => $quizItem['question'],
                        'option_a' => $quizItem['option_a'],
                        'option_b' => $quizItem['option_b'],
                        'option_c' => $quizItem['option_c'],
                        'option_d' => $quizItem['option_d'],
                        'correct_answer' => strtolower($quizItem['correct_answer']),
                        'difficulty' => $quizItem['difficulty'] ?? 'medium'
                    ]);
                    $quizzesCount++;
                }
            }

            // 5. Update Status
            $upload->update(['status' => 'completed']);
            Log::info("Successfully processed PDF Upload ID: {$upload->id}");

        } catch (\Exception $e) {
            Log::error("DocumentProcessorService failed for Upload ID {$upload->id}: " . $e->getMessage());
            $upload->update(['status' => 'failed']);
        }
    }
}

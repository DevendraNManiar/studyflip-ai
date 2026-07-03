<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GeminiAiService
{
    protected ?string $apiKey;
    protected string $model = 'gemini-2.5-flash';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key') ?: env('GEMINI_API_KEY');
    }

    /**
     * Call Gemini API or fallback to mock on failure/missing key
     */
    protected function callGemini(string $prompt, bool $jsonMode = false): ?string
    {
        if (empty($this->apiKey)) {
            Log::warning('Gemini API key is missing. Using mock fallback.');
            return null;
        }

        try {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";
            
            $payload = [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ]
            ];

            if ($jsonMode) {
                $payload['generationConfig'] = [
                    'responseMimeType' => 'application/json'
                ];
            }

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->timeout(30)->post($url, $payload);

            if ($response->successful()) {
                $data = $response->json();
                $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
                if ($text) {
                    return trim($text);
                }
            } else {
                Log::error('Gemini API request failed: ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('Gemini API Exception: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Generate Summary
     */
    public function generateSummary(string $text): string
    {
        $prompt = "Generate a professional, structured study summary in Markdown format from the following text. Do not include any introductory or concluding text outside the Markdown content. Keep it formatted nicely with sections like # Overview, ## Key Terms, ## Summary, and ## Study Tips:\n\n" . Str::limit($text, 8000);
        
        $result = $this->callGemini($prompt);
        
        if ($result) {
            return $result;
        }

        return $this->generateMockSummary($text);
    }

    /**
     * Generate Flashcards
     */
    public function generateFlashcards(string $text): array
    {
        $prompt = "Generate active-recall flashcards based on the following text. You MUST return a clean JSON array of objects, where each object has exactly two keys: 'question' and 'answer'. Do not wrap the JSON in markdown code blocks, do not add introductory prose, return ONLY the raw JSON. Here is the text:\n\n" . Str::limit($text, 8000);
        
        $result = $this->callGemini($prompt, true);
        
        if ($result) {
            $parsed = json_decode($result, true);
            if (is_array($parsed)) {
                return $parsed;
            }
        }

        return $this->generateMockFlashcards($text);
    }

    /**
     * Generate Quiz (max 10 items)
     */
    public function generateQuiz(string $text): array
    {
        $prompt = "Generate up to 10 multiple-choice questions based on the following text. You MUST return a clean JSON array of objects. Each object must have exactly these keys: 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer' (must be one of 'a', 'b', 'c', or 'd'), and 'difficulty' (one of 'easy', 'medium', or 'hard'). Return ONLY the raw JSON, do not include markdown formatting or prose. Here is the text:\n\n" . Str::limit($text, 8000);

        $result = $this->callGemini($prompt, true);
        
        if ($result) {
            $parsed = json_decode($result, true);
            if (is_array($parsed)) {
                return $parsed;
            }
        }

        return $this->generateMockQuiz($text);
    }

    /**
     * Tutor Response
     */
    public function generateTutorResponse(string $docText, array $history, string $userMessage): string
    {
        // Build simple conversational prompt
        $historyText = "";
        foreach (array_slice($history, -6) as $chat) {
            $role = $chat['role'] === 'user' ? 'User' : 'Tutor';
            $historyText .= "{$role}: {$chat['content']}\n";
        }

        $prompt = "You are StudyFlip AI Tutor, a helpful and engaging study assistant. Answer the user's question about the following document context. Keep your response brief, clear, and focused on helping them learn. Be structured and friendly.\n\nDOCUMENT CONTEXT:\n" 
            . Str::limit($docText, 6000) 
            . "\n\nCHAT HISTORY:\n" . $historyText 
            . "\nUser: {$userMessage}\nAI Tutor:";

        $result = $this->callGemini($prompt);
        if ($result) {
            return $result;
        }

        return $this->generateMockTutorResponse($docText, $userMessage);
    }

    /**
     * Generate Podcast Script
     */
    public function generatePodcastScript(string $text, string $language = 'English'): array
    {
        $prompt = "You are a podcast script generator. Create an engaging, educational, two-person conversational podcast/script summary of the following lecture content, in the target language: {$language}. The speakers are 'Speaker A' and 'Speaker B'. They should discuss the main concepts in a lively, easy-to-understand conversation.
Return a valid JSON array of objects, where each object has exactly two keys: 'speaker' (which MUST be either 'Speaker A' or 'Speaker B') and 'text' (the dialogue line).
Do not wrap the JSON in markdown code blocks, do not add introductory prose, return ONLY the raw JSON.
Here is the text:\n\n" . Str::limit($text, 8000);

        $result = $this->callGemini($prompt, true);
        
        if ($result) {
            $parsed = json_decode($result, true);
            if (is_array($parsed)) {
                return $parsed;
            }
        }

        return $this->generateMockPodcastScript($text, $language);
    }

    /**
     * Generate Concept Graph
     */
    public function generateConceptGraph(string $text): array
    {
        $prompt = "Analyze the following document text and output a JSON representation of the concepts and their relationships.
You MUST return a valid JSON object with exactly two keys:
- 'nodes': an array of objects, each containing:
  - 'id': a unique string identifier (camelCase, e.g., 'conceptA')
  - 'label': a short user-friendly name of the concept
  - 'summary': a 1-2 sentence summary of this concept
- 'edges': an array of objects representing relationships, each containing:
  - 'source': the 'id' of the source node
  - 'target': the 'id' of the target node
  - 'label': a short description of the relationship (e.g., 'relates to', 'defines', 'causes', 'part of')

Do not wrap the JSON in markdown code blocks, do not add introductory prose, return ONLY the raw JSON.
Here is the text:\n\n" . Str::limit($text, 8000);

        $result = $this->callGemini($prompt, true);
        
        if ($result) {
            $parsed = json_decode($result, true);
            if (is_array($parsed) && isset($parsed['nodes'])) {
                return $parsed;
            }
        }

        return $this->generateMockConceptGraph($text);
    }

    protected function generateMockConceptGraph(string $text): array
    {
        $keywords = $this->extractKeywords($text);
        $sentences = $this->extractSentences($text);
        
        $nodes = [];
        $edges = [];
        
        $limit = min(6, count($keywords));
        for ($i = 0; $i < $limit; $i++) {
            $word = $keywords[$i];
            $id = 'concept' . Str::studly($word);
            $label = ucfirst($word);
            
            // Find a sentence for summary
            $summary = "An important concept related to {$word} found in the study material.";
            foreach ($sentences as $sentence) {
                if (Str::contains(strtolower($sentence), strtolower($word)) && strlen($sentence) > 30 && strlen($sentence) < 150) {
                    $summary = trim(str_replace("\n", " ", $sentence));
                    break;
                }
            }
            
            $nodes[] = [
                'id' => $id,
                'label' => $label,
                'summary' => $summary
            ];
        }
        
        // Connect nodes to form a simple graph
        for ($i = 0; $i < count($nodes) - 1; $i++) {
            $edges[] = [
                'source' => $nodes[$i]['id'],
                'target' => $nodes[$i+1]['id'],
                'label' => 'connects to'
            ];
        }
        
        if (count($nodes) > 2) {
            $edges[] = [
                'source' => $nodes[count($nodes) - 1]['id'],
                'target' => $nodes[0]['id'],
                'label' => 'influences'
            ];
        }
        
        return [
            'nodes' => $nodes,
            'edges' => $edges
        ];
    }

    protected function translateMockText(string $text, string $language): string
    {
        $lang = strtolower($language);
        $translations = [
            'spanish' => [
                "Welcome to today's study podcast! Today we are discussing some key concepts from the lecture." => "¡Bienvenidos al podcast de estudio de hoy! Hoy discutiremos algunos conceptos clave de la clase.",
                "That's right! Looking at the material, some of the most important terms include: " => "¡Así es! Mirando el material, algunos de los términos más importantes incluyen: ",
                "Here is an interesting point: " => "Aquí hay un punto interesante: ",
                "Exactly! It's crucial to understand these concepts deeply for our active recall." => "¡Exactamente! Es crucial comprender estos conceptos en profundidad para nuestro recuerdo activo.",
                "Agreed. Let's make sure to test ourselves with the flashcards and quiz. Thanks for listening!" => "De acuerdo. Asegurémonos de ponernos a prueba con las tarjetas y el cuestionario. ¡Gracias por escuchar!",
            ],
            'german' => [
                "Welcome to today's study podcast! Today we are discussing some key concepts from the lecture." => "Willkommen beim heutigen Studien-Podcast! Heute besprechen wir einige Schlüsselkonzepte aus der Vorlesung.",
                "That's right! Looking at the material, some of the most important terms include: " => "Das ist richtig! Wenn wir uns das Material ansehen, gehören zu den wichtigsten Begriffen: ",
                "Here is an interesting point: " => "Hier ist ein interessanter Punkt: ",
                "Exactly! It's crucial to understand these concepts deeply for our active recall." => "Genau! Es ist wichtig, diese Konzepte für unser aktives Erinnern tief zu verstehen.",
                "Agreed. Let's make sure to test ourselves with the flashcards and quiz. Thanks for listening!" => "Einverstanden. Stellen wir sicher, dass wir uns mit den Karteikarten und dem Quiz selbst testen. Vielen Dank fürs Zuhören!",
            ],
            'french' => [
                "Welcome to today's study podcast! Today we are discussing some key concepts from the lecture." => "Bienvenue dans le podcast d'étude d'aujourd'hui ! Aujourd'hui, nous discutons de certains concepts clés du cours.",
                "That's right! Looking at the material, some of the most important terms include: " => "C'est exact ! En regardant le matériel, certains des termes les plus importants incluent : ",
                "Here is an interesting point: " => "Voici un point intéressant : ",
                "Exactly! It's crucial to understand these concepts deeply for our active recall." => "Exactement ! Il est crucial de comprendre ces concepts en profondeur pour notre rappel actif.",
                "Agreed. Let's make sure to test ourselves with the flashcards and quiz. Thanks for listening!" => "D'accord. Assurons-nous de nous tester avec les flashcards et le quiz. Merci d'avoir écouté !",
            ],
            'hindi' => [
                "Welcome to today's study podcast! Today we are discussing some key concepts from the lecture." => "आज के अध्ययन पॉडकास्ट में आपका स्वागत है! आज हम व्याख्यान के कुछ प्रमुख अवधारणाओं पर चर्चा कर रहे हैं।",
                "That's right! Looking at the material, some of the most important terms include: " => "सही बात है! सामग्री को देखते हुए, कुछ सबसे महत्वपूर्ण शब्दों में शामिल हैं: ",
                "Here is an interesting point: " => "यहाँ एक दिलचस्प बिंदु है: ",
                "Exactly! It's crucial to understand these concepts deeply for our active recall." => "बिल्कुल! हमारे सक्रिय स्मरण के लिए इन अवधारणाओं को गहराई से समझना महत्वपूर्ण है।",
                "Agreed. Let's make sure to test ourselves with the flashcards and quiz. Thanks for listening!" => "सहमति। आइए सुनिश्चित करें कि हम फ्लैशकार्ड और क्विज़ के साथ खुद का परीक्षण करें। सुनने के लिए धन्यवाद।",
            ],
            'chinese' => [
                "Welcome to today's study podcast! Today we are discussing some key concepts from the lecture." => "欢迎收听今天的学习播客！今天我们将讨论讲座中的一些核心概念。",
                "That's right! Looking at the material, some of the most important terms include: " => "没错！从材料来看，一些最重要的术语包括：",
                "Here is an interesting point: " => "这里有一个有趣的观点：",
                "Exactly! It's crucial to understand these concepts deeply for our active recall." => "完全正确！深入理解这些概念对于我们的主动回忆至关重要。",
                "Agreed. Let's make sure to test ourselves with the flashcards and quiz. Thanks for listening!" => "同意。让我们确保用闪卡和测验来测试自己。感谢您的收听！",
            ],
            'japanese' => [
                "Welcome to today's study podcast! Today we are discussing some key concepts from the lecture." => "今日の学習ポッドキャストへようこそ！今日は講義のいくつかの重要な概念について話し合います。",
                "That's right! Looking at the material, some of the most important terms include: " => "その通りです！資料を見ると、最も重要な用語には以下が含まれます：",
                "Here is an interesting point: " => "ここに興味深い点があります：",
                "Exactly! It's crucial to understand these concepts deeply for our active recall." => "まさにその通り！アクティブリコール（活動想起）のために、これらの概念を深く理解することが極めて重要です。",
                "Agreed. Let's make sure to test ourselves with the flashcards and quiz. Thanks for listening!" => "同感です。フラッシュカードとクイズで自己テストしてみましょう。ご清聴ありがとうございました！",
            ]
        ];

        foreach ($translations as $langName => $phrases) {
            if (str_contains($lang, $langName)) {
                if (isset($phrases[$text])) {
                    return $phrases[$text];
                }
            }
        }

        return $text;
    }

    protected function generateMockPodcastScript(string $text, string $language = 'English'): array
    {
        $sentences = $this->extractSentences($text);
        $keywords = $this->extractKeywords($text);
        
        $script = [];
        $script[] = [
            'speaker' => 'Speaker A',
            'text' => $this->translateMockText("Welcome to today's study podcast! Today we are discussing some key concepts from the lecture.", $language)
        ];
        
        $wordCount = count($keywords);
        $sentenceCount = count($sentences);
        
        if ($wordCount > 0) {
            $words = array_slice($keywords, 0, min(5, $wordCount));
            $script[] = [
                'speaker' => 'Speaker B',
                'text' => $this->translateMockText("That's right! Looking at the material, some of the most important terms include: ", $language) . implode(', ', $words) . "."
            ];
        }

        if ($sentenceCount > 0) {
            $limit = min(4, $sentenceCount);
            for ($i = 0; $i < $limit; $i++) {
                $speaker = $i % 2 === 0 ? 'Speaker A' : 'Speaker B';
                $script[] = [
                    'speaker' => $speaker,
                    'text' => $this->translateMockText("Here is an interesting point: ", $language) . trim($sentences[$i])
                ];
            }
        }
        
        $script[] = [
            'speaker' => 'Speaker A',
            'text' => $this->translateMockText("Exactly! It's crucial to understand these concepts deeply for our active recall.", $language)
        ];
        $script[] = [
            'speaker' => 'Speaker B',
            'text' => $this->translateMockText("Agreed. Let's make sure to test ourselves with the flashcards and quiz. Thanks for listening!", $language)
        ];
        
        return $script;
    }

    /* MOCK FALLBACK GENERATORS */

    protected function generateMockSummary(string $text): string
    {
        $sentences = $this->extractSentences($text);
        $keywords = $this->extractKeywords($text);
        
        $overview = count($sentences) > 0 ? implode(' ', array_slice($sentences, 0, min(3, count($sentences)))) : "No overview available.";
        $keyPoints = count($sentences) > 3 ? array_slice($sentences, 3, min(5, count($sentences) - 3)) : ["Study documents to learn core topics."];

        $markdown = "# Study Summary (Demo Mode)\n\n";
        $markdown .= "> **Note:** This summary was generated in local demo mode because the Google Gemini API key was not configured.\n\n";
        $markdown .= "## Overview\n{$overview}\n\n";
        $markdown .= "## Key Concepts\n";
        foreach ($keyPoints as $point) {
            $markdown .= "- " . trim($point) . "\n";
        }
        $markdown .= "\n## Keywords\n";
        $markdown .= implode(', ', array_slice($keywords, 0, 10)) . "\n\n";
        $markdown .= "## Study Tips\n";
        $markdown .= "1. Focus on terms like " . implode(', ', array_slice($keywords, 0, 3)) . ".\n";
        $markdown .= "2. Test your knowledge by reviewing the flashcards and taking the interactive quiz.\n";

        return $markdown;
    }

    protected function generateMockFlashcards(string $text): array
    {
        $sentences = $this->extractSentences($text);
        $keywords = $this->extractKeywords($text);
        $flashcards = [];

        // Try to generate flashcards from sentences containing keywords
        $count = 0;
        foreach ($keywords as $word) {
            if ($count >= 6) break;
            foreach ($sentences as $sentence) {
                if (Str::contains(strtolower($sentence), strtolower($word)) && strlen($sentence) > 30 && strlen($sentence) < 150) {
                    // Try to turn it into a question
                    $cleanSentence = trim(str_replace("\n", " ", $sentence));
                    $flashcards[] = [
                        'question' => "Explain the context or definition of: **" . ucfirst($word) . "**",
                        'answer' => $cleanSentence
                    ];
                    $count++;
                    break;
                }
            }
        }

        if (empty($flashcards)) {
            $flashcards[] = ['question' => "What is the primary topic of this document?", 'answer' => "The document focuses on " . (implode(', ', array_slice($keywords, 0, 3)) ?: 'general learning resources') . "."];
            $flashcards[] = ['question' => "What is the key takeaway?", 'answer' => "Review the parsed material and practice active recall for best results."];
        }

        return $flashcards;
    }

    protected function generateMockQuiz(string $text): array
    {
        $keywords = $this->extractKeywords($text);
        $sentences = $this->extractSentences($text);
        
        $quiz = [];
        $count = 0;
        
        foreach ($keywords as $i => $word) {
            if ($count >= 5) break;
            // Find a sentence containing the word
            foreach ($sentences as $sentence) {
                if (Str::contains(strtolower($sentence), strtolower($word)) && strlen($sentence) > 40 && strlen($sentence) < 150) {
                    // Blank out the keyword
                    $replaced = preg_replace('/\b' . preg_quote($word, '/') . '\b/i', '_________', $sentence);
                    if ($replaced !== $sentence) {
                        $quiz[] = [
                            'question' => "Fill in the blank: " . trim($replaced),
                            'option_a' => ucfirst($word),
                            'option_b' => ucfirst($keywords[($i + 1) % count($keywords)] ?? 'Alternative'),
                            'option_c' => ucfirst($keywords[($i + 2) % count($keywords)] ?? 'Concept'),
                            'option_d' => ucfirst($keywords[($i + 3) % count($keywords)] ?? 'Structure'),
                            'correct_answer' => 'a',
                            'difficulty' => $count % 2 === 0 ? 'easy' : 'medium'
                        ];
                        $count++;
                        break;
                    }
                }
            }
        }

        if (empty($quiz)) {
            $quiz[] = [
                'question' => "Which of the following is most related to the subject matter?",
                'option_a' => ucfirst($keywords[0] ?? 'Core Subject'),
                'option_b' => 'Random Object',
                'option_c' => 'Irrelevant Data',
                'option_d' => 'None of the above',
                'correct_answer' => 'a',
                'difficulty' => 'easy'
            ];
        }

        return $quiz;
    }

    protected function generateMockTutorResponse(string $docText, string $userMessage): string
    {
        $sentences = $this->extractSentences($docText);
        $userWords = array_filter(explode(' ', preg_replace('/[^a-zA-Z0-9 ]/', '', strtolower($userMessage))));
        
        $matches = [];
        foreach ($sentences as $sentence) {
            $matchCount = 0;
            foreach ($userWords as $word) {
                if (strlen($word) > 3 && Str::contains(strtolower($sentence), $word)) {
                    $matchCount++;
                }
            }
            if ($matchCount > 0) {
                $matches[] = ['sentence' => trim($sentence), 'count' => $matchCount];
            }
        }

        // Sort matches by count descending
        usort($matches, fn($a, $b) => $b['count'] <=> $a['count']);

        $response = "**StudyFlip AI Tutor (Demo Mode):**\n\n";
        if (!empty($matches)) {
            $response .= "Based on the document context, here is what I found:\n\n";
            $limit = min(3, count($matches));
            for ($i = 0; $i < $limit; $i++) {
                $response .= "> " . $matches[$i]['sentence'] . "\n\n";
            }
            $response .= "I hope this helps! Feel free to ask more details.";
        } else {
            $response .= "I couldn't find a direct keyword match for your question in the text. However, from the overall document, here is a relevant excerpt:\n\n";
            $response .= "> " . ($sentences[0] ?? "No text details available.") . "\n\n";
            $response .= "Please ask specific questions using words that appear in the document.";
        }

        return $response;
    }

    /* HELPERS */

    protected function extractSentences(string $text): array
    {
        // Simple sentence parsing
        $cleaned = preg_replace('/[\s\r\n\t]+/', ' ', $text);
        $sentences = preg_split('/(?<=[.?!])\s+(?=[A-Z])/ ', $cleaned);
        return array_values(array_filter(array_map('trim', $sentences), fn($s) => strlen($s) > 10));
    }

    protected function extractKeywords(string $text): array
    {
        // Extract high-frequency words
        $words = str_word_count(strtolower($text), 1);
        
        // Filter out stop words
        $stopWords = ['the', 'and', 'a', 'to', 'of', 'in', 'is', 'that', 'it', 'on', 'for', 'this', 'with', 'as', 'are', 'by', 'an', 'be', 'or', 'at', 'from', 'your', 'about'];
        $filtered = array_filter($words, fn($w) => strlen($w) > 4 && !in_array($w, $stopWords));
        
        $freq = array_count_values($filtered);
        arsort($freq);
        
        return array_keys(array_slice($freq, 0, 15));
    }
}

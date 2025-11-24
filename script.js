document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.getElementById('file-name-display');
    const jdInput = document.getElementById('jd-input');
    const processBtn = document.getElementById('process-btn');
    const btnText = processBtn.querySelector('.btn-text');
    const btnLoader = processBtn.querySelector('.btn-loader');
    const emptyState = document.getElementById('empty-state');
    const outputContainer = document.getElementById('output-container');
    const resumePreview = document.getElementById('resume-preview');
    const keywordsList = document.getElementById('keywords-list');
    const downloadBtn = document.getElementById('download-btn');

    // API Configuration Elements
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const apiStatus = document.getElementById('api-status');

    // New AI-powered elements
    const atsScoreCard = document.getElementById('ats-score-card');
    const atsScoreValue = document.getElementById('ats-score-value');
    const atsAnalysis = document.getElementById('ats-analysis');
    const interviewQuestionsCard = document.getElementById('interview-questions-card');
    const interviewQuestionsList = document.getElementById('interview-questions-list');
    const suggestionsCard = document.getElementById('suggestions-card');
    const suggestionsList = document.getElementById('suggestions-list');

    let currentFile = null;
    let apiKey = localStorage.getItem('gemini_api_key') || '';

    // Initialize API key if exists
    if (apiKey) {
        apiKeyInput.value = apiKey;
        apiStatus.textContent = '✓ API Key Saved';
        apiStatus.className = 'api-status success';
    }

    // --- Event Listeners ---
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    jdInput.addEventListener('input', updateState);

    processBtn.addEventListener('click', processResume);
    downloadBtn.addEventListener('click', downloadPDF);

    saveApiKeyBtn.addEventListener('click', saveApiKey);

    // --- API Key Management ---
    function saveApiKey() {
        const key = apiKeyInput.value.trim();
        if (!key) {
            apiStatus.textContent = '✗ Please enter an API key';
            apiStatus.className = 'api-status error';
            return;
        }

        if (!key.startsWith('AIza')) {
            apiStatus.textContent = '✗ Invalid API key format';
            apiStatus.className = 'api-status error';
            return;
        }

        localStorage.setItem('gemini_api_key', key);
        apiKey = key;
        apiStatus.textContent = '✓ API Key Saved Successfully';
        apiStatus.className = 'api-status success';
    }

    // --- Core Logic ---
    function handleFile(file) {
        if (!file) return;
        currentFile = file;
        fileNameDisplay.textContent = file.name;
        fileNameDisplay.classList.add('highlight');
        updateState();
    }

    function updateState() {
        // Enable button if we have JD text (file is optional for testing)
        processBtn.disabled = !(jdInput.value.trim().length > 0);
    }

    async function processResume() {
        if (!apiKey) {
            alert('❌ Please configure your Gemini API key first!\n\nClick "Save Key" after entering your API key.');
            return;
        }

        if (!jdInput.value.trim()) {
            alert('❌ Please enter a job description!');
            return;
        }

        setLoading(true);
        try {
            const jdText = jdInput.value;

            // Parse resume text (use sample if no file uploaded)
            let resumeText = '';
            if (currentFile) {
                resumeText = await parseTextOrPdf(currentFile);
            } else {
                // Use sample resume for testing
                resumeText = `John Doe
Software Engineer
john.doe@email.com | (555) 123-4567

EXPERIENCE
Senior Software Engineer | Tech Company | 2020-Present
- Developed web applications using React and Node.js
- Led team of 5 engineers on major projects
- Improved system performance by 40%

Software Engineer | Startup Inc | 2018-2020
- Built RESTful APIs and microservices
- Implemented CI/CD pipelines
- Collaborated with cross-functional teams

EDUCATION
Bachelor of Science in Computer Science | University | 2018

SKILLS
JavaScript, Python, React, Node.js, AWS, Docker`;
                console.log('No file uploaded, using sample resume for testing');
            }

            // Call Gemini AI for all analyses in parallel
            const [atsResult, interviewQuestions, suggestions, optimizedResume] = await Promise.all([
                analyzeATSScore(resumeText, jdText),
                generateInterviewQuestions(jdText),
                generateResumeSuggestions(resumeText, jdText),
                optimizeResumeWithAI(resumeText, jdText)
            ]);

            // Display ATS Score
            displayATSScore(atsResult);

            // Display Interview Questions
            displayInterviewQuestions(interviewQuestions);

            // Display Resume Suggestions
            displaySuggestions(suggestions);

            // Display Optimized Resume
            displayOptimizedResume(optimizedResume);

            // Show all sections
            outputContainer.classList.remove('hidden');
            downloadBtn.classList.remove('hidden');
            emptyState.classList.add('hidden');

            setLoading(false);
        } catch (err) {
            console.error(err);
            alert("Error processing resume: " + err.message);
            setLoading(false);
        }
    }

    // --- Gemini AI Integration ---
    async function callGeminiAPI(prompt) {
        console.log('🔵 Calling Gemini API...');
        console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            console.log('📡 Response status:', response.status, response.statusText);

            if (!response.ok) {
                const error = await response.json();
                console.error('❌ API Error:', error);
                throw new Error(error.error?.message || `API request failed with status ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ API Response received');
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('❌ Fetch Error:', error);
            throw error;
        }
    }

    async function analyzeATSScore(resumeText, jdText) {
        const prompt = `You are an ATS (Applicant Tracking System) expert. Analyze the following resume against the job description and provide:
1. An ATS match score (0-100)
2. A brief analysis explaining the score (2-3 sentences)
3. Top 5 keywords from the job description

Resume:
${resumeText}

Job Description:
${jdText}

Respond in JSON format:
{
  "score": <number>,
  "analysis": "<string>",
  "keywords": ["keyword1", "keyword2", ...]
}`;

        const response = await callGeminiAPI(prompt);
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 0, analysis: "Unable to analyze", keywords: [] };
    }

    async function generateInterviewQuestions(jdText) {
        const prompt = `Based on the following job description, generate 5 relevant interview questions that a candidate should prepare for. Make them specific to the role requirements.

Job Description:
${jdText}

Respond in JSON format:
{
  "questions": ["question1", "question2", ...]
}`;

        const response = await callGeminiAPI(prompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { questions: [] };
        return data.questions;
    }

    async function generateResumeSuggestions(resumeText, jdText) {
        const prompt = `Based on the resume and job description below, suggest 5 powerful bullet points that the candidate should add or modify in their resume to better match the job requirements. Make them specific, quantifiable, and action-oriented.

Resume:
${resumeText}

Job Description:
${jdText}

Respond in JSON format:
{
  "suggestions": ["bullet1", "bullet2", ...]
}`;

        const response = await callGeminiAPI(prompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { suggestions: [] };
        return data.suggestions;
    }

    async function optimizeResumeWithAI(resumeText, jdText) {
        const prompt = `You are a professional resume writer. Optimize the following resume to better match the job description. Focus on:
1. Rewriting bullet points to include relevant keywords
2. Emphasizing relevant experience
3. Using strong action verbs
4. Maintaining the original structure and format

Resume:
${resumeText}

Job Description:
${jdText}

Return the optimized resume in HTML format with proper structure (use h1 for name, h2 for sections, ul/li for bullet points, etc.). Make it look professional.`;

        return await callGeminiAPI(prompt);
    }

    // --- Display Functions ---
    function displayATSScore(atsResult) {
        atsScoreCard.style.display = 'block';

        // Animate score
        let currentScore = 0;
        const targetScore = atsResult.score;
        const increment = targetScore / 50;

        const scoreInterval = setInterval(() => {
            currentScore += increment;
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                clearInterval(scoreInterval);
            }
            atsScoreValue.textContent = Math.round(currentScore);
        }, 20);

        atsAnalysis.innerHTML = `<p>${atsResult.analysis}</p>`;

        // Display keywords
        keywordsList.innerHTML = atsResult.keywords.slice(0, 5).map(k =>
            `<span class="skill-tag">${k}</span>`
        ).join('');
    }

    function displayInterviewQuestions(questions) {
        if (questions.length === 0) return;

        interviewQuestionsCard.style.display = 'block';
        interviewQuestionsList.innerHTML = questions.map((q, i) => `
            <div class="question-item">
                <div class="question-number">Question ${i + 1}</div>
                <div class="question-text">${q}</div>
            </div>
        `).join('');
    }

    function displaySuggestions(suggestions) {
        if (suggestions.length === 0) return;

        suggestionsCard.style.display = 'block';
        suggestionsList.innerHTML = suggestions.map(s => `
            <div class="suggestion-item">
                <div class="suggestion-text">${s}</div>
            </div>
        `).join('');
    }

    function displayOptimizedResume(htmlContent) {
        // Clean up the HTML if it's wrapped in markdown code blocks
        let cleanHtml = htmlContent
            .replace(/```html\n?/gi, '')
            .replace(/```\n?/g, '')
            .replace(/^\s*html\s*\n/gi, '')
            .trim();

        // If the AI returned plain text instead of HTML, wrap it in basic HTML structure
        if (!cleanHtml.includes('<') || !cleanHtml.includes('>')) {
            cleanHtml = `<div class="resume-container"><pre style="white-space: pre-wrap; font-family: inherit;">${cleanHtml}</pre></div>`;
        }

        resumePreview.innerHTML = cleanHtml;
    }

    // --- PDF/Text Processing ---
    async function parseTextOrPdf(file) {
        if (file.type === 'application/pdf') {
            const ab = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
            let text = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map(item => item.str).join(' ') + '\n';
            }
            return text;
        } else if (file.type.includes('wordprocessingml') || file.name.endsWith('.docx')) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            return result.value;
        } else {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsText(file);
            });
        }
    }

    function setLoading(isLoading) {
        processBtn.disabled = isLoading;
        btnLoader.classList.toggle('hidden', !isLoading);
        if (isLoading) btnText.textContent = 'Analyzing with AI...';
        else btnText.textContent = 'Analyze with AI';
    }

    function downloadPDF() {
        const element = document.getElementById('resume-preview');

        // Check if there's content to download
        if (!element || !element.innerHTML.trim()) {
            alert('No resume content to download. Please run the analysis first.');
            return;
        }

        // Show loading state
        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Generating PDF...';

        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `AI_Optimized_Resume_${new Date().getTime()}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            },
            jsPDF: {
                unit: 'in',
                format: 'letter',
                orientation: 'portrait',
                compress: true
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf()
            .set(opt)
            .from(element)
            .save()
            .then(() => {
                // Reset button state
                downloadBtn.disabled = false;
                downloadBtn.textContent = 'Download PDF';
                console.log('✅ PDF downloaded successfully');
            })
            .catch((error) => {
                console.error('❌ PDF generation error:', error);
                alert('Error generating PDF. Please try again.');
                downloadBtn.disabled = false;
                downloadBtn.textContent = 'Download PDF';
            });
    }
});

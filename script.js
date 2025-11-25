document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('resume-upload');
    const fileInfo = document.getElementById('file-info');
    const fileNameDisplay = document.getElementById('file-name');
    const removeFileBtn = document.getElementById('remove-file');

    const jdInput = document.getElementById('jd-input');
    const processBtn = document.getElementById('process-btn');
    const btnText = processBtn.querySelector('.btn-text');
    const btnLoader = processBtn.querySelector('.btn-loader');

    // New AI-powered elements
    const atsScoreCard = document.getElementById('ats-score-card');
    const atsScoreValue = document.getElementById('ats-score-value');
    const atsAnalysis = document.getElementById('ats-analysis');
    const interviewQuestionsCard = document.getElementById('interview-questions-card');
    const interviewQuestionsList = document.getElementById('interview-questions-list');
    const suggestionsCard = document.getElementById('suggestions-card');
    const suggestionsList = document.getElementById('suggestions-list');
    const optimizedResumeCard = document.getElementById('optimized-resume-card');
    const resumePreview = document.getElementById('resume-preview');
    const downloadBtn = document.getElementById('download-btn');

    // Add keywordsList element reference (it was missing)
    let keywordsList = document.getElementById('keywords-list');
    // If it doesn't exist in DOM, create it dynamically inside the ATS card for robustness
    if (!keywordsList && atsAnalysis) {
        const kwContainer = document.createElement('div');
        kwContainer.className = 'keywords-container';
        kwContainer.style.marginTop = '1rem';
        kwContainer.innerHTML = '<strong>Top Keywords:</strong> <div id="keywords-list" class="keywords-list"></div>';
        atsAnalysis.parentNode.appendChild(kwContainer);
        keywordsList = document.getElementById('keywords-list');
    }

    // API Configuration Elements
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key');
    const apiStatus = document.getElementById('api-status');

    let currentFile = null;
    let apiKey = localStorage.getItem('gemini_api_key') || '';

    // Initialize API key if exists
    if (apiKey) {
        apiKeyInput.value = apiKey;
        apiStatus.textContent = '✓ API Key Saved';
        apiStatus.className = 'status-message success';
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
    removeFileBtn.addEventListener('click', removeFile);

    jdInput.addEventListener('input', updateState);

    processBtn.addEventListener('click', processResume);
    downloadBtn.addEventListener('click', downloadPDF);

    saveApiKeyBtn.addEventListener('click', saveApiKey);

    // --- API Key Management ---
    function saveApiKey() {
        const key = apiKeyInput.value.trim();
        if (!key) {
            apiStatus.textContent = '✗ Please enter an API key';
            apiStatus.className = 'status-message error';
            return;
        }

        if (!key.startsWith('AIza')) {
            apiStatus.textContent = '✗ Invalid API key format';
            apiStatus.className = 'status-message error';
            return;
        }

        localStorage.setItem('gemini_api_key', key);
        apiKey = key;
        apiStatus.textContent = '✓ API Key Saved Successfully';
        apiStatus.className = 'status-message success';
    }

    // --- Core Logic ---
    function handleFile(file) {
        if (!file) return;
        currentFile = file;
        fileNameDisplay.textContent = file.name;

        // Show file info, hide drop zone text if needed or just show below
        dropZone.style.display = 'none';
        fileInfo.classList.remove('hidden');
        fileInfo.style.display = 'flex';

        updateState();
    }

    function removeFile(e) {
        e.stopPropagation();
        currentFile = null;
        fileInput.value = '';

        dropZone.style.display = 'flex';
        fileInfo.classList.add('hidden');
        fileInfo.style.display = 'none';

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

            // --- UI Transition: Input -> Output ---

            // Hide Input Section
            document.querySelector('.input-section').style.display = 'none';

            // Show Output Section
            const outputSection = document.querySelector('.output-section');
            outputSection.style.display = 'block';
            outputSection.classList.remove('hidden');

            // Ensure Download Button is visible
            downloadBtn.style.display = 'inline-flex';
            downloadBtn.classList.remove('hidden');

            // Add "Start Over" button if not present
            if (!document.getElementById('start-over-btn')) {
                const navLinks = document.querySelector('.nav-links');
                const startOverBtn = document.createElement('button');
                startOverBtn.id = 'start-over-btn';
                startOverBtn.className = 'secondary-button small';
                startOverBtn.textContent = 'Start New Analysis';
                startOverBtn.onclick = () => window.location.reload();
                navLinks.appendChild(startOverBtn);
            }

            // emptyState.classList.add('hidden'); // Removed as element no longer exists

            setLoading(false);

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

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
        const prompt = `You are a professional resume writer and ATS optimization expert. 

TASK: Rewrite the resume below to better match the job description while maintaining the candidate's authentic experience.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}

REQUIREMENTS:
1. Rewrite bullet points to include relevant keywords from the job description
2. Emphasize experience that matches the job requirements
3. Use strong action verbs (Led, Developed, Implemented, Managed, etc.)
4. Keep the same structure (name, contact, experience, education, skills)
5. Maintain all dates, job titles, and company names exactly as they are
6. Make bullet points quantifiable where possible

OUTPUT FORMAT:
Return ONLY clean HTML (no markdown, no code blocks, no explanations).
Use this structure:
- <h1> for the candidate's name
- <p> for contact information
- <h2> for section headers (EXPERIENCE, EDUCATION, SKILLS, etc.)
- <h3> for job titles with company name
- <p> for dates and locations
- <ul> and <li> for bullet points
- <p> for other content

Do NOT include: \`\`\`html, \`\`\`, or any markdown formatting.
Start directly with the HTML tags.`;

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

        // Display keywords if element exists
        if (keywordsList && atsResult.keywords) {
            keywordsList.innerHTML = atsResult.keywords.slice(0, 5).map(k =>
                `<span class="skill-tag">${k}</span>`
            ).join('');
        }
    }

    function displayInterviewQuestions(questions) {
        if (questions.length === 0) return;

        interviewQuestionsCard.style.display = 'block';
        // Clear any existing questions - we only want to show the button now
        interviewQuestionsList.innerHTML = '';

        // Store questions for Manager round
        window.aiQuestions = questions;

        // Add "Practice interview questions" button if not already present
        let btn = document.getElementById('startPracticeBtn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'startPracticeBtn';
            btn.className = 'primary-button';
            btn.style.marginTop = '1rem';
            btn.style.width = '100%';
            btn.onclick = startInterviewPractice;
            interviewQuestionsCard.appendChild(btn);
        }

        // Update button text
        btn.innerHTML = '<span>Practice interview questions</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    }

    // --- Interview Practice Logic ---

    // State
    let interviewState = {
        questions: [],
        currentIndex: 0,
        answers: [],
        startTime: null,
        questionStartTime: null,
        timerInterval: null,
        recognition: null,
        isRecording: false
    };

    window.startInterviewPractice = function () {
        document.querySelector('.grid-layout').style.display = 'none';
        document.querySelector('.output-section').style.display = 'none';
        document.getElementById('selectionScreen').classList.add('active');
        window.scrollTo(0, 0);
    };

    window.showDashboard = function () {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelector('.grid-layout').style.display = 'grid';
        document.querySelector('.output-section').style.display = 'block';
        window.scrollTo(0, 0);
    };

    window.startInterview = function (type) {
        interviewState.questions = [];
        interviewState.currentIndex = 0;
        interviewState.answers = [];
        interviewState.startTime = Date.now();

        // Select questions based on type
        if (type === 'manager' && window.aiQuestions && window.aiQuestions.length > 0) {
            interviewState.questions = window.aiQuestions;
        } else if (type === 'screening') {
            interviewState.questions = [
                "Tell me about yourself and your background.",
                "Why are you interested in this position?",
                "What are your greatest strengths and weaknesses?",
                "Describe a challenging work situation and how you overcame it.",
                "Where do you see yourself in 5 years?"
            ];
        } else if (type === 'team') {
            interviewState.questions = [
                "Describe a time you had to work with a difficult team member.",
                "How do you handle disagreements within a team?",
                "Tell me about a successful team project you contributed to.",
                "How do you support your colleagues?",
                "What role do you typically take in a team setting?"
            ];
        } else {
            // Fallback
            interviewState.questions = window.aiQuestions || ["Tell me about yourself."];
        }

        // Update UI
        document.getElementById('selectionScreen').classList.remove('active');
        document.getElementById('interviewScreen').classList.add('active');
        document.getElementById('totalQuestionsNum').textContent = interviewState.questions.length;
        document.getElementById('questionTypeBadge').textContent = type.charAt(0).toUpperCase() + type.slice(1) + ' Round';

        displayQuestion();
    };

    function displayQuestion() {
        const question = interviewState.questions[interviewState.currentIndex];
        document.getElementById('questionText').textContent = question;
        document.getElementById('currentQuestionNum').textContent = interviewState.currentIndex + 1;
        document.getElementById('answerText').value = '';

        const progress = (interviewState.currentIndex / interviewState.questions.length) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressPercentage').textContent = `${Math.round(progress)}%`;

        interviewState.questionStartTime = Date.now();
        startTimer();
    }

    function startTimer() {
        if (interviewState.timerInterval) clearInterval(interviewState.timerInterval);

        const timerDisplay = document.getElementById('timerValue');
        interviewState.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - interviewState.questionStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }

    window.submitAnswer = function () {
        const answer = document.getElementById('answerText').value.trim();
        if (!answer) {
            alert('Please provide an answer.');
            return;
        }

        saveAnswer(answer);
        nextQuestion();
    };

    window.skipQuestion = function () {
        saveAnswer('[Skipped]');
        nextQuestion();
    };

    function saveAnswer(text) {
        const timeSpent = Math.floor((Date.now() - interviewState.questionStartTime) / 1000);
        interviewState.answers.push({
            question: interviewState.questions[interviewState.currentIndex],
            answer: text,
            timeSpent: timeSpent
        });
    }

    function nextQuestion() {
        interviewState.currentIndex++;
        if (interviewState.currentIndex < interviewState.questions.length) {
            displayQuestion();
        } else {
            finishInterview();
        }
    }

    function finishInterview() {
        clearInterval(interviewState.timerInterval);
        document.getElementById('interviewScreen').classList.remove('active');
        document.getElementById('resultsScreen').classList.add('active');

        // Calculate stats
        const totalTime = Math.floor((Date.now() - interviewState.startTime) / 1000);
        const answered = interviewState.answers.filter(a => a.answer !== '[Skipped]').length;

        // Simple point calculation
        let points = 0;
        interviewState.answers.forEach(a => {
            if (a.answer !== '[Skipped]') {
                points += 10; // Base points
                if (a.answer.length > 200) points += 5; // Length bonus
                if (a.timeSpent < 180) points += 5; // Time bonus
            }
        });

        document.getElementById('answeredCount').textContent = answered;
        document.getElementById('totalTime').textContent = `${Math.floor(totalTime / 60)}m ${totalTime % 60}s`;
        document.getElementById('pointsEarned').textContent = points;

        // Generate feedback
        const strengths = [];
        const improvements = [];

        if (points > 50) strengths.push("Strong engagement with questions");
        if (answered === interviewState.questions.length) strengths.push("Completed all questions");

        if (answered < interviewState.questions.length) improvements.push(`Skipped ${interviewState.questions.length - answered} questions`);
        if (points < 50) improvements.push("Try to provide more detailed answers");

        document.getElementById('feedbackStrengths').innerHTML = strengths.map(s => `<li>${s}</li>`).join('') || '<li>Keep practicing!</li>';
        document.getElementById('feedbackImprovements').innerHTML = improvements.map(s => `<li>${s}</li>`).join('') || '<li>Great job!</li>';
    }

    window.toggleStarGuide = function () {
        document.getElementById('starContent').classList.toggle('expanded');
    };

    // Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        interviewState.recognition = new SpeechRecognition();
        interviewState.recognition.continuous = true;
        interviewState.recognition.interimResults = true;

        interviewState.recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                const textarea = document.getElementById('answerText');
                textarea.value += (textarea.value ? ' ' : '') + finalTranscript;
            }
        };

        interviewState.recognition.onend = () => {
            interviewState.isRecording = false;
            updateMicUI(false);
        };
    }

    window.toggleRecording = function () {
        if (!interviewState.recognition) {
            alert('Speech recognition not supported in this browser.');
            return;
        }

        if (interviewState.isRecording) {
            interviewState.recognition.stop();
        } else {
            interviewState.recognition.start();
            interviewState.isRecording = true;
            updateMicUI(true);
        }
    };

    function updateMicUI(isRecording) {
        const btn = document.getElementById('micButton');
        const status = document.getElementById('micStatus');
        if (isRecording) {
            btn.classList.add('recording');
            status.textContent = 'Listening...';
        } else {
            btn.classList.remove('recording');
            status.textContent = 'Tap to Speak';
        }
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
            // Fix bold markdown syntax
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .trim();

        // If the AI returned plain text instead of HTML, wrap it in basic HTML structure
        if (!cleanHtml.includes('<') || !cleanHtml.includes('>')) {
            cleanHtml = `<div class="resume-container"><pre style="white-space: pre-wrap; font-family: inherit;">${cleanHtml}</pre></div>`;
        }

        resumePreview.innerHTML = cleanHtml;

        // Explicitly show the card and button
        optimizedResumeCard.style.display = 'block';
        downloadBtn.style.display = 'inline-flex';
        downloadBtn.classList.remove('hidden');
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
        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = 'Generating ATS-Friendly PDF...';

        try {
            // Extract text content from HTML for ATS-friendly PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'letter'
            });

            // Page dimensions
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 40;
            const maxWidth = pageWidth - (margin * 2);
            let yPosition = margin;

            // Helper function to add text with word wrap
            function addText(text, fontSize, isBold = false, isItalic = false) {
                if (!text || text.trim() === '') return;

                doc.setFontSize(fontSize);
                doc.setFont('helvetica', isBold ? 'bold' : (isItalic ? 'italic' : 'normal'));

                const lines = doc.splitTextToSize(text.trim(), maxWidth);

                lines.forEach(line => {
                    // Check if we need a new page
                    if (yPosition > pageHeight - margin) {
                        doc.addPage();
                        yPosition = margin;
                    }

                    doc.text(line, margin, yPosition);
                    yPosition += fontSize * 1.2;
                });
            }

            // Helper function to add spacing
            function addSpace(points = 10) {
                yPosition += points;
            }

            // Parse HTML content
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(element.innerHTML, 'text/html');

            // Extract and format content
            const processNode = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent.trim();
                    if (text) {
                        addText(text, 9); // Reduced from 11
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const tagName = node.tagName.toLowerCase();

                    switch (tagName) {
                        case 'h1':
                            addSpace(5);
                            addText(node.textContent, 15, true); // Changed to 15
                            addSpace(2); // Reduced from 10
                            break;
                        case 'h2':
                            addSpace(12);
                            addText(node.textContent.toUpperCase(), 11, true);
                            addSpace(8);
                            // Add a line under section headers
                            doc.setLineWidth(0.5);
                            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
                            addSpace(2); // Reduced from 5
                            break;
                        case 'h3':
                            addSpace(8);
                            addText(node.textContent, 10, true);
                            addSpace(2); // Reduced from 5
                            break;
                        case 'p':
                            addText(node.textContent, 9); // Reduced from 11
                            addSpace(5);
                            break;
                        case 'ul':
                            Array.from(node.children).forEach(li => {
                                if (li.tagName.toLowerCase() === 'li') {
                                    const bulletText = '• ' + li.textContent.trim();
                                    addText(bulletText, 9); // Reduced from 11
                                    addSpace(3);
                                }
                            });
                            addSpace(5);
                            break;
                        case 'strong':
                        case 'b':
                            addText(node.textContent, 9, true); // Reduced from 11
                            break;
                        case 'em':
                        case 'i':
                            addText(node.textContent, 9, false, true); // Reduced from 11
                            break;
                        case 'br':
                            addSpace(5);
                            break;
                        default:
                            // Process children for other elements
                            Array.from(node.childNodes).forEach(processNode);
                            break;
                    }
                }
            };

            // Process all content
            Array.from(htmlDoc.body.childNodes).forEach(processNode);

            // Save the PDF
            const filename = `ATS_Optimized_Resume_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);

            // Reset button state
            downloadBtn.disabled = false;
            downloadBtn.textContent = originalText;
            console.log('✅ ATS-friendly PDF downloaded successfully');

        } catch (error) {
            console.error('❌ PDF generation error:', error);
            alert('Error generating PDF. Please try again.');
            downloadBtn.disabled = false;
            downloadBtn.textContent = originalText;
        }
    }
});

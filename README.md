# Enigdos AI Resume Optimizer

A premium, AI-powered web application for resume optimization, ATS scoring, and interview preparation using Google Gemini AI.

## 🚀 Features

### 🤖 AI-Powered Analysis
- **Dynamic Resume Optimization**: Uses Google Gemini AI to intelligently rewrite resume bullet points
- **Smart ATS Scoring**: AI-driven analysis of resume-job description match (0-100 score)
- **Contextual Keyword Extraction**: Identifies the most relevant keywords from job descriptions
- **Intelligent Rewriting**: Maintains professional tone while optimizing for ATS systems

### 💼 Interview Preparation
- **Custom Interview Questions**: AI generates 5 tailored interview questions based on the job description
- **Role-Specific**: Questions are contextually relevant to the specific position

### ✨ Resume Improvement Suggestions
- **AI-Powered Recommendations**: Get 5 actionable bullet points to add to your resume
- **Quantifiable & Action-Oriented**: Suggestions follow best practices for resume writing
- **Job-Specific**: Tailored to match the target job requirements

### 🎨 Premium Design
- **Glassmorphism UI**: Modern, sleek dark mode interface
- **Responsive Layout**: Works seamlessly on desktop and mobile
- **Smooth Animations**: Engaging micro-interactions and transitions
- **Professional Output**: Clean, ATS-friendly resume formatting

## 📋 How to Use

### 1. Setup
1. Open the folder `resume-optimizer-portal`
2. Double-click `index.html` to open it in your web browser

### 2. Configure API Key
1. Get a free Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Enter your API key in the configuration section
3. Click "Save Key" (it will be stored locally in your browser)

### 3. Optimize Your Resume
1. **Upload Resume**: Drag and drop or click to upload your resume (PDF, DOCX, or TXT)
2. **Paste Job Description**: Copy and paste the target job posting
3. **Click "Analyze with AI"**: Let the AI work its magic

### 4. Review Results
- **ATS Score**: See how well your resume matches (with detailed analysis)
- **Interview Questions**: Practice with AI-generated questions
- **Improvement Suggestions**: Get specific bullet points to enhance your resume
- **Optimized Resume**: Download the AI-optimized version as PDF

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **AI Engine**: Google Gemini 1.5 Flash API
- **PDF Parsing**: PDF.js
- **DOCX Parsing**: Mammoth.js
- **PDF Generation**: html2pdf.js
- **Fonts**: Google Fonts (Inter)

## 🔒 Privacy & Security

- **Local Storage**: API keys are stored locally in your browser
- **No Server**: All processing happens in your browser
- **Direct API Calls**: Your data goes directly to Google Gemini API
- **No Data Collection**: We don't store or collect any of your information

## 🎯 Key Differences from Previous Version

### Before (Fixed Rules)
- ❌ Simple keyword frequency counting
- ❌ Random action verb injection
- ❌ Basic text manipulation
- ❌ No interview preparation
- ❌ No intelligent analysis

### After (AI-Powered)
- ✅ Context-aware AI optimization
- ✅ Intelligent bullet point rewriting
- ✅ Comprehensive ATS analysis
- ✅ Custom interview questions
- ✅ Actionable improvement suggestions
- ✅ Professional, natural language output

## 💡 Tips for Best Results

1. **Complete Job Descriptions**: Paste the full job posting for better analysis
2. **Clean Resume Format**: Use standard resume formats (PDF or DOCX work best)
3. **Review AI Suggestions**: Always review and customize AI-generated content
4. **Iterate**: Run multiple times with different job descriptions to build a versatile resume

## 🔧 Troubleshooting

**API Key Issues**
- Ensure your API key starts with "AIza"
- Check that you've enabled the Gemini API in Google Cloud Console
- Verify you haven't exceeded your API quota

**Resume Upload Issues**
- Supported formats: PDF, DOCX, TXT
- Ensure file is not corrupted
- Try converting to a different format if issues persist

**Slow Processing**
- First run may take 10-20 seconds (AI analysis)
- Check your internet connection
- Gemini API may have rate limits

## 📄 License

This project is for personal use. Google Gemini API usage is subject to Google's terms of service.

## 🙏 Credits

Built with ❤️ using Google Gemini AI

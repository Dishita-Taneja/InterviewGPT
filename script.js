// Core client-side logic for InterviewGPT
// ---------------------------------------
// Handles navigation, animations, resume upload, question generation,
// mock AI feedback, and interview readiness progress.

document.addEventListener("DOMContentLoaded", () => {
  // Sidebar navigation
  const navButtons = document.querySelectorAll(".sidebar-item, .btn[data-nav-target]");
  const sections = document.querySelectorAll(".section");

  // Landing / auth
  const getStartedBtn = document.getElementById("get-started-btn");
  const authSection = document.getElementById("auth-section");
  const authStatus = document.getElementById("auth-status");
  const signupBtn = document.getElementById("signup-btn");
  const loginBtn = document.getElementById("login-btn");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  // Resume upload
  const resumeDropzone = document.getElementById("resume-dropzone");
  const resumeInput = document.getElementById("resume-input");
  const uploadResumeBtn = document.getElementById("upload-resume-btn");
  const uploadedFileName = document.getElementById("uploaded-file-name");
  const resumeSuccessMessage = document.getElementById(
    "resume-success-message"
  );

  // Interview questions
  const generateQuestionsBtn = document.getElementById(
    "generate-questions-btn"
  );
  const questionsContainer = document.getElementById("questions-container");

  // AI feedback
  const analyzeBtn = document.getElementById("analyze-btn");
  const feedbackContainer = document.getElementById("feedback-container");
  const feedbackCommunication = document.getElementById(
    "feedback-communication"
  );
  const feedbackConfidence = document.getElementById("feedback-confidence");
  const feedbackTechnical = document.getElementById("feedback-technical");
  const metricBarCommunication = document.getElementById(
    "metric-bar-communication"
  );
  const metricBarConfidence = document.getElementById("metric-bar-confidence");
  const metricBarTechnical = document.getElementById("metric-bar-technical");

  // Progress / readiness
  const readinessRing = document.getElementById("readiness-ring");
  const readinessScore = document.getElementById("readiness-score");
  const readinessProgress = document.getElementById("readiness-progress");
  const progressLabel = document.getElementById("progress-label");
  const progressPercent = document.getElementById("progress-percent");
  const skillBarCommunication = document.getElementById(
    "skill-bar-communication"
  );
  const skillBarConfidence = document.getElementById("skill-bar-confidence");
  const skillBarTechnical = document.getElementById("skill-bar-technical");
  const skillBarStorytelling = document.getElementById(
    "skill-bar-storytelling"
  );
  const skillScoreCommunication = document.getElementById(
    "skill-score-communication"
  );
  const skillScoreConfidence = document.getElementById(
    "skill-score-confidence"
  );
  const skillScoreTechnical = document.getElementById(
    "skill-score-technical"
  );
  const skillScoreStorytelling = document.getElementById(
    "skill-score-storytelling"
  );

  // In-memory state for progress and upload
  const progressState = {
    hasAuthAction: false,
    hasUploadedResume: false,
    hasGeneratedQuestions: false,
    hasAnalyzedAnswers: false,
  };
  let pendingResumeFile = null;

  // Utility: smooth scroll for focus
  function scrollToElement(element) {
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Utility: simulate AI "thinking"
  function simulateProcessing(button, callback, thinkingLabel = "Thinking...") {
    if (!button) {
      callback();
      return;
    }
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = thinkingLabel;

    setTimeout(() => {
      button.disabled = false;
      button.textContent = originalText;
      callback();
    }, 650);
  }

  // Utility: update readiness visuals
  function updateProgress() {
    const steps = [
      "hasAuthAction",
      "hasUploadedResume",
      "hasGeneratedQuestions",
      "hasAnalyzedAnswers",
    ];

    let score = 0;
    steps.forEach((k) => {
      if (progressState[k]) score += 1;
    });

    const percentage = Math.max(20, Math.round((score / steps.length) * 100));

    // Circular progress ring
    if (readinessRing) {
      readinessRing.style.setProperty("--progress", percentage / 100);
    }
    if (readinessScore) {
      readinessScore.textContent = `${percentage}%`;
    }

    // Linear overall progress
    if (readinessProgress) {
      readinessProgress.style.width = `${percentage}%`;
    }
    if (progressPercent) {
      progressPercent.textContent = `${percentage}%`;
    }

    // Label text
    let label = "Getting started";
    if (percentage >= 85) {
      label = "Interview ready";
    } else if (percentage >= 60) {
      label = "Strong progress";
    } else if (percentage >= 40) {
      label = "Warming up";
    }
    if (progressLabel) {
      progressLabel.textContent = label;
    }

    // Skill bars (simple heuristic based on overall progress)
    const clamp = (v) => Math.max(10, Math.min(100, v));
    const comm = clamp(percentage + 10);
    const conf = clamp(percentage - 5);
    const tech = clamp(percentage + 15);
    const story = clamp(percentage - 10);

    if (skillBarCommunication) {
      skillBarCommunication.style.width = `${comm}%`;
    }
    if (skillBarConfidence) {
      skillBarConfidence.style.width = `${conf}%`;
    }
    if (skillBarTechnical) {
      skillBarTechnical.style.width = `${tech}%`;
    }
    if (skillBarStorytelling) {
      skillBarStorytelling.style.width = `${story}%`;
    }

    if (skillScoreCommunication) {
      skillScoreCommunication.textContent = `${comm}%`;
    }
    if (skillScoreConfidence) {
      skillScoreConfidence.textContent = `${conf}%`;
    }
    if (skillScoreTechnical) {
      skillScoreTechnical.textContent = `${tech}%`;
    }
    if (skillScoreStorytelling) {
      skillScoreStorytelling.textContent = `${story}%`;
    }
  }

  // Utility: simple ripple effect for buttons
  function attachButtonRipples() {
    const buttons = document.querySelectorAll(".btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement("span");
        const size = Math.max(rect.width, rect.height);
        ripple.className = "ripple";
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
      });
    });
  }

  // Sidebar navigation + dashboard section switching
  function showSection(targetKey) {
    sections.forEach((section) => {
      const id = section.id.replace("section-", "");
      if (id === targetKey) {
        section.classList.add("active-section");
      } else {
        section.classList.remove("active-section");
      }
    });
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-nav-target");
      if (!target) return;

      // Highlight active in sidebar if applicable
      if (btn.classList.contains("sidebar-item")) {
        navButtons.forEach((b) => {
          if (b.classList.contains("sidebar-item")) {
            b.classList.toggle("active", b === btn);
          }
        });
      }

      showSection(target);
    });
  });

  // Landing "Get Started" button scrolls to auth
  if (getStartedBtn && authSection) {
    getStartedBtn.addEventListener("click", () => scrollToElement(authSection));
  }

  // Auth simulation
  function runAuthSimulation(mode) {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password || (mode === "signup" && !name)) {
      authStatus.textContent =
        "Please fill in name, email and password to continue.";
      authStatus.classList.remove("positive");
      authStatus.classList.add("negative");
      return;
    }

    simulateProcessing(
      mode === "signup" ? signupBtn : loginBtn,
      () => {
        if (mode === "signup") {
          authStatus.textContent = `Welcome, ${
            name || "there"
          }! Your demo account is ready.`;
        } else {
          authStatus.textContent = `Logged in as ${email} (demo only).`;
        }
        authStatus.classList.remove("negative");
        authStatus.classList.add("positive");

        progressState.hasAuthAction = true;
        updateProgress();
      },
      "Authenticating..."
    );
  }

  if (signupBtn) {
    signupBtn.addEventListener("click", () => runAuthSimulation("signup"));
  }
  if (loginBtn) {
    loginBtn.addEventListener("click", () => runAuthSimulation("login"));
  }

  // Resume upload: track selected or dropped file
  function setPendingFile(file) {
    pendingResumeFile = file;
    if (!file) {
      uploadedFileName.textContent = "";
      resumeSuccessMessage.classList.add("hidden");
      return;
    }
    uploadedFileName.textContent = file.name;
    uploadedFileName.classList.remove("negative");
    uploadedFileName.classList.add("positive");
    resumeSuccessMessage.classList.add("hidden");
  }

  if (resumeInput) {
    resumeInput.addEventListener("change", () => {
      const file = resumeInput.files && resumeInput.files[0];
      setPendingFile(file || null);
    });
  }

  if (resumeDropzone) {
    ["dragenter", "dragover"].forEach((eventName) => {
      resumeDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        resumeDropzone.classList.add("drag-over");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      resumeDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        resumeDropzone.classList.remove("drag-over");
      });
    });

    resumeDropzone.addEventListener("drop", (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        setPendingFile(file);
      }
    });
  }

  if (uploadResumeBtn) {
    uploadResumeBtn.addEventListener("click", () => {
      if (!pendingResumeFile) {
        uploadedFileName.textContent = "Please select or drop a resume file.";
        uploadedFileName.classList.remove("positive");
        uploadedFileName.classList.add("negative");
        resumeSuccessMessage.classList.add("hidden");
        return;
      }

      simulateProcessing(uploadResumeBtn, () => {
        resumeSuccessMessage.classList.remove("hidden");
        progressState.hasUploadedResume = true;
        updateProgress();
      });
    });
  }

  // Sample questions
  const SAMPLE_QUESTIONS = [
    "Tell me about yourself.",
    "What are your strengths and weaknesses?",
    "Why do you want to join our company?",
    "Describe a challenging project you worked on.",
    "Where do you see yourself in 5 years?",
  ];

  function renderQuestions() {
    if (!questionsContainer) return;
    questionsContainer.innerHTML = "";

    SAMPLE_QUESTIONS.forEach((question, index) => {
      const item = document.createElement("div");
      item.className = "question-item fade-in-up";

      const header = document.createElement("div");
      header.className = "question-header";

      const qText = document.createElement("div");
      qText.className = "question-text";
      qText.textContent = question;

      const qLabel = document.createElement("div");
      qLabel.className = "question-label";
      qLabel.textContent = `Question ${index + 1}`;

      header.appendChild(qText);
      header.appendChild(qLabel);

      const answerArea = document.createElement("div");
      answerArea.className = "answer-area";

      const textarea = document.createElement("textarea");
      textarea.placeholder =
        "Type your answer here. Aim for 1–2 minutes of spoken content.";
      textarea.setAttribute("data-question-index", String(index));

      answerArea.appendChild(textarea);
      item.appendChild(header);
      item.appendChild(answerArea);

      questionsContainer.appendChild(item);
    });
  }

  if (generateQuestionsBtn) {
    generateQuestionsBtn.addEventListener("click", () => {
      simulateProcessing(generateQuestionsBtn, () => {
        renderQuestions();
        questionsContainer.classList.remove("hidden");
        progressState.hasGeneratedQuestions = true;
        updateProgress();
      });
    });
  }

  // Feedback analysis based on answers
  function analyzeAnswers() {
    if (!questionsContainer) return;
    const textareas = questionsContainer.querySelectorAll("textarea");
    let totalLength = 0;
    let nonEmptyCount = 0;

    textareas.forEach((ta) => {
      const value = ta.value.trim();
      if (value.length > 0) {
        nonEmptyCount += 1;
        totalLength += value.length;
      }
    });

    const avgLength = textareas.length
      ? Math.round(totalLength / textareas.length)
      : 0;

    // Communication: based on how many answers are filled
    if (nonEmptyCount >= 4) {
      feedbackCommunication.textContent = "Strong";
      metricBarCommunication.style.width = "88%";
    } else if (nonEmptyCount >= 2) {
      feedbackCommunication.textContent = "Good";
      metricBarCommunication.style.width = "65%";
    } else {
      feedbackCommunication.textContent = "Limited";
      metricBarCommunication.style.width = "35%";
    }

    // Confidence: based on average length
    if (avgLength > 420) {
      feedbackConfidence.textContent = "Strong";
      metricBarConfidence.style.width = "85%";
    } else if (avgLength > 220) {
      feedbackConfidence.textContent = "Good";
      metricBarConfidence.style.width = "65%";
    } else if (avgLength > 80) {
      feedbackConfidence.textContent = "Needs Improvement";
      metricBarConfidence.style.width = "45%";
    } else {
      feedbackConfidence.textContent = "Very Brief";
      metricBarConfidence.style.width = "25%";
    }

    // Technical: tied to completeness + avg length
    if (nonEmptyCount === textareas.length && avgLength > 200) {
      feedbackTechnical.textContent = "Strong";
      metricBarTechnical.style.width = "88%";
    } else if (nonEmptyCount >= 3) {
      feedbackTechnical.textContent = "Good";
      metricBarTechnical.style.width = "65%";
    } else {
      feedbackTechnical.textContent = "Surface-level";
      metricBarTechnical.style.width = "40%";
    }

    feedbackContainer.classList.remove("hidden");
    progressState.hasAnalyzedAnswers = true;
    updateProgress();
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", () => {
      simulateProcessing(analyzeBtn, analyzeAnswers, "Analyzing...");
    });
  }

  attachButtonRipples();
  updateProgress();
});


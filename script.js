let cachedQuestions = [];
let responses = {}; // Stores answers for each questionNumber

// Load the JSON data and initialize the quiz
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        cachedQuestions = await response.json();
        renderPage(-1); // Start with the first page (index -1 for static page-1)
    } catch (error) {
        console.error("Failed to load questions.json:", error);
    }
}

function renderPage(index) {
    // Handle static pages
    if (index === -1) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        const firstPage = document.getElementById('page-1');
        if (firstPage) {
            firstPage.classList.add('active');
        } else {
            console.error("First page (id='page-1') is missing from the HTML.");
        }
        return;
    }

    if (index === -2) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        const lastPage = document.getElementById('last_page');
        if (lastPage) {
            console.log("Navigating to last page.");
            lastPage.classList.add('active');
        } else {
            console.error("Last page (id='last_page') is missing from the HTML.");
        }
        return;
    }

    // Render dynamic questions
    if (index >= 0 && index < cachedQuestions.length) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        const container = document.getElementById('quiz-container');
        const question = cachedQuestions[index];
        container.querySelector('.dynamic-question')?.remove(); // Remove previous question if any
        const questionDiv = document.createElement('div');
        questionDiv.className = 'page active dynamic-question';

        const savedBehavior = responses[question.questionNumber]?.behavior || "";
        const savedComments = responses[question.questionNumber]?.comments || "";

        questionDiv.innerHTML = `
            <div class="question-header">
                <h2>Question ${question.questionNumber}</h2>
                <p><b>Number of Cycles:</b> ${question.cycleNumber}</p>
            </div>
            <table class="image-table">
                <thead>
                    <tr>
                        <th>Last Cycle</th>
                        <th>3% Strain Cycle</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><img src="${question.lastCycleImage}" alt="Last Cycle Image"></td>
                        <td><img src="${question.strainCycleImage}" alt="3% Strain Cycle Image"></td>
                    </tr>
                </tbody>
            </table>
            <div class="multiple-choice" style="padding-left:10%">
                <p>Please select the behavior type:</p>
                <label><input type="radio" name="behavior_${question.questionNumber}" value="sand-like behavior" ${savedBehavior === "sand-like behavior" ? "checked" : ""}> Sand-like behavior</label><br>
                <label><input type="radio" name="behavior_${question.questionNumber}" value="clay-like behavior" ${savedBehavior === "clay-like behavior" ? "checked" : ""}> Clay-like behavior</label><br>
                <label><input type="radio" name="behavior_${question.questionNumber}" value="intermediate behavior" ${savedBehavior === "intermediate behavior" ? "checked" : ""}> Intermediate behavior</label><br>
                <label><input type="radio" name="behavior_${question.questionNumber}" value="data not usable" ${savedBehavior === "data not usable" ? "checked" : ""}> Data is not usable</label>
            </div>
            <div class="comments-section"style="padding-left:10%; padding-right:40%">
                <h3>Comments</h3>
                <textarea id="comments_${question.questionNumber}" rows="5" placeholder="Enter your comments here...">${savedComments}</textarea>
            </div>
            <div class="navigation-buttons">
                <button onclick="saveAnswer(${question.questionNumber}); navigatePage(${index - 1})" ${index === 0 ? 'disabled' : ''}>Back</button>
                <button onclick="saveAnswer(${question.questionNumber}); ${index === cachedQuestions.length - 1 ? 'navigatePage(-2)' : `navigatePage(${index + 1})`}">Next</button>
            </div>
        `;
        container.appendChild(questionDiv);

        addAutoSaveListeners(question.questionNumber);
    } else {
        console.error(`Invalid page index: ${index}`);
    }
}

function navigatePage(index) {
    console.log(`Navigating to index: ${index}`);
    if (index === -1) {
        renderPage(-1);
    } else if (index === -2) {
        renderPage(-2);
    } else if (index >= 0 && index < cachedQuestions.length) {
        renderPage(index);
    } else {
        console.error(`Invalid navigation request. Index: ${index}`);
    }
}

function saveAnswer(questionNumber) {
    const selectedBehavior = document.querySelector(`input[name="behavior_${questionNumber}"]:checked`);
    const commentInput = document.getElementById(`comments_${questionNumber}`);

    if (!responses[questionNumber]) {
        responses[questionNumber] = {};
    }

    responses[questionNumber].behavior = selectedBehavior ? selectedBehavior.value : "";
    responses[questionNumber].comments = commentInput ? commentInput.value.trim() : "";

    console.log(`Saved for Question ${questionNumber}:`, responses[questionNumber]);
}

function addAutoSaveListeners(questionNumber) {
    document.querySelectorAll(`input[name="behavior_${questionNumber}"]`).forEach(input => {
        input.addEventListener('change', () => saveAnswer(questionNumber));
    });

    const commentInput = document.getElementById(`comments_${questionNumber}`);
    if (commentInput) {
        commentInput.addEventListener('input', () => saveAnswer(questionNumber));
    }
}

function submitForm() {
    console.log(responses);
    const data = [];

    const researcherNameInput = document.getElementById("researcher-name");
    const researcherName = researcherNameInput ? researcherNameInput.value.trim() : "Researcher";

    data.push({
        Question: "Researcher Name",
        Answer: researcherName
    });

    Object.keys(responses).forEach(questionNumber => {
        if (responses[questionNumber].behavior || responses[questionNumber].comments) {
            data.push({
                Question: `Question_Number_${questionNumber}_Behavior`,
                Answer: responses[questionNumber].behavior || "No selection",
            });

            data.push({
                Question: `Question_Number_${questionNumber}_Comments`,
                Answer: responses[questionNumber].comments || "No comments",
            });
        }
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");

    const fileName = `${researcherName.replace(/ /g, "_")}_Responses.xlsx`;

    XLSX.writeFile(workbook, fileName);
    alert("Your answers have been saved to an Excel file!");
}

document.addEventListener('DOMContentLoaded', () => {
    const lastPage = document.getElementById('last_page');
    console.log("Last Page Test:", lastPage ? "Found" : "Missing");
    loadQuestions();
});
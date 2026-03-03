// Theme Toggle Logic
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
const currentTheme = localStorage.getItem('theme');

if (currentTheme) {
    document.body.classList.add(currentTheme);
    if (currentTheme === 'dark-mode') toggleSwitch.checked = true;
}

toggleSwitch.addEventListener('change', function(e) {
    if (e.target.checked) {
        document.body.classList.replace('light-mode', 'dark-mode');
        if(!document.body.classList.contains('dark-mode')) document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark-mode');
    } else {
        document.body.classList.replace('dark-mode', 'light-mode');
        localStorage.setItem('theme', 'light-mode');
    }    
});

let userData = {};

// Logics before entering the actual calculator
function goToCalculator() {
    userData.name = document.getElementById('student-name').value;
    userData.stream = document.getElementById('student-stream').value;
    userData.sem = document.getElementById('student-sem').value;
    document.getElementById('home-btn').classList.remove('hidden');

    if (!userData.name || !userData.sem) {
        alert("Please enter your name and semester to proceed.");
        return;
    }

    document.getElementById('front-page').classList.replace('active-page', 'hidden-page');
    setTimeout(() => {
        document.getElementById('calculator-page').classList.replace('hidden-page', 'active-page');
    }, 300);
}

window.goHome = function() {
    const frontPage = document.getElementById('front-page');
    const calcPage = document.getElementById('calculator-page');

    // Hide Calculator Page and Home Button
    calcPage.classList.remove('active-page');
    calcPage.classList.add('hidden-page');
    document.getElementById('home-btn').classList.add('hidden');
    
    // Show Front Page
    setTimeout(() => {
        frontPage.classList.remove('hidden-page');
        frontPage.classList.add('active-page');
    }, 300);
};

function generateTable() {
    const uni = document.getElementById('university-select').value;
    const count = document.getElementById('subject-count').value;
    const container = document.getElementById('table-container');
    const calcBtn = document.getElementById('calculate-btn');
    
    container.innerHTML = ''; 

    if (uni === 'none' || count < 1) {
        calcBtn.classList.add('hidden');
        return;
    }

    let caCount = 1; 
    if (uni === 'MAKAUT') caCount = 4; 

    for (let i = 1; i <= count; i++) {
        let row = document.createElement('div');
        row.className = 'row-container';
        
        let html = `<input type="text" id="subName${i}" class="subject-title" value="Subject ${i}">`;
        
        html += `<div class="input-grid">`;
        
        for(let j = 1; j <= caCount; j++) {
            html += `<input type="number" id="sub${i}-ca${j}" placeholder="CA ${j}" min="0" max="25">`;
        }
        
        // Added the sem-marks-input class here
        html += `<input type="number" id="sub${i}-sem" class="sem-marks-input" placeholder="Sem Marks" min="0" max="70">`;
        
        html += `</div>`;
        row.innerHTML = html;
        container.appendChild(row);
    }
    
    calcBtn.classList.remove('hidden');
}

function calculateResults() {
    const uni = document.getElementById('university-select').value;
    const count = document.getElementById('subject-count').value;
    let totalScore = 0;
    let maxScore = count * 100;
    let hasBacklog = false;
    let backlogSubjects = [];

    // --- ADDED FOR PDF: String to build the formal table rows ---
    let tbodyStr = '';

    for (let i = 1; i <= count; i++) {
        let subjectTotal = 0;
        let semMarks = Number(document.getElementById(`sub${i}-sem`).value) || 0;
        let subName = document.getElementById(`subName${i}`).value || `Subject ${i}`;

        // --- ADDED FOR PDF: Start the row ---
        tbodyStr += `<tr><td>${subName}</td>`;

        if (uni === 'MAKAUT') {
            let cas = [
                Number(document.getElementById(`sub${i}-ca1`).value) || 0,
                Number(document.getElementById(`sub${i}-ca2`).value) || 0,
                Number(document.getElementById(`sub${i}-ca3`).value) || 0,
                Number(document.getElementById(`sub${i}-ca4`).value) || 0
            ];
            
            // --- ADDED FOR PDF: Add raw CA marks to the table before sorting ---
            cas.forEach(ca => tbodyStr += `<td>${ca}</td>`);

            cas.sort((a, b) => b - a); 
            let bestTwoAvg = (cas[0] + cas[1]) / 2;
            subjectTotal = bestTwoAvg + semMarks;
        } else {
            let ca1 = Number(document.getElementById(`sub${i}-ca1`).value) || 0;
            
            // --- ADDED FOR PDF: Add CA mark to table ---
            tbodyStr += `<td>${ca1}</td>`;
            
            subjectTotal = ca1 + semMarks;
        }

        totalScore += subjectTotal;
        
        // --- ADDED FOR PDF: Finish the row ---
        tbodyStr += `<td>${semMarks}</td><td>${subjectTotal}</td></tr>`;

        if (subjectTotal < 40) { 
            hasBacklog = true;
            backlogSubjects.push(subName); 
        }
    }

    let percentage = (totalScore / maxScore) * 100; 
    let estimatedGPA = (percentage + 7.5) / 10;  // Formula [percentage = (GPA - 0.75) * 10]

    document.getElementById('result-student-info').innerHTML = 
        `<strong>Name:</strong> ${userData.name} <br>
            <strong>Stream:</strong> ${userData.stream} <br>
            <strong>Semester:</strong> ${userData.sem} <br>
            <strong>University:</strong> ${uni}`;
         
    // Added .toFixed(2) to your estimatedGPA so it displays cleanly!
    document.getElementById('result-stats').innerHTML = 
        `<h3>Estimated GPA: ${estimatedGPA.toFixed(2)}</h3>
            <p>Total Percentage: ${percentage.toFixed(2)}%</p>`;

    let warningDiv = document.getElementById('backlog-warning');
    if (hasBacklog) {
        warningDiv.innerHTML = `⚠️ Warning: Potential backlog detected in: ${backlogSubjects.join(', ')}`;
        warningDiv.classList.remove('hidden');
    } else {
        warningDiv.classList.add('hidden');
    }

    document.getElementById('results-modal').classList.remove('hidden');

    // --- ADDED FOR PDF: Populate the hidden formal template at the very end ---
    let theadStr = `<tr><th></th>`; 
    
    let caCount = uni === 'MAKAUT' ? 4 : 1;
    for(let j=1; j<=caCount; j++) {
        theadStr += `<th>CA ${j}</th>`;
    }
    theadStr += `<th>Sem Marks</th><th>Total</th></tr>`;

    // 2. Wrap the subject names in the vertical text span before building the table body
    let finalTbodyStr = tbodyStr.replace(/<tr><td>/g, '<tr><td><span class="vert-text">').replace(/<\/td>/g, '</span></td>');

    document.getElementById('print-name').innerText = userData.name;
    document.getElementById('print-stream').innerText = userData.stream;
    document.getElementById('print-sem').innerText = userData.sem;
    document.getElementById('print-gpa').innerText = estimatedGPA.toFixed(2);
    document.getElementById('print-percentage').innerText = percentage.toFixed(2) + '%';
    
    // Inject into table
    document.getElementById('print-table').innerHTML = theadStr + tbodyStr;
    
    // Re-select all first column cells to apply the vertical class properly
    let rows = document.getElementById('print-table').querySelectorAll('tr');
    for(let i=1; i<rows.length; i++) {
        let firstCell = rows[i].querySelector('td');
        if(firstCell) {
            let text = firstCell.innerText;
            firstCell.innerHTML = `<span class="vert-text">${text}</span>`;
        }
    }
}

function closeModal() {
    document.getElementById('results-modal').classList.add('hidden');
}

function exportToPDF() {
    const element = document.getElementById('print-template');
    
    // --- FIX FOR BLANK PDF ---
    // Keep it in the viewable screen area, but hide it deeply BEHIND your other UI components
    element.style.display = 'block';
    element.style.position = 'absolute';
    element.style.top = '0';
    element.style.left = '0';
    element.style.zIndex = '-1000'; 

    const opt = {
        margin:       0.5, 
        filename:     `${userData.name}_Sem${userData.sem}_Result.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 }, 
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    const actions = document.querySelector('.modal-actions');
    actions.style.display = 'none';
    
    html2pdf().set(opt).from(element).save().then(() => {
        actions.style.display = 'flex'; 
        if(window.innerWidth <= 600) {
            actions.style.flexDirection = 'column';
        }

        // Hide the template completely again once PDF is done
        element.style.display = 'none';
        element.style.position = 'static';
    });
}
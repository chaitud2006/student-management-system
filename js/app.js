// --- DATA MEMORY STATE ENGINE ---
let students = JSON.parse(localStorage.getItem('students')) || [];
let editIndex = -1;

// Collect HTML elements into variables
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const studentForm = document.getElementById('studentForm');
const studentTableBody = document.getElementById('studentTableBody');
const searchInput = document.getElementById('searchInput');
const filterDept = document.getElementById('filterDept');

// --- 1. SIGN IN GATEKEEPER LOGIC ---
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault(); 

        const usernameInput = document.getElementById('username').value;
        const passwordInput = document.getElementById('password').value;

        if (usernameInput === 'admin' && passwordInput === 'admin123') {
            alert('🎉 Login Successful!');
            globalThis.location.href = 'dashboard.html';
        } else {
            alert('❌ Wrong username or password. Try again!');
        }
    });

    document.getElementById('resetBtn').addEventListener('click', function() {
        loginForm.reset();
    });
}

// --- 2. SIGN OUT LOGIC ---
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        alert('Logging out...');
        globalThis.location.href = 'index.html';
    });
}

// --- 3. RENDERING ENGINE (Draws cards & updates records table view) ---
function renderDashboard() {
    if (!studentTableBody) return; 

    const searchTerm = searchInput.value.toLowerCase();
    const deptFilter = filterDept.value;
    
    studentTableBody.innerHTML = '';
    
    let cse = 0, aids = 0, ece = 0, mech = 0;

    students.forEach((student, index) => {
        if (student.department === 'CSE') cse++;
        if (student.department === 'AI&DS') aids++;
        if (student.department === 'ECE') ece++;
        if (student.department === 'Mechanical') mech++;

        const matchesSearch = student.name.toLowerCase().includes(searchTerm) || student.id.toLowerCase().includes(searchTerm);
        const matchesDept = deptFilter === 'All' || student.department === deptFilter;

        if (matchesSearch && matchesDept) {
            const row = document.createElement('tr');
            
            // Premium Conditional Styling: Highlight bad attendance (< 75%) in bold red
            let attPercentage = student.attendance ? parseInt(student.attendance) : 0;
            let attendanceStyle = attPercentage < 75 ? 'color: #dc3545; font-weight: 700;' : 'color: #28a745; font-weight: 600;';

            row.innerHTML = `
                <td><b>${student.id}</b></td>
                <td>${student.name}</td>
                <td>${student.department}</td>
                <td>${student.year}</td>
                <td><span style="${attendanceStyle}">${attPercentage}%</span></td>
                <td>
                    <button class="action-btn edit-btn" onclick="editStudent(${index})">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteStudent(${index})">Delete</button>
                </td>
            `;
            studentTableBody.appendChild(row);
        }
    });

    document.getElementById('totalCount').innerText = students.length;
    document.getElementById('cseCount').innerText = cse;
    document.getElementById('aidsCount').innerText = aids;
    document.getElementById('eceCount').innerText = ece;
    document.getElementById('mechCount').innerText = mech;
}

// --- 4. RECORD FORM MANAGEMENT (Add / Edit Student save logic) ---
if (studentForm) {
    studentForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const genderSelection = document.querySelector('input[name="gender"]:checked');

        const newStudent = {
            id: document.getElementById('studentId').value,
            name: document.getElementById('studentName').value,
            email: document.getElementById('studentEmail').value,
            phone: document.getElementById('studentPhone').value,
            department: document.getElementById('studentDept').value,
            year: document.getElementById('studentYear').value,
            attendance: document.getElementById('studentAttendance').value, // Attendance tracked
            gender: genderSelection ? genderSelection.value : 'Male',
            address: document.getElementById('studentAddress').value
        };

        if (editIndex === -1) {
            const idExists = students.some(s => s.id.toLowerCase() === newStudent.id.toLowerCase());
            if (idExists) {
                alert('⚠️ A student with this exact ID already exists!');
                return;
            }
            students.push(newStudent);
        } else {
            students[editIndex] = newStudent;
            editIndex = -1;
            document.getElementById('submitBtn').innerText = "Add Student";
            document.getElementById('studentId').disabled = false;
        }

        localStorage.setItem('students', JSON.stringify(students));
        studentForm.reset();
        renderDashboard();
    });

    document.getElementById('clearBtn').addEventListener('click', function() {
        studentForm.reset();
        editIndex = -1;
        document.getElementById('submitBtn').innerText = "Add Student";
        document.getElementById('studentId').disabled = false;
    });

    searchInput.addEventListener('input', renderDashboard);
    filterDept.addEventListener('change', renderDashboard);
}

// --- 5. EDIT & DELETE SYSTEM ACTIONS ---
globalThis.editStudent = function(index) {
    const student = students[index];
    editIndex = index;

    document.getElementById('studentId').value = student.id;
    document.getElementById('studentId').disabled = true; 
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentEmail').value = student.email;
    document.getElementById('studentPhone').value = student.phone;
    document.getElementById('studentDept').value = student.department;
    document.getElementById('studentYear').value = student.year;
    document.getElementById('studentAttendance').value = student.attendance || ''; // Loaded into form
    
    if (student.gender === 'Male') document.getElementById('male').checked = true;
    else document.getElementById('female').checked = true;

    document.getElementById('studentAddress').value = student.address;
    document.getElementById('submitBtn').innerText = "Update Details";
};

globalThis.deleteStudent = function(index) {
    if (confirm('Are you completely sure you want to permanently delete this student record?')) {
        students.splice(index, 1);
        localStorage.setItem('students', JSON.stringify(students));
        renderDashboard();
    }
};

// --- 6. EXPORT TO EXCEL/CSV ENGINE ---
const exportCsvBtn = document.getElementById('exportCsvBtn');
if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', function() {
        if (students.length === 0) {
            alert('⚠️ There are no student records to export yet!');
            return;
        }

        let csvContent = "Student ID,Full Name,Email,Phone,Department,Year,Attendance Percentage,Gender,Address\n";

        students.forEach(student => {
            let safeAddress = student.address.replace(/,/g, " ");
            let row = `"${student.id}","${student.name}","${student.email}","${student.phone}","${student.department}","${student.year}","${student.attendance}%","${student.gender}","${safeAddress}"\n`;
            csvContent += row;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Student_Records_Report.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// --- 7. DARK MODE THEME SYSTEM CONTROLLER ---
const themeToggleBtn = document.getElementById('themeToggleBtn');
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    if (themeToggleBtn) themeToggleBtn.innerText = "☀️ Light Mode";
}
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        if (document.body.classList.contains('dark-theme')) {
            themeToggleBtn.innerText = "☀️ Light Mode";
            localStorage.setItem('theme', 'dark');
        } else {
            themeToggleBtn.innerText = "🌙 Dark Mode";
            localStorage.setItem('theme', 'light');
        }
    });
}

if (studentTableBody) {
    renderDashboard();
}

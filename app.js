// Security Protection
(function() {
    'use strict';
    
    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+I
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+J
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        // Ctrl+U
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
        // Ctrl+S
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
        // Ctrl+A
        if (e.ctrlKey && e.keyCode === 65) {
            e.preventDefault();
            return false;
        }
        // Ctrl+P
        if (e.ctrlKey && e.keyCode === 80) {
            e.preventDefault();
            return false;
        }
    });
    
    // Disable text selection
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable drag
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Override console methods
    const methods = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml', 'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 'profileEnd'];
    for (let i = 0; i < methods.length; i++) {
        console[methods[i]] = function() {};
    }
})();

// Application State
const AppState = {
    currentPage: 'home',
    currentTeacher: null,
    currentClass: null,
    currentLecture: null,
    currentSubject: null,
    progress: JSON.parse(localStorage.getItem('courseProgress') || '{}'),
    darkMode: localStorage.getItem('darkMode') === 'true',
    telegramModalShown: localStorage.getItem('telegramModalShown') === 'true'
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setupDarkMode();
    showTelegramModal();
    loadHomePage();
}

function setupEventListeners() {
    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    // Back button
    document.getElementById('backBtn').addEventListener('click', goBack);
    
    // Telegram modal
    document.getElementById('confirmSubscription').addEventListener('click', closeTelegramModal);
    
    // Mark completed button
    document.getElementById('markCompleted').addEventListener('click', markLectureCompleted);
    
    // Material tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchMaterialTab(this.dataset.tab);
        });
    });
}

function setupDarkMode() {
    if (AppState.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function toggleDarkMode() {
    AppState.darkMode = !AppState.darkMode;
    localStorage.setItem('darkMode', AppState.darkMode);
    
    if (AppState.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Navigation Functions
function navigateToPage(page) {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        
        switch(page) {
            case 'abwab2026':
                loadTeachersPage(window.dataAb2026, 'محاضرات أبواب 2026');
                break;
            case 'abwab2025':
                loadTeachersPage(window.dataAb2025, 'محاضرات أبواب 2025');
                break;
            case 'iraq2025':
                loadTeachersPage(window.dataIq2025, 'العراق أكاديمي 2025');
                break;
            case 'materials':
                loadMaterialsPage();
                break;
            case 'exams':
                loadExamsPage();
                break;
        }
        
        updateBackButton();
    }, 500);
}

function loadHomePage() {
    showPage('homePage');
    AppState.currentPage = 'home';
    updateBackButton();
}

function loadTeachersPage(data, title) {
    if (!data || !data.teachers) {
        console.error('البيانات غير متوفرة');
        return;
    }
    
    document.getElementById('pageTitle').textContent = title;
    
    const teachersList = document.getElementById('teachersList');
    teachersList.innerHTML = '';
    
    data.teachers.forEach(teacher => {
        const teacherCard = createTeacherCard(teacher);
        teachersList.appendChild(teacherCard);
    });
    
    updateProgress(data);
    showPage('teachersPage');
    AppState.currentPage = 'teachers';
    AppState.currentData = data;
}

function createTeacherCard(teacher) {
    const card = document.createElement('div');
    card.className = 'teacher-card';
    card.onclick = () => loadTeacherPage(teacher);
    
    card.innerHTML = `
        <img class="teacher-avatar" src="${teacher.image}" alt="${teacher.name}" onerror="this.src='https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg'">
        <h3>${teacher.name}</h3>
        <p>${teacher.subject}</p>
        <div class="teacher-stats">
            <span>${teacher.classes ? teacher.classes.length : 0} فصل</span>
        </div>
    `;
    
    return card;
}

function loadTeacherPage(teacher) {
    document.getElementById('teacherImage').src = teacher.image;
    document.getElementById('teacherName').textContent = teacher.name;
    document.getElementById('teacherSubject').textContent = teacher.subject;
    
    const classesList = document.getElementById('classesList');
    classesList.innerHTML = '';
    
    if (teacher.classes) {
        teacher.classes.forEach((classItem, index) => {
            const classElement = createClassElement(classItem, teacher.id, index);
            classesList.appendChild(classElement);
        });
    }
    
    showPage('teacherPage');
    AppState.currentPage = 'teacher';
    AppState.currentTeacher = teacher;
}

function createClassElement(classItem, teacherId, classIndex) {
    const classElement = document.createElement('div');
    classElement.className = 'class-item';
    
    const completedLectures = classItem.lectures ? classItem.lectures.filter(lecture => 
        isLectureCompleted(teacherId, classIndex, lecture.title)
    ).length : 0;
    
    const totalLectures = classItem.lectures ? classItem.lectures.length : 0;
    const progressPercent = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
    
    classElement.innerHTML = `
        <div class="class-header" onclick="toggleClass(this)">
            <div>
                <div class="class-title">${classItem.name}</div>
                <div class="class-progress">${progressPercent}% مكتمل (${completedLectures}/${totalLectures})</div>
            </div>
            <i class="fas fa-chevron-down class-icon"></i>
        </div>
        <div class="lectures-list">
            ${classItem.lectures ? classItem.lectures.map((lecture, lectureIndex) => `
                <div class="lecture-item">
                    <div class="lecture-checkbox" onclick="toggleLectureCompletion(event, ${teacherId}, ${classIndex}, '${lecture.title}')">
                        <div class="checkbox ${isLectureCompleted(teacherId, classIndex, lecture.title) ? 'checked' : ''}">
                            ${isLectureCompleted(teacherId, classIndex, lecture.title) ? '<i class="fas fa-check"></i>' : ''}
                        </div>
                    </div>
                    <div class="lecture-content" onclick="playLecture('${lecture.url}', '${lecture.title}', '${lecture.description}', ${teacherId}, ${classIndex}, ${lectureIndex})">
                        <div class="lecture-info">
                            <h4>${lecture.title}</h4>
                            <p>${lecture.description}</p>
                        </div>
                        <div class="lecture-play">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                </div>
            `).join('') : '<p>لا توجد محاضرات متاحة</p>'}
        </div>
    `;
    
    return classElement;
}

function toggleClass(header) {
    const classItem = header.parentElement;
    classItem.classList.toggle('active');
}

function toggleLectureCompletion(event, teacherId, classIndex, lectureTitle) {
    event.stopPropagation(); // منع تشغيل المحاضرة عند الضغط على المربع
    
    const key = `${teacherId}_${classIndex}_${lectureTitle}`;
    
    if (AppState.progress[key] && AppState.progress[key].completed) {
        // إلغاء الإكمال
        delete AppState.progress[key];
    } else {
        // تسجيل الإكمال
        AppState.progress[key] = {
            completed: true,
            completedAt: new Date().toISOString()
        };
    }
    
    localStorage.setItem('courseProgress', JSON.stringify(AppState.progress));
    
    // تحديث الواجهة
    const checkbox = event.target.closest('.lecture-checkbox').querySelector('.checkbox');
    if (AppState.progress[key] && AppState.progress[key].completed) {
        checkbox.classList.add('checked');
        checkbox.innerHTML = '<i class="fas fa-check"></i>';
        showNotification('تم تسجيل إكمال المحاضرة!', 'success');
    } else {
        checkbox.classList.remove('checked');
        checkbox.innerHTML = '';
        showNotification('تم إلغاء إكمال المحاضرة', 'info');
    }
    
    // تحديث نسبة التقدم
    updateClassProgress(teacherId, classIndex);
}

function updateClassProgress(teacherId, classIndex) {
    // إعادة تحميل صفحة المدرس لتحديث النسب
    if (AppState.currentTeacher) {
        loadTeacherPage(AppState.currentTeacher);
    }
}

function playLecture(url, title, description, teacherId, classIndex, lectureIndex) {
    document.getElementById('videoPlayer').src = url;
    document.getElementById('videoTitle').textContent = title;
    document.getElementById('videoDescription').textContent = description;
    
    // تحديث زر الإكمال
    const markCompletedBtn = document.getElementById('markCompleted');
    const isCompleted = isLectureCompleted(teacherId, classIndex, title);
    
    if (isCompleted) {
        markCompletedBtn.innerHTML = '<i class="fas fa-check"></i> تم الإكمال';
        markCompletedBtn.disabled = true;
        markCompletedBtn.classList.add('completed');
    } else {
        markCompletedBtn.innerHTML = '<i class="fas fa-check"></i> تم إكمال المحاضرة';
        markCompletedBtn.disabled = false;
        markCompletedBtn.classList.remove('completed');
    }
    
    showPage('videoPage');
    AppState.currentPage = 'video';
    AppState.currentLecture = {
        url, title, description, teacherId, classIndex, lectureIndex
    };
}

function markLectureCompleted() {
    if (!AppState.currentLecture) return;
    
    const { teacherId, classIndex, title } = AppState.currentLecture;
    const key = `${teacherId}_${classIndex}_${title}`;
    
    if (!AppState.progress[key]) {
        AppState.progress[key] = {
            completed: true,
            completedAt: new Date().toISOString()
        };
        
        localStorage.setItem('courseProgress', JSON.stringify(AppState.progress));
        
        // Show success message
        showNotification('تم تسجيل إكمال المحاضرة بنجاح!', 'success');
        
        // Update button
        const btn = document.getElementById('markCompleted');
        btn.innerHTML = '<i class="fas fa-check"></i> تم الإكمال';
        btn.disabled = true;
        btn.classList.add('completed');
    }
}

function isLectureCompleted(teacherId, classIndex, lectureTitle) {
    const key = `${teacherId}_${classIndex}_${lectureTitle}`;
    return AppState.progress[key] && AppState.progress[key].completed;
}

// Materials Page
function loadMaterialsPage() {
    if (!window.materialsData) {
        console.error('بيانات المواد غير متوفرة');
        return;
    }
    
    showPage('materialsPage');
    AppState.currentPage = 'materials';
    switchMaterialTab('summaries');
}

function switchMaterialTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Load content
    const content = document.getElementById('materialsContent');
    const data = window.materialsData[tabName] || [];
    
    content.innerHTML = '';
    
    data.forEach(item => {
        const card = createMaterialCard(item);
        content.appendChild(card);
    });
}

function createMaterialCard(item) {
    const card = document.createElement('div');
    card.className = 'material-card';
    
    card.innerHTML = `
        <img class="material-image" src="${item.image}" alt="${item.title}" onerror="this.src='https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg'">
        <div class="material-info">
            <h3>${item.title}</h3>
            <div class="material-subject">${item.subject}</div>
            <a href="${item.downloadUrl}" target="_blank" class="material-download">
                <i class="fas fa-download"></i>
                تحميل
            </a>
        </div>
    `;
    
    return card;
}

// Exams Page
function loadExamsPage() {
    if (!window.examsData) {
        console.error('بيانات الامتحانات غير متوفرة');
        return;
    }
    
    const examsList = document.getElementById('examsList');
    examsList.innerHTML = '';
    
    window.examsData.subjects.forEach(subject => {
        const subjectCard = createSubjectCard(subject);
        examsList.appendChild(subjectCard);
    });
    
    showPage('examsPage');
    AppState.currentPage = 'exams';
}

function createSubjectCard(subject) {
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.onclick = () => loadSubjectExams(subject);
    
    const icons = {
        'الفيزياء': 'fa-atom',
        'الكيمياء': 'fa-flask',
        'الأحياء': 'fa-dna',
        'الرياضيات': 'fa-calculator'
    };
    
    const icon = icons[subject.name] || 'fa-book';
    
    card.innerHTML = `
        <div class="subject-icon">
            <i class="fas ${icon}"></i>
        </div>
        <h3>${subject.name}</h3>
        <p>${subject.chapters ? subject.chapters.length : 0} فصل</p>
    `;
    
    return card;
}

function loadSubjectExams(subject) {
    document.getElementById('subjectName').textContent = `امتحانات ${subject.name}`;
    
    const chaptersList = document.getElementById('chaptersExamsList');
    chaptersList.innerHTML = '';
    
    if (subject.chapters) {
        subject.chapters.forEach(chapter => {
            const chapterElement = createChapterElement(chapter);
            chaptersList.appendChild(chapterElement);
        });
    }
    
    showPage('subjectExamsPage');
    AppState.currentPage = 'subjectExams';
    AppState.currentSubject = subject;
}

function createChapterElement(chapter) {
    const chapterElement = document.createElement('div');
    chapterElement.className = 'chapter-item';
    
    chapterElement.innerHTML = `
        <div class="chapter-header" onclick="toggleChapter(this)">
            <div class="chapter-title">${chapter.name}</div>
            <i class="fas fa-chevron-down class-icon"></i>
        </div>
        <div class="exams-list">
            ${chapter.exams ? chapter.exams.map(exam => `
                <div class="exam-item">
                    <div class="exam-info">
                        <h4>${exam.title}</h4>
                        <p>${exam.description}</p>
                    </div>
                    <a href="${exam.downloadUrl}" target="_blank" class="exam-download">
                        <i class="fas fa-download"></i>
                        تحميل
                    </a>
                </div>
            `).join('') : '<p>لا توجد امتحانات متاحة</p>'}
        </div>
    `;
    
    return chapterElement;
}

function toggleChapter(header) {
    const chapterItem = header.parentElement;
    chapterItem.classList.toggle('active');
}

// Utility Functions
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function goBack() {
    switch(AppState.currentPage) {
        case 'teachers':
            loadHomePage();
            break;
        case 'teacher':
            if (AppState.currentData) {
                loadTeachersPage(AppState.currentData, document.getElementById('pageTitle').textContent);
            } else {
                loadHomePage();
            }
            break;
        case 'video':
            if (AppState.currentTeacher) {
                loadTeacherPage(AppState.currentTeacher);
            } else {
                loadHomePage();
            }
            break;
        case 'materials':
        case 'exams':
            loadHomePage();
            break;
        case 'subjectExams':
            loadExamsPage();
            break;
        default:
            loadHomePage();
    }
}

function updateBackButton() {
    const backBtn = document.getElementById('backBtn');
    if (AppState.currentPage === 'home') {
        backBtn.style.display = 'none';
    } else {
        backBtn.style.display = 'inline-flex';
    }
}

function updateProgress(data) {
    if (!data || !data.teachers) return;
    
    let totalLectures = 0;
    let completedLectures = 0;
    
    data.teachers.forEach(teacher => {
        if (teacher.classes) {
            teacher.classes.forEach((classItem, classIndex) => {
                if (classItem.lectures) {
                    classItem.lectures.forEach(lecture => {
                        totalLectures++;
                        if (isLectureCompleted(teacher.id, classIndex, lecture.title)) {
                            completedLectures++;
                        }
                    });
                }
            });
        }
    });
    
    const progressPercent = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
    
    document.getElementById('progressText').textContent = `${progressPercent}% مكتمل`;
    document.getElementById('progressFill').style.width = `${progressPercent}%`;
}

function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add notification styles if not already present
    if (!document.querySelector('.notification-styles')) {
        const styles = document.createElement('style');
        styles.className = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: var(--bg-primary);
                color: var(--text-primary);
                padding: 1rem 1.5rem;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow-lg);
                display: flex;
                align-items: center;
                gap: 0.5rem;
                z-index: 1001;
                animation: slideInRight 0.3s ease;
            }
            .notification-success {
                border-left: 4px solid var(--success-color);
            }
            .notification-success i {
                color: var(--success-color);
            }
            .notification-info {
                border-left: 4px solid var(--primary-color);
            }
            .notification-info i {
                color: var(--primary-color);
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Telegram Modal Functions
function showTelegramModal() {
    if (!AppState.telegramModalShown) {
        document.getElementById('telegramModal').style.display = 'flex';
    }
}

function closeTelegramModal() {
    document.getElementById('telegramModal').style.display = 'none';
    AppState.telegramModalShown = true;
    localStorage.setItem('telegramModalShown', 'true');
}

// Performance optimizations
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimize scroll performance
let ticking = false;
function updateScrollPosition() {
    // Add scroll-based animations or effects here
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(updateScrollPosition);
        ticking = true;
    }
});

// Service Worker for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
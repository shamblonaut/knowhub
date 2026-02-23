export const MOCK_USERS = {
    "hod@bca.edu": {
        id: "mock-hod-1",
        email: "hod@bca.edu",
        name: "Dr. Alice HOD",
        role: "hod",
    },
    "faculty@bca.edu": {
        id: "mock-fac-1",
        email: "faculty@bca.edu",
        name: "Prof. John Faculty",
        role: "faculty",
    },
    "student@bca.edu": {
        id: "mock-stu-1",
        email: "student@bca.edu",
        name: "Bob Student",
        role: "student",
        semester: 4,
        usn: "1BC21CS001",
    }
};

export const MOCK_DATA = {
    "/auth/me/": null, // Will be set on login
    "/auth/login/": {
        access: "mock-access-token",
        refresh: "mock-refresh-token",
    },
    "/subjects/": [
        { id: 1, name: "Database Management Systems", code: "BCA401", semester: 4, faculty_id: "mock-fac-1", faculty_name: "Prof. John Faculty" },
        { id: 2, name: "Operating Systems", code: "BCA402", semester: 4, faculty_id: "mock-fac-2", faculty_name: "Prof. Smith" },
        { id: 3, name: "Software Engineering", code: "BCA403", semester: 4, faculty_id: "mock-hod-1", faculty_name: "Dr. Alice HOD" },
        { id: 4, name: "Computer Networks", code: "BCA404", semester: 4, faculty_id: "mock-fac-3", faculty_name: "Prof. Gupta" },
        { id: 5, name: "Java Programming", code: "BCA405", semester: 4, faculty_id: "mock-fac-1", faculty_name: "Prof. John Faculty" },
        { id: 6, name: "Python for Data Science", code: "BCA601", semester: 6, faculty_id: "mock-fac-2", faculty_name: "Prof. Smith" },
    ],
    "/semesters/": [1, 2, 3, 4, 5, 6],
    "/notices/": [
        {
            id: 1,
            title: "Internal Assessment Schedule",
            body: "The first internal assessment will begin from March 10th. Please check the notice board for detailed schedule.",
            is_pinned: true,
            is_new: true,
            created_at: new Date().toISOString(),
            posted_by_name: "Admin",
        },
        {
            id: 2,
            title: "Holiday Announcement",
            body: "The college will remain closed on Friday for the public holiday.",
            is_pinned: false,
            is_new: false,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            posted_by_name: "Dr. Alice (HOD)",
        },
        {
            id: 3,
            title: "Guest Lecture on Cloud Computing",
            body: "A guest lecture by industry experts is scheduled for next Wednesday at 10 AM in the Auditorium.",
            is_pinned: false,
            is_new: false,
            created_at: new Date(Date.now() - 172800000).toISOString(),
            posted_by_name: "Prof. Sharma",
        }
    ],
    "/resources/": [
        {
            id: 1,
            title: "DBMS Lecture Notes - Unit 1",
            description: "Introduction to Databases and ER Modeling",
            resource_type: "file",
            file_format: "pdf",
            subject_name: "Database Management Systems",
            subject_code: "BCA401",
            semester: 4,
            unit: "Unit 1",
            uploader_name: "Prof. Smith",
            uploader_role: "faculty",
            created_at: new Date().toISOString(),
            upload_date: new Date().toISOString(),
            indexing_status: "completed",
            download_count: 125,
            original_filename: "dbms_unit1.pdf",
        },
        {
            id: 2,
            title: "Operating Systems Previous Year Papers",
            description: "Collection of OS papers from 2020-2023",
            resource_type: "file",
            file_format: "zip",
            subject_name: "Operating Systems",
            subject_code: "BCA402",
            semester: 4,
            unit: "Misc",
            uploader_name: "Admin",
            uploader_role: "staff",
            created_at: new Date(Date.now() - 172800000).toISOString(),
            upload_date: new Date(Date.now() - 172800000).toISOString(),
            indexing_status: "completed",
            download_count: 89,
            original_filename: "os_papers.zip",
        },
        {
            id: 3,
            title: "Software Engineering Project Template",
            description: "Standard template for final year projects",
            resource_type: "file",
            file_format: "docx",
            subject_name: "Software Engineering",
            subject_code: "BCA403",
            semester: 4,
            unit: "Project",
            uploader_name: "Dr. Alice HOD",
            uploader_role: "hod",
            created_at: new Date(Date.now() - 259200000).toISOString(),
            upload_date: new Date(Date.now() - 259200000).toISOString(),
            indexing_status: "completed",
            download_count: 45,
            original_filename: "se_template.docx",
        },
        {
            id: 4,
            title: "Computer Networks Lab Manual",
            description: "TCP/IP and Socket Programming exercises",
            resource_type: "file",
            file_format: "pdf",
            subject_name: "Computer Networks",
            subject_code: "BCA404",
            semester: 4,
            unit: "Lab",
            uploader_name: "Prof. Gupta",
            uploader_role: "faculty",
            created_at: new Date(Date.now() - 345600000).toISOString(),
            upload_date: new Date(Date.now() - 345600000).toISOString(),
            indexing_status: "completed",
            download_count: 112,
            original_filename: "cn_lab.pdf",
        }
    ],
    "/resources/my-submissions/": [
        {
            id: 10,
            title: "Data Structures - Assignment 1",
            description: "Implementation of Linked Lists and Trees",
            resource_type: "file",
            file_format: "pdf",
            subject_code: "BCA201",
            status: "pending",
            indexing_status: "processing",
            upload_date: new Date().toISOString(),
        },
        {
            id: 11,
            title: "Web Tech Project Proposal",
            description: "Proposal for E-commerce platform",
            resource_type: "url",
            file_format: null,
            subject_code: "BCA401",
            status: "approved",
            indexing_status: "completed",
            upload_date: new Date(Date.now() - 86400000).toISOString(),
            url: "https://docs.google.com/presentation/d/...",
        },
        {
            id: 12,
            title: "C language lab programs",
            description: "Complete set of lab programs",
            resource_type: "file",
            file_format: "zip",
            subject_code: "BCA101",
            status: "rejected",
            indexing_status: "failed",
            upload_date: new Date(Date.now() - 259200000).toISOString(),
        }
    ],
    "/resources/pending/": [
        {
            id: 101,
            title: "Machine Learning Assignment",
            description: "Submitted by Student for review",
            resource_type: "file",
            file_format: "pdf",
            subject_code: "BCA601",
            uploader_name: "John Doe",
            semester: 6,
            created_at: new Date().toISOString(),
            upload_date: new Date().toISOString(),
            indexing_status: "processing",
        }
    ],
    "/analytics/summary/": {
        total_resources: 156,
        total_users: 450,
        total_students: 400,
        total_faculty: 50,
        total_downloads: 1240,
        pending_approvals: 12,
        active_notices: 8
    },
    "/analytics/uploads-by-semester/": [
        { semester: 1, count: 20 },
        { semester: 2, count: 15 },
        { semester: 3, count: 35 },
        { semester: 4, count: 45 },
        { semester: 5, count: 25 },
        { semester: 6, count: 16 }
    ],
    "/analytics/top-resources/": [
        { id: 1, title: "DBMS Lecture Notes", download_count: 125 },
        { id: 4, title: "Computer Networks Lab Manual", download_count: 112 },
        { id: 2, title: "OS Previous Year Papers", download_count: 89 }
    ],
    "/analytics/faculty-activity/": [
        { name: "Prof. Smith", uploads: 24, approvals: 15 },
        { name: "Dr. Alice HOD", uploads: 12, approvals: 85 },
        { name: "Prof. Gupta", uploads: 18, approvals: 10 }
    ],
    "/analytics/uploads-by-format/": [
        { format: "pdf", count: 85 },
        { format: "docx", count: 30 },
        { format: "zip", count: 15 },
        { format: "pptx", count: 26 }
    ],
    "/auth/users/": [
        { id: "mock-fac-1", name: "Prof. John Faculty", email: "faculty@bca.edu", role: "faculty", is_active: true },
        { id: "mock-fac-2", name: "Prof. Smith", email: "smith@bca.edu", role: "faculty", is_active: true },
        { id: "mock-fac-3", name: "Prof. Gupta", email: "gupta@bca.edu", role: "faculty", is_active: false },
    ],
    "/search/": [], // Handled by logic
};

export const getMockResponse = (url, params = {}) => {
    console.log(`Mock intercepted: ${url}`, params);

    // Persist mock user selection in session storage
    const getActiveUser = () => {
        const saved = sessionStorage.getItem("mock_user_email");
        return MOCK_USERS[saved] || MOCK_USERS["hod@bca.edu"];
    };

    // Handle Login (Set Active User)
    if (url.includes("/auth/login/")) {
        const email = params.email || "hod@bca.edu";
        console.log(`Mock Login attempt for: ${email}`);
        sessionStorage.setItem("mock_user_email", email);
        const user = MOCK_USERS[email] || MOCK_USERS["hod@bca.edu"];
        return {
            data: {
                ...MOCK_DATA["/auth/login/"],
                user: user
            },
            status: 200
        };
    }

    // Handle Me
    if (url.includes("/auth/me/")) {
        return { data: getActiveUser(), status: 200 };
    }

    // Handle Specific Resource Detail
    const resourceDetailMatch = url.match(/\/resources\/(\d+)\//);
    if (resourceDetailMatch) {
        const id = parseInt(resourceDetailMatch[1]);
        const resource = MOCK_DATA["/resources/"].find(r => r.id === id);
        return { data: resource || MOCK_DATA["/resources/"][0], status: 200 };
    }

    // Handle Recommendations
    if (url.includes("/search/recommend/")) {
        const results = MOCK_DATA["/resources/"].slice(0, 2);
        return { data: { results, count: results.length }, status: 200 };
    }

    // Handle Search
    if (url.includes("/search/")) {
        const q = params.q?.toLowerCase() || "";
        const results = MOCK_DATA["/resources/"].filter(r => 
            r.title.toLowerCase().includes(q) || 
            r.description.toLowerCase().includes(q)
        );
        return { data: { results, count: results.length }, status: 200 };
    }

    // Basic path matching (sorted by specificity)
    const sortedPaths = Object.keys(MOCK_DATA).sort((a, b) => b.length - a.length);
    const path = sortedPaths.find(p => url.includes(p));
    if (path) {
        const data = MOCK_DATA[path];
        
        // Wrap analytics list endpoints in { data: [...] }
        const analyticsListPaths = [
            "/analytics/uploads-by-semester/",
            "/analytics/top-resources/",
            "/analytics/faculty-activity/",
            "/analytics/uploads-by-format/"
        ];
        if (Array.isArray(data) && analyticsListPaths.some(p => url.includes(p))) {
            return { data: { data: data }, status: 200 };
        }

        // Wrap arrays in paginated structure for known paginated endpoints
        const paginatedPaths = ["/resources/", "/subjects/", "/notices/", "/search/"];
        if (Array.isArray(data) && paginatedPaths.some(p => url.includes(p))) {
            return {
                data: {
                    results: data,
                    count: data.length,
                    next: null,
                    previous: null
                },
                status: 200
            };
        }

        // Special case for semesters
        if (url.includes("/semesters/")) {
            return { data: { semesters: data }, status: 200 };
        }

        return { data: data, status: 200 };
    }

    return null;
};

export const MOCK_RAG_RESPONSE = [
    "I am currently in Demo Mode because I couldn't reach the backend server.",
    " In this mode, I can still show you how the UI works and provide pre-defined mock responses.",
    " Once the backend is online, I will be able to answer your questions by searching through your actual documents.",
    " How can I help you explore the interface today?"
];

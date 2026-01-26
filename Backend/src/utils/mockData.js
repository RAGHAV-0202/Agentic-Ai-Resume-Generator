export const MOCK_RESUME_DATA = {
    personal: {
        name: "John Doe",
        location: "San Francisco, CA",
        email: "john.doe@example.com",
        phone: "+1 (555) 123-4567",
        linkedin: "linkedin.com/in/johndoe",
        github: "github.com/johndoe",
        website: "johndoe.dev",
    },
    education: [
        {
            institution: "University of California, Berkeley",
            degree: "Bachelor of Science in Computer Science",
            startDate: "2018",
            endDate: "2022",
            gpa: "3.8/4.0",
            coursework: ["Data Structures", "Algorithms", "Machine Learning", "Web Development"],
        },
    ],
    experience: [
        {
            company: "Tech Innovations Inc.",
            position: "Software Engineer",
            location: "San Francisco, CA",
            startDate: "June 2022",
            endDate: "Present",
            highlights: [
                "Developed full-stack web applications using React and Node.js",
                "Improved application performance by 40% through optimization",
                "Led a team of 3 junior developers on key projects",
            ],
        },
    ],
    projects: [
        {
            name: "E-Commerce Platform",
            link: "github.com/johndoe/ecommerce",
            date: "2022",
            highlights: [
                "Built a scalable e-commerce platform with payment integration",
                "Implemented real-time inventory management",
            ],
            technologies: ["React", "Node.js", "MongoDB", "Stripe"],
        },
        {
            name: "Task Management App",
            link: "github.com/johndoe/taskmanager",
            date: "2021",
            highlights: [
                "Created a collaborative task management tool with real-time updates",
            ],
            technologies: ["Vue.js", "Firebase", "Tailwind CSS"],
        },
    ],
    achievements: [
        "Winner of the 2023 Global Hackathon (1st out of 500+ teams)",
        "Dean's List for 4 consecutive semesters (Top 5% of class)",
        "Solved 300+ Algorithmic problems on LeetCode"
    ],
    skills: {
        languages: ["JavaScript", "Python", "Java", "TypeScript"],
        technologies: ["React", "Node.js", "Express", "MongoDB", "PostgreSQL", "Docker", "AWS"],
    },
    publications: [],
};

// Mock Data for Coordinator Coding Practice Management and Super Admin Coding Practice Monitoring
// Designed for seamless replacement with backend APIs (e.g. GET /api/coding-problems, POST /api/assignments, etc.)

export const initialCodingProblems = [
  {
    id: "prob-001",
    title: "Two Sum Target Index Pair",
    topic: "Arrays & Hashing",
    difficulty: "Easy",
    points: 100,
    timeLimit: "1.0s",
    memoryLimit: "256MB",
    status: "Active",
    createdDate: "2026-08-15",
    createdBy: "Coordinator Alok Mishra",
    college: "Apex Institute of Technology",
    acceptanceRate: "78.4%",
    totalSubmissions: 420,
    tags: ["Array", "Hash Table", "Two Pointers"],
    companies: ["TCS", "Infosys", "Amazon"],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice. You can return the answer in any order.`,
    inputFormat: "First line contains N elements space-separated. Second line contains the target integer.",
    outputFormat: "Print two space-separated indices (0-indexed).",
    sampleInput: "2 7 11 15\n9",
    sampleOutput: "0 1",
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
      python: `def two_sum(nums, target):\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    import sys\n    lines = sys.stdin.read().splitlines()\n    nums = list(map(int, lines[0].split()))\n    target = int(lines[1])\n    print(*two_sum(nums, target))`,
      java: `import java.util.*;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write solution here\n    }\n}`
    },
    testCases: [
      { id: "tc-1", input: "2 7 11 15\n9", expectedOutput: "0 1", isHidden: false, description: "Basic sample case" },
      { id: "tc-2", input: "3 2 4\n6", expectedOutput: "1 2", isHidden: false, description: "Non-sorted array" },
      { id: "tc-3", input: "3 3\n6", expectedOutput: "0 1", isHidden: true, description: "Duplicate values" },
      { id: "tc-4", input: "-1 -3 4 8\n5", expectedOutput: "1 3", isHidden: true, description: "Negative numbers included" }
    ]
  },
  {
    id: "prob-002",
    title: "Longest Substring Without Repeating Characters",
    topic: "Sliding Window",
    difficulty: "Medium",
    points: 200,
    timeLimit: "1.5s",
    memoryLimit: "256MB",
    status: "Active",
    createdDate: "2026-08-18",
    createdBy: "Coordinator Alok Mishra",
    college: "Apex Institute of Technology",
    acceptanceRate: "54.2%",
    totalSubmissions: 310,
    tags: ["Sliding Window", "String", "Hash Table"],
    companies: ["Wipro", "Capgemini", "Google"],
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
    inputFormat: "Single line containing string S.",
    outputFormat: "Integer representing length of longest unique substring.",
    sampleInput: "abcabcbb",
    sampleOutput: "3",
    starterCode: {
      cpp: `#include <iostream>\n#include <string>\n#include <unordered_set>\nusing namespace std;\n\nint main() {\n    return 0;\n}`,
      python: `def length_of_longest_substring(s):\n    pass`,
      java: `public class Solution {\n    public static void main(String[] args) {}\n}`
    },
    testCases: [
      { id: "tc-1", input: "abcabcbb", expectedOutput: "3", isHidden: false, description: "Sample 1" },
      { id: "tc-2", input: "bbbbb", expectedOutput: "1", isHidden: false, description: "All identical characters" },
      { id: "tc-3", input: "pwwkew", expectedOutput: "3", isHidden: true, description: "Subsequence vs substring" }
    ]
  },
  {
    id: "prob-003",
    title: "Reverse Linked List In-Place",
    topic: "Linked List",
    difficulty: "Easy",
    points: 120,
    timeLimit: "1.0s",
    memoryLimit: "256MB",
    status: "Active",
    createdDate: "2026-08-20",
    createdBy: "Prof. Sunita Rao",
    college: "Meridian Engineering College",
    acceptanceRate: "82.1%",
    totalSubmissions: 540,
    tags: ["Linked List", "Recursion", "Two Pointers"],
    companies: ["Cognizant", "TCS", "Accenture"],
    description: `Given the head of a singly linked list represented as space-separated node values, reverse the list in-place and return the reversed list.`,
    inputFormat: "Space-separated list of node values.",
    outputFormat: "Reversed space-separated node values.",
    sampleInput: "1 2 3 4 5",
    sampleOutput: "5 4 3 2 1",
    starterCode: {
      python: `def reverse_list(head):\n    pass`,
      cpp: `// Reverse linked list\n`
    },
    testCases: [
      { id: "tc-1", input: "1 2 3 4 5", expectedOutput: "5 4 3 2 1", isHidden: false, description: "Standard list" },
      { id: "tc-2", input: "1 2", expectedOutput: "2 1", isHidden: false, description: "Two elements" }
    ]
  },
  {
    id: "prob-004",
    title: "Binary Tree Level Order Traversal",
    topic: "Trees & Graphs",
    difficulty: "Medium",
    points: 180,
    timeLimit: "2.0s",
    memoryLimit: "512MB",
    status: "Active",
    createdDate: "2026-08-22",
    createdBy: "Dr. Amit Patel",
    college: "Vanguard Academy of Science",
    acceptanceRate: "61.5%",
    totalSubmissions: 280,
    tags: ["Tree", "BFS", "Queue"],
    companies: ["Microsoft", "Amazon", "Oracle"],
    description: `Given the root of a binary tree in level order representation, return the level order traversal of its nodes' values (i.e., from left to right, level by level).`,
    inputFormat: "Level order tree representation with 'null' for missing children.",
    outputFormat: "Level order array per line.",
    sampleInput: "3 9 20 null null 15 7",
    sampleOutput: "[3]\n[9, 20]\n[15, 7]",
    starterCode: {
      python: `def level_order(root):\n    pass`
    },
    testCases: [
      { id: "tc-1", input: "3 9 20 null null 15 7", expectedOutput: "[3]\n[9, 20]\n[15, 7]", isHidden: false, description: "Standard BFS" }
    ]
  },
  {
    id: "prob-005",
    title: "Merge K Sorted Lists via Priority Queue",
    topic: "Heap / Priority Queue",
    difficulty: "Hard",
    points: 300,
    timeLimit: "2.5s",
    memoryLimit: "512MB",
    status: "Active",
    createdDate: "2026-08-25",
    createdBy: "Coordinator Alok Mishra",
    college: "Apex Institute of Technology",
    acceptanceRate: "41.0%",
    totalSubmissions: 195,
    tags: ["Heap", "Priority Queue", "Divide & Conquer"],
    companies: ["Goldman Sachs", "Google", "Uber"],
    description: `You are given an array of \`k\` linked-lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.`,
    inputFormat: "First line K. Next K lines contain space-separated sorted list elements.",
    outputFormat: "Single line containing merged sorted elements.",
    sampleInput: "3\n1 4 5\n1 3 4\n2 6",
    sampleOutput: "1 1 2 3 4 4 5 6",
    starterCode: {
      python: `def merge_k_lists(lists):\n    pass`
    },
    testCases: [
      { id: "tc-1", input: "3\n1 4 5\n1 3 4\n2 6", expectedOutput: "1 1 2 3 4 4 5 6", isHidden: false, description: "3 Lists merge" }
    ]
  }
];

export const initialAssignments = [
  {
    id: "assign-101",
    problemId: "prob-001",
    problemTitle: "Two Sum Target Index Pair",
    difficulty: "Easy",
    department: "Computer Science",
    batch: "CSE 2026 Alpha Cohort",
    assignedDate: "2026-08-28",
    dueDate: "2026-09-10",
    totalStudents: 120,
    submittedCount: 94,
    passCount: 88,
    scoreWeightage: 100,
    instructions: "Solve using O(N) HashMap approach. Submissions with O(N^2) will be flagged for memory optimization.",
    status: "Active"
  },
  {
    id: "assign-102",
    problemId: "prob-002",
    problemTitle: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    department: "Computer Science",
    batch: "CSE 2026 Alpha Cohort",
    assignedDate: "2026-09-01",
    dueDate: "2026-09-12",
    totalStudents: 120,
    submittedCount: 65,
    passCount: 52,
    scoreWeightage: 200,
    instructions: "Apply the 2-pointer sliding window technique. Submit before the Friday coding review session.",
    status: "Active"
  },
  {
    id: "assign-103",
    problemId: "prob-003",
    problemTitle: "Reverse Linked List In-Place",
    difficulty: "Easy",
    department: "Information Technology",
    batch: "Fullstack Web Dev Batch #4",
    assignedDate: "2026-08-25",
    dueDate: "2026-09-05",
    totalStudents: 95,
    submittedCount: 91,
    passCount: 86,
    scoreWeightage: 120,
    instructions: "Implement iteratively without auxiliary memory allocation.",
    status: "Completed"
  },
  {
    id: "assign-104",
    problemId: "prob-005",
    problemTitle: "Merge K Sorted Lists via Priority Queue",
    difficulty: "Hard",
    department: "AI & DS",
    batch: "Data Science & ML 2025",
    assignedDate: "2026-09-02",
    dueDate: "2026-09-15",
    totalStudents: 110,
    submittedCount: 42,
    passCount: 35,
    scoreWeightage: 300,
    instructions: "Use min-heap logic to achieve O(N log K) complexity.",
    status: "Active"
  }
];

export const initialSubmissions = [
  {
    id: "sub-901",
    studentName: "Ananya Sharma",
    rollNo: "CSE26-009",
    batch: "CSE 2026 Alpha Cohort",
    department: "CSE",
    problemId: "prob-001",
    problemTitle: "Two Sum Target Index Pair",
    language: "C++",
    status: "Accepted",
    score: 100,
    passedTestCases: 4,
    totalTestCases: 4,
    runtime: "12ms",
    memory: "14.2MB",
    submittedAt: "2026-09-04 10:15 AM",
    codeSnippet: `#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nint main() {\n    unordered_map<int, int> mp;\n    int n, target;\n    cin >> n;\n    // O(N) Hash map solution\n    return 0;\n}`
  },
  {
    id: "sub-902",
    studentName: "Aarav Mehta",
    rollNo: "CSE26-042",
    batch: "CSE 2026 Alpha Cohort",
    department: "CSE",
    problemId: "prob-002",
    problemTitle: "Longest Substring Without Repeating Characters",
    language: "Python",
    status: "Accepted",
    score: 200,
    passedTestCases: 3,
    totalTestCases: 3,
    runtime: "18ms",
    memory: "16.4MB",
    submittedAt: "2026-09-04 11:30 AM",
    codeSnippet: `def length_of_longest_substring(s):\n    char_map = {}\n    left = max_len = 0\n    for right, c in enumerate(s):\n        if c in char_map and char_map[c] >= left:\n            left = char_map[c] + 1\n        char_map[c] = right\n        max_len = max(max_len, right - left + 1)\n    return max_len`
  },
  {
    id: "sub-903",
    studentName: "Priya Roy",
    rollNo: "DS25-012",
    batch: "Data Science & ML 2025",
    department: "AI & DS",
    problemId: "prob-005",
    problemTitle: "Merge K Sorted Lists via Priority Queue",
    language: "Python",
    status: "Accepted",
    score: 300,
    passedTestCases: 1,
    totalTestCases: 1,
    runtime: "42ms",
    memory: "21.0MB",
    submittedAt: "2026-09-04 02:45 PM",
    codeSnippet: `import heapq\n\ndef merge_k_lists(lists):\n    heap = []\n    # Heap implementation`
  },
  {
    id: "sub-904",
    studentName: "Neha Reddy",
    rollNo: "DS25-018",
    batch: "Data Science & ML 2025",
    department: "AI & DS",
    problemId: "prob-005",
    problemTitle: "Merge K Sorted Lists via Priority Queue",
    language: "Java",
    status: "Time Limit Exceeded",
    score: 60,
    passedTestCases: 2,
    totalTestCases: 4,
    runtime: "> 2500ms",
    memory: "48.5MB",
    submittedAt: "2026-09-04 04:10 PM",
    codeSnippet: `// Nested loop approach causing TLE on high K`
  },
  {
    id: "sub-905",
    studentName: "Karan Singh",
    rollNo: "IT26-033",
    batch: "Fullstack Web Dev Batch #4",
    department: "IT",
    problemId: "prob-003",
    problemTitle: "Reverse Linked List In-Place",
    language: "JavaScript",
    status: "Wrong Answer",
    score: 0,
    passedTestCases: 0,
    totalTestCases: 2,
    runtime: "8ms",
    memory: "12.1MB",
    submittedAt: "2026-09-03 09:20 PM",
    codeSnippet: `// Off by one error in pointer reassignment`
  }
];

export const globalCodingStats = {
  totalPlatformProblems: 184,
  totalSubmissionsCount: "28,450",
  avgPlatformAccuracy: "74.8%",
  activeCodersCount: 3420,
  topLanguage: "C++ (46%)",
  collegesCount: 18
};

export const collegeWiseCodingPerformance = [
  {
    id: 1,
    collegeName: "Apex Institute of Technology",
    location: "Bangalore",
    activeCoders: 420,
    totalProblemsSolved: 4850,
    totalSubmissions: 6200,
    accuracyRate: 78.2,
    topLanguage: "C++",
    easySolved: 2200,
    mediumSolved: 1950,
    hardSolved: 700,
    status: "Top Performer"
  },
  {
    id: 2,
    collegeName: "Padmabhushan Vasantdada Patil College of Engineering & VA",
    location: "Mumbai",
    activeCoders: 520,
    totalProblemsSolved: 5900,
    totalSubmissions: 7400,
    accuracyRate: 79.7,
    topLanguage: "Python",
    easySolved: 2600,
    mediumSolved: 2400,
    hardSolved: 900,
    status: "Top Performer"
  },
  {
    id: 3,
    collegeName: "Vanguard Academy of Science",
    location: "Pune",
    activeCoders: 510,
    totalProblemsSolved: 4400,
    totalSubmissions: 5900,
    accuracyRate: 74.5,
    topLanguage: "C++",
    easySolved: 2100,
    mediumSolved: 1800,
    hardSolved: 500,
    status: "Good"
  },
  {
    id: 4,
    collegeName: "Global Institute of Computer Applications",
    location: "Delhi NCR",
    activeCoders: 630,
    totalProblemsSolved: 5100,
    totalSubmissions: 7100,
    accuracyRate: 71.8,
    topLanguage: "Java",
    easySolved: 2500,
    mediumSolved: 2000,
    hardSolved: 600,
    status: "Good"
  },
  {
    id: 5,
    collegeName: "Meridian Engineering College",
    location: "Hyderabad",
    activeCoders: 380,
    totalProblemsSolved: 3100,
    totalSubmissions: 4500,
    accuracyRate: 68.8,
    topLanguage: "Python",
    easySolved: 1600,
    mediumSolved: 1100,
    hardSolved: 400,
    status: "Average"
  },
  {
    id: 6,
    collegeName: "St. Xavier Technical Campus",
    location: "Mumbai",
    activeCoders: 290,
    totalProblemsSolved: 2100,
    totalSubmissions: 3300,
    accuracyRate: 63.6,
    topLanguage: "Java",
    easySolved: 1200,
    mediumSolved: 700,
    hardSolved: 200,
    status: "Needs Attention"
  }
];

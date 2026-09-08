export const initialCodingProblems = [
  {
    id: "prob-1",
    title: "Two Sum II - Input Array Is Sorted",
    topic: "Arrays & Two Pointers",
    difficulty: "Easy",
    xp: 50,
    companies: ["TCS", "Infosys", "Wipro"],
    timeLimit: "1.0s",
    memoryLimit: "128 MB",
    description: "Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number.",
    starterCode: {
      cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& numbers, int target) {\n        // Write your solution here\n    }\n};",
      python: "class Solution:\n    def twoSum(self, numbers: list[int], target: int) -> list[int]:\n        pass",
      java: "class Solution {\n    public int[] twoSum(int[] numbers, int target) {\n        return new int[]{};\n    }\n}"
    },
    testCases: [
      { id: "tc-1", input: "numbers = [2,7,11,15], target = 9", output: "[1,2]", isHidden: false },
      { id: "tc-2", input: "numbers = [2,3,4], target = 6", output: "[1,3]", isHidden: false },
      { id: "tc-3", input: "numbers = [-1,0], target = -1", output: "[1,2]", isHidden: true }
    ]
  },
  {
    id: "prob-2",
    title: "Longest Substring Without Repeating Characters",
    topic: "Sliding Window",
    difficulty: "Medium",
    xp: 100,
    companies: ["Amazon", "TCS Digital", "Accenture"],
    timeLimit: "2.0s",
    memoryLimit: "256 MB",
    description: "Given a string s, find the length of the longest substring without repeating characters.",
    starterCode: {
      cpp: "#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write solution\n    }\n};",
      python: "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        pass",
      java: "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n}"
    },
    testCases: [
      { id: "tc-201", input: "s = \"abcabcbb\"", output: "3", isHidden: false },
      { id: "tc-202", input: "s = \"bbbbb\"", output: "1", isHidden: false },
      { id: "tc-203", input: "s = \"pwwkew\"", output: "3", isHidden: true }
    ]
  },
  {
    id: "prob-3",
    title: "Merge k Sorted Lists",
    topic: "Heaps & Divide and Conquer",
    difficulty: "Hard",
    xp: 200,
    companies: ["Google", "Microsoft", "Goldman Sachs"],
    timeLimit: "3.0s",
    memoryLimit: "512 MB",
    description: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.",
    starterCode: {
      cpp: "// Definition for singly-linked list.\nstruct ListNode {\n    int val;\n    ListNode *next;\n};\nclass Solution {\npublic:\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n    }\n};",
      python: "class Solution:\n    def mergeKLists(self, lists: list[Optional[ListNode]]) -> Optional[ListNode]:\n        pass",
      java: "class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        return null;\n    }\n}"
    },
    testCases: [
      { id: "tc-301", input: "lists = [[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,3,4,4,5,6]", isHidden: false },
      { id: "tc-302", input: "lists = []", output: "[]", isHidden: true }
    ]
  }
];

export const activeAssignments = [
  {
    id: "assign-1",
    title: "Two Sum II - Input Array Is Sorted",
    batch: "CSE 2026 Alpha Cohort",
    department: "Computer Science",
    dueDate: "2026-09-12",
    weightage: "10 Marks",
    submitted: 42,
    totalStudents: 50,
    passed: 38,
    instructions: "Solve using O(N) time and O(1) extra memory."
  },
  {
    id: "assign-2",
    title: "Longest Substring Without Repeating Characters",
    batch: "IT 2026 Beta Cohort",
    department: "Information Technology",
    dueDate: "2026-09-15",
    weightage: "15 Marks",
    submitted: 28,
    totalStudents: 45,
    passed: 24,
    instructions: "Sliding window technique required."
  }
];

export const studentSubmissions = [
  {
    id: "sub-1",
    studentName: "Aarav Sharma",
    rollNo: "CSE-2026-001",
    batch: "CSE 2026 Alpha",
    problemTitle: "Two Sum II - Input Array Is Sorted",
    language: "C++",
    status: "Accepted",
    executionTime: "12 ms",
    memoryUsed: "14.2 MB",
    submittedAt: "10 min ago",
    codeSnippet: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& numbers, int target) {\n        int left = 0, right = numbers.size() - 1;\n        while (left < right) {\n            int sum = numbers[left] + numbers[right];\n            if (sum == target) return {left + 1, right + 1};\n            else if (sum < target) left++;\n            else right--;\n        }\n        return {};\n    }\n};`
  },
  {
    id: "sub-2",
    studentName: "Riya Patel",
    rollNo: "CSE-2026-014",
    batch: "CSE 2026 Alpha",
    problemTitle: "Longest Substring Without Repeating Characters",
    language: "Python",
    status: "Accepted",
    executionTime: "45 ms",
    memoryUsed: "16.8 MB",
    submittedAt: "25 min ago",
    codeSnippet: `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        char_map = {}\n        left = 0\n        max_len = 0\n        for right, char in enumerate(s):\n            if char in char_map and char_map[char] >= left:\n                left = char_map[char] + 1\n            char_map[char] = right\n            max_len = max(max_len, right - left + 1)\n        return max_len`
  },
  {
    id: "sub-3",
    studentName: "Rohan Kulkarni",
    rollNo: "CSE-2026-045",
    batch: "CSE 2026 Beta",
    problemTitle: "Merge k Sorted Lists",
    language: "Java",
    status: "Time Limit Exceeded",
    executionTime: "3000 ms",
    memoryUsed: "42.1 MB",
    submittedAt: "1 hour ago",
    codeSnippet: `// Naive linear search solution causing TLE\nclass Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        // Implementation...\n        return null;\n    }\n}`
  },
  {
    id: "sub-4",
    studentName: "Ananya Iyer",
    rollNo: "IT-2026-031",
    batch: "IT 2026 Beta",
    problemTitle: "Two Sum II - Input Array Is Sorted",
    language: "C++",
    status: "Wrong Answer",
    executionTime: "8 ms",
    memoryUsed: "13.9 MB",
    submittedAt: "2 hours ago",
    codeSnippet: `// Off by one index error in 1-based indexing\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& numbers, int target) {\n        return {0, 1};\n    }\n};`
  }
];

export const globalPlatformStats = {
  totalProblems: 184,
  totalSubmissions: "28,450",
  accuracyRate: "74.8%",
  activeCoders: "3,420",
  topLanguage: "C++",
  languageDistribution: [
    { name: "C++", percentage: 46, color: "#3b82f6" },
    { name: "Python", percentage: 38, color: "#10b981" },
    { name: "Java", percentage: 12, color: "#f59e0b" },
    { name: "JavaScript", percentage: 4, color: "#8b5cf6" }
  ],
  verdictRatios: [
    { name: "Accepted", percentage: 74.8, color: "#10b981" },
    { name: "Wrong Answer", percentage: 15.2, color: "#ef4444" },
    { name: "Time Limit Exceeded", percentage: 7.0, color: "#f59e0b" },
    { name: "Runtime Error", percentage: 3.0, color: "#6b7280" }
  ]
};

export const collegePerformanceList = [
  {
    id: "col-1",
    collegeName: "Apex Institute of Technology",
    activeCoders: 1240,
    problemsSolved: { easy: 4500, medium: 2800, hard: 650 },
    totalSubmissions: "12,450",
    accuracyRate: "78.2%",
    topLanguage: "C++",
    status: "Top Performer"
  },
  {
    id: "col-2",
    collegeName: "PVPPCOE Mumbai",
    activeCoders: 980,
    problemsSolved: { easy: 3900, medium: 2100, hard: 420 },
    totalSubmissions: "9,800",
    accuracyRate: "73.5%",
    topLanguage: "Python",
    status: "Good"
  },
  {
    id: "col-3",
    collegeName: "Meridian College of Engineering",
    activeCoders: 650,
    problemsSolved: { easy: 2400, medium: 1100, hard: 180 },
    totalSubmissions: "4,200",
    accuracyRate: "69.1%",
    topLanguage: "Java",
    status: "Needs Support"
  },
  {
    id: "col-4",
    collegeName: "Vanguard Institute",
    activeCoders: 550,
    problemsSolved: { easy: 1800, medium: 950, hard: 140 },
    totalSubmissions: "2,000",
    accuracyRate: "71.4%",
    topLanguage: "C++",
    status: "Good"
  }
];

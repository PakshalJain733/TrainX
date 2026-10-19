import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../src/config/jwt.js';

const studentPayload = {
  userId: 6,
  id: 6,
  role: 'student',
  email: 'vu3f2425047@pvppcoe.ac.in',
  tokenType: 'access',
};

const token = jwt.sign(studentPayload, getJwtSecret(), { expiresIn: '1h' });

console.log('--- Testing Python Two Sum Submission ---');
const pyCode = `
import sys
tokens = sys.stdin.read().strip().split()
if len(tokens) >= 2:
    n = int(tokens[0])
    target = int(tokens[1])
    nums = [int(x) for x in tokens[2:]]
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            print(f"{seen[diff]} {i}")
            break
        seen[num] = i
`;

const pyRes = await fetch('http://localhost:5000/api/v1/code/submit', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    problem_id: 1,
    language: 'python',
    code: pyCode,
  }),
});
const pyData = await pyRes.json();
console.log('Python Status:', pyRes.status);
console.log('Python Verdict:', pyData.data?.status);
console.log('Python Passed:', `${pyData.data?.passed_tests}/${pyData.data?.total_tests}`);

console.log('\n--- Testing Java Two Sum Submission ---');
const javaCode = `
import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int target = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = sc.nextInt();
        }
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < n; i++) {
            int diff = target - nums[i];
            if (map.containsKey(diff)) {
                System.out.println(map.get(diff) + " " + i);
                return;
            }
            map.put(nums[i], i);
        }
    }
}
`;

const javaRes = await fetch('http://localhost:5000/api/v1/code/submit', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    problem_id: 1,
    language: 'java',
    code: javaCode,
  }),
});
const javaData = await javaRes.json();
console.log('Java Status:', javaRes.status);
console.log('Java Verdict:', javaData.data?.status);
console.log('Java Passed:', `${javaData.data?.passed_tests}/${javaData.data?.total_tests}`);

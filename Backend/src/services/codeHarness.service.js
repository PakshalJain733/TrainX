/**
 * Language Test Harness for LeetCode-style function-based execution.
 *
 * For problems specifying a `function_name`, wraps the user's function body with
 * a driver harness that deserializes test case arguments from stdin, invokes the
 * target function, and serializes the return value to stdout.
 *
 * Fully backward-compatible: If `function_name` is absent or the user code already
 * includes a `main` entrypoint, the code is passed through untouched (Legacy Script Mode).
 */

/**
 * Checks whether user code should be wrapped with a function-based harness.
 */
export function shouldWrapFunction(language, code, functionName) {
  if (!functionName || typeof functionName !== 'string' || !functionName.trim()) {
    return false;
  }
  const cleanCode = String(code || '').trim();
  if (!cleanCode) return false;

  const l = String(language || '').toLowerCase().trim();

  // Python: Check for existing main or direct execution block
  if (l.includes('py')) {
    if (/if\s+__name__\s*==\s*['"]__main__['"]/.test(cleanCode) || /def\s+main\s*\(/.test(cleanCode)) {
      return false;
    }
    return true;
  }

  // Node.js / JavaScript
  if (l.includes('node') || l.includes('js') || l.includes('script') || l.includes('ts')) {
    if (/\bfunction\s+main\s*\(/.test(cleanCode) || /\bconst\s+main\s*=/.test(cleanCode) || /\bmain\(\)/.test(cleanCode)) {
      return false;
    }
    return true;
  }

  // Java
  if (l.includes('java')) {
    if (/\bpublic\s+static\s+void\s+main\s*\(/.test(cleanCode)) {
      return false;
    }
    return true;
  }

  // C++ / C
  if (l === 'c' || l.includes('cpp') || l.includes('c++')) {
    if (/\bint\s+main\s*\(/.test(cleanCode) || /\bvoid\s+main\s*\(/.test(cleanCode)) {
      return false;
    }
    return true;
  }

  return false;
}

/**
 * Wraps user function in Node.js / JavaScript.
 */
function wrapNodeHarness(code, functionName) {
  const fn = functionName.trim();
  return `
${code}

// ── TrainX Unified LeetCode Harness (Node.js) ──
(function() {
  const fs = require('fs');
  const rawInput = fs.readFileSync(0, 'utf-8').trim();

  function parseInput(raw) {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [parsed];
    } catch (e) {
      // Split by lines or commas if JSON parsing fails
      const lines = raw.split(/\\r?\\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        return lines.map(line => {
          try { return JSON.parse(line); } catch (_) { return line; }
        });
      }
      return [raw];
    }
  }

  let targetFn = null;
  if (typeof ${fn} === 'function') {
    targetFn = ${fn};
  } else if (typeof Solution === 'function' && typeof (new Solution())['${fn}'] === 'function') {
    const sol = new Solution();
    targetFn = sol['${fn}'].bind(sol);
  } else if (typeof Solution === 'object' && typeof Solution['${fn}'] === 'function') {
    targetFn = Solution['${fn}'].bind(Solution);
  }

  if (!targetFn) {
    console.error('Error: Could not find function "${fn}" or Solution.${fn}() in solution code.');
    process.exit(1);
  }

  const args = parseInput(rawInput);
  try {
    const result = targetFn(...args);
    if (result === undefined) {
      // Function executed with no return
    } else if (typeof result === 'boolean') {
      process.stdout.write(result ? 'true' : 'false');
    } else if (typeof result === 'object' && result !== null) {
      process.stdout.write(JSON.stringify(result));
    } else {
      process.stdout.write(String(result));
    }
  } catch (err) {
    console.error(err && err.stack ? err.stack : String(err));
    process.exit(1);
  }
})();
`;
}

/**
 * Wraps user function in Python.
 */
function wrapPythonHarness(code, functionName) {
  const fn = functionName.trim();
  return `
import sys
import json

${code}

# ── TrainX Unified LeetCode Harness (Python) ──
def __trainx_run_harness():
    raw_input_data = sys.stdin.read().strip()

    def parse_input(raw):
        if not raw:
            return []
        try:
            val = json.loads(raw)
            if isinstance(val, list):
                return val
            return [val]
        except Exception:
            lines = [l.strip() for l in raw.splitlines() if l.strip()]
            if len(lines) > 1:
                parsed_lines = []
                for line in lines:
                    try:
                        parsed_lines.append(json.loads(line))
                    except Exception:
                        parsed_lines.append(line)
                return parsed_lines
            return [raw]

    target_fn = None
    if '${fn}' in globals() and callable(globals()['${fn}']):
        target_fn = globals()['${fn}']
    elif 'Solution' in globals():
        sol = Solution()
        if hasattr(sol, '${fn}') and callable(getattr(sol, '${fn}')):
            target_fn = getattr(sol, '${fn}')

    if not target_fn:
        sys.stderr.write('Error: Could not find function "${fn}" or Solution.${fn}() in solution code.\\n')
        sys.exit(1)

    args = parse_input(raw_input_data)
    try:
        result = target_fn(*args)
        if result is None:
            pass
        elif isinstance(result, bool):
            sys.stdout.write("true" if result else "false")
        elif isinstance(result, (list, dict, tuple)):
            sys.stdout.write(json.dumps(result, separators=(', ', ': ')))
        else:
            sys.stdout.write(str(result))
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    __trainx_run_harness()
`;
}

/**
 * Wraps user function in Java.
 */
function wrapJavaHarness(code, functionName) {
  const fn = functionName.trim();
  // Ensure class Solution is not public so it compiles cleanly alongside public class Main in Main.java
  const cleanCode = code.replace(/\bpublic\s+class\s+Solution\b/g, 'class Solution');

  return `
import java.io.*;
import java.util.*;
import java.lang.reflect.*;

${cleanCode}

public class Main {
    public static void main(String[] args) {
        try {
            BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\\n");
            }
            String rawInput = sb.toString().trim();

            Class<?> solClass = Class.forName("Solution");
            Constructor<?> ctor = solClass.getDeclaredConstructor();
            ctor.setAccessible(true);
            Object solInstance = ctor.newInstance();

            Method targetMethod = null;
            for (Method m : solClass.getDeclaredMethods()) {
                if (m.getName().equals("${fn}")) {
                    targetMethod = m;
                    break;
                }
            }

            if (targetMethod == null) {
                System.err.println("Error: Could not find method ${fn} in class Solution.");
                System.exit(1);
            }
            targetMethod.setAccessible(true);

            Class<?>[] paramTypes = targetMethod.getParameterTypes();
            Object[] invokeArgs = new Object[paramTypes.length];

            String[] inputLines = rawInput.split("\\\\r?\\\\n");
            String[] inputTokens = rawInput.trim().split("\\\\s+");

            for (int i = 0; i < paramTypes.length; i++) {
                String valStr = "";
                if (inputLines.length >= paramTypes.length) {
                    valStr = inputLines[i].trim();
                } else if (inputTokens.length >= paramTypes.length) {
                    valStr = inputTokens[i].trim();
                } else if (i < inputLines.length) {
                    valStr = inputLines[i].trim();
                } else {
                    valStr = rawInput.trim();
                }

                Class<?> pt = paramTypes[i];
                if (pt == int.class || pt == Integer.class) {
                    String digits = valStr.replaceAll("[^0-9-]", "").trim();
                    invokeArgs[i] = digits.isEmpty() ? 0 : Integer.parseInt(digits);
                } else if (pt == long.class || pt == Long.class) {
                    String digits = valStr.replaceAll("[^0-9-]", "").trim();
                    invokeArgs[i] = digits.isEmpty() ? 0L : Long.parseLong(digits);
                } else if (pt == double.class || pt == Double.class) {
                    String digits = valStr.replaceAll("[^0-9.-]", "").trim();
                    invokeArgs[i] = digits.isEmpty() ? 0.0 : Double.parseDouble(digits);
                } else if (pt == boolean.class || pt == Boolean.class) {
                    invokeArgs[i] = Boolean.parseBoolean(valStr.trim());
                } else if (pt == String.class) {
                    invokeArgs[i] = valStr.replaceAll("^\\\"|\\\"$", "");
                } else if (pt == int[].class) {
                    String clean = valStr.replace("[", "").replace("]", "").trim();
                    if (clean.isEmpty()) {
                        invokeArgs[i] = new int[0];
                    } else {
                        String[] parts = clean.split("[,\\\\s]+");
                        int[] arr = new int[parts.length];
                        for (int k = 0; k < parts.length; k++) {
                            String pDigits = parts[k].replaceAll("[^0-9-]", "").trim();
                            arr[k] = pDigits.isEmpty() ? 0 : Integer.parseInt(pDigits);
                        }
                        invokeArgs[i] = arr;
                    }
                } else if (pt == String[].class) {
                    String clean = valStr.replace("[", "").replace("]", "").trim();
                    if (clean.isEmpty()) {
                        invokeArgs[i] = new String[0];
                    } else {
                        String[] parts = clean.split("[,\\\\s]+");
                        for (int k = 0; k < parts.length; k++) {
                            parts[k] = parts[k].replaceAll("^\\\"|\\\"$", "").trim();
                        }
                        invokeArgs[i] = parts;
                    }
                } else {
                    invokeArgs[i] = valStr;
                }
            }

            Object result = targetMethod.invoke(solInstance, invokeArgs);
            if (result == null) {
                // void
            } else if (result instanceof int[]) {
                int[] arr = (int[]) result;
                StringBuilder out = new StringBuilder("[");
                for (int k = 0; k < arr.length; k++) {
                    out.append(arr[k]);
                    if (k < arr.length - 1) out.append(", ");
                }
                out.append("]");
                System.out.print(out.toString());
            } else if (result instanceof Object[]) {
                System.out.print(Arrays.toString((Object[]) result));
            } else {
                System.out.print(result.toString());
            }
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }
}
`;
}

/**
 * Wraps user function in C++.
 */
function wrapCppHarness(code, functionName) {
  const fn = functionName.trim();
  return `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
using namespace std;

${code}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    string raw;
    string line;
    while (getline(cin, line)) {
        if (!raw.empty()) raw += "\\n";
        raw += line;
    }

    Solution sol;
    // Basic single string / line dispatcher
    auto res = sol.${fn}(raw);
    cout << res;
    return 0;
}
`;
}

/**
 * Main wrapper function to generate executable code.
 */
export function wrapCodeWithHarness({ language, code, functionName }) {
  if (!shouldWrapFunction(language, code, functionName)) {
    return code;
  }

  const l = String(language || '').toLowerCase().trim();
  if (l.includes('node') || l.includes('js') || l.includes('script') || l.includes('ts')) {
    return wrapNodeHarness(code, functionName);
  }
  if (l.includes('py')) {
    return wrapPythonHarness(code, functionName);
  }
  if (l.includes('java')) {
    return wrapJavaHarness(code, functionName);
  }
  if (l === 'c' || l.includes('cpp') || l.includes('c++')) {
    return wrapCppHarness(code, functionName);
  }

  return code;
}


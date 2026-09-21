#!/bin/sh
# Secure in-container code runner.
#
# Contract with the Node.js backend:
#   * LANGUAGE and EXEC_TIMEOUT are supplied as environment variables.
#   * The working directory `/workspace` is a read/write bind mount created by
#     the host (a per-request mkdtemp). It must contain the source file and an
#     `input.txt` file used as stdin.
#   * Results are written as plain files into `/workspace`:
#       compile_code    -> 0 if compilation (or syntax check) succeeded, else 1
#       compile_error.txt
#       run_code        -> exit code of the executed program
#       run_stdout.txt
#       run_stderr.txt
#       timed_out       -> "1" if the program exceeded the execution timeout
#   * The container itself always exits 0; the backend reads the result files.
#
# No user-supplied strings are ever used as shell arguments. The language is
# allow-listed by the backend and matched against the case stints below.
set -u

LANG_RAW="${LANGUAGE:-}"
TIMEOUT_S="${EXEC_TIMEOUT:-5}"

if ! cd /workspace 2>/dev/null; then
  echo "cannot access /workspace" >&2
  exit 2
fi

: > compile_error.txt
: > run_stdout.txt
: > run_stderr.txt
echo 0 > compile_code
echo 0 > run_code
echo 0 > timed_out

# Run the compiled/interpreted program under the coreutils timeout.
# stdin is redirected from input.txt; stdout/err captured to files.
run_program() {
  timeout -s TERM -k 2 "$TIMEOUT_S" "$@" < input.txt > run_stdout.txt 2> run_stderr.txt
  rc=$?
  if [ "$rc" -eq 124 ] || [ "$rc" -eq 137 ]; then
    echo 1 > timed_out
    rc=124
  fi
  echo "$rc" > run_code
}

case "$LANG_RAW" in
  c)
    gcc -O2 -std=c11 main.c -o main 2> compile_error.txt
    cc=$?
    echo "$cc" > compile_code
    [ "$cc" -ne 0 ] && exit 0
    run_program ./main
    ;;
  cpp)
    g++ -O2 -std=c++17 main.cpp -o main 2> compile_error.txt
    cc=$?
    echo "$cc" > compile_code
    [ "$cc" -ne 0 ] && exit 0
    run_program ./main
    ;;
  java)
    if [ -f Main.java ]; then
      JSRC=Main.java
    elif [ -f Solution.java ]; then
      JSRC=Solution.java
    else
      echo "No Main.java or Solution.java found in workspace (detected class name mismatch)" > compile_error.txt
      echo 1 > compile_code
      exit 0
    fi
    javac -encoding UTF-8 -J-Xss64m -J-Djava.io.tmpdir=/workspace "$JSRC" 2> compile_error.txt
    cc=$?
    echo "$cc" > compile_code
    [ "$cc" -ne 0 ] && exit 0
    CLASS="${JSRC%.java}"
    run_program java -Xss64m -Xmx192m -Djava.io.tmpdir=/workspace "$CLASS"
    ;;
  python)
    python3 -m py_compile main.py 2> compile_error.txt
    cc=$?
    echo "$cc" > compile_code
    [ "$cc" -ne 0 ] && exit 0
    run_program python3 main.py
    ;;
  node)
    node --check main.js 2> compile_error.txt
    cc=$?
    echo "$cc" > compile_code
    [ "$cc" -ne 0 ] && exit 0
    run_program node main.js
    ;;
  *)
    echo "Unsupported language: $LANG_RAW" > compile_error.txt
    echo 1 > compile_code
    ;;
esac

exit 0
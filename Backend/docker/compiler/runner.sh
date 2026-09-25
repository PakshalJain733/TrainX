#!/bin/sh
# Secure in-container code runner — TrainX
#
# Contract with the Node.js backend:
#   * LANGUAGE and EXEC_TIMEOUT are supplied as environment variables.
#   * The working directory `/workspace` is a read/write bind-mount.
#     It must contain the source file and an `input.txt` for stdin.
#   * Results are written as plain files back into `/workspace`:
#       compile_code      -> "0" = OK, "1" = compilation failure
#       compile_error.txt -> compiler stderr
#       run_code          -> exit code of the program (or 124 for TLE)
#       run_stdout.txt    -> program stdout
#       run_stderr.txt    -> program stderr (runtime errors, stack traces, etc.)
#       timed_out         -> "1" if the program exceeded EXEC_TIMEOUT
#   * The container itself ALWAYS exits 0 so docker CLI never reports an error
#     for user-side failures. The backend reads the result files exclusively.
#
# Security:
#   - No user-supplied strings are ever used as shell arguments.
#   - Language is allow-listed by the backend and matched in the case stmt.
#   - stdin comes from input.txt (never an arg or env var).
set -u

LANG_RAW="${LANGUAGE:-}"
TIMEOUT_S="${EXEC_TIMEOUT:-5}"

# Ensure /workspace is accessible
if ! cd /workspace 2>/dev/null; then
  echo "cannot access /workspace" >&2
  exit 2
fi

# Initialise all result files to safe defaults
: > compile_error.txt
: > run_stdout.txt
: > run_stderr.txt
printf '%s' "0" > compile_code
printf '%s' "0" > run_code
printf '%s' "0" > timed_out

# ──────────────────────────────────────────────────────────────────
# run_program <cmd> [args...]
#   Runs the program under `timeout`, redirecting stdin from
#   input.txt. Stdout and stderr are captured to separate files.
#   Exit code is stored in run_code. TLE is flagged in timed_out.
# ──────────────────────────────────────────────────────────────────
run_program() {
  timeout -s TERM -k 2 "$TIMEOUT_S" "$@" \
    < input.txt \
    > run_stdout.txt \
    2> run_stderr.txt
  rc=$?
  # timeout(1) returns 124 on SIGTERM, 137 on SIGKILL (-k 2)
  if [ "$rc" -eq 124 ] || [ "$rc" -eq 137 ]; then
    printf '%s' "1" > timed_out
    rc=124
  fi
  # Store raw exit code so the backend can distinguish runtime errors
  # (non-zero, non-124) from successful runs (0).
  printf '%s' "$rc" > run_code
}

case "$LANG_RAW" in
  c)
    gcc -O2 -std=c11 -Wall main.c -o main 2> compile_error.txt
    cc=$?
    printf '%s' "$cc" > compile_code
    [ "$cc" -ne 0 ] && exit 0
    run_program ./main
    ;;

  cpp)
    g++ -O2 -std=c++17 -Wall main.cpp -o main 2> compile_error.txt
    cc=$?
    printf '%s' "$cc" > compile_code
    [ "$cc" -ne 0 ] && exit 0
    run_program ./main
    ;;

  java)
    # Source file is written by the backend as <ClassName>.java
    JSRC=""
    for f in *.java; do
      [ -f "$f" ] && JSRC="$f" && break
    done
    if [ -z "$JSRC" ]; then
      printf '%s\n' "No .java source file found in workspace" > compile_error.txt
      printf '%s' "1" > compile_code
      exit 0
    fi
    javac -encoding UTF-8 \
          -J-Xss64m \
          -J-Djava.io.tmpdir=/workspace \
          "$JSRC" 2> compile_error.txt
    cc=$?
    printf '%s' "$cc" > compile_code
    [ "$cc" -ne 0 ] && exit 0
    CLASS="${JSRC%.java}"
    run_program java \
      -Xss64m \
      -Xmx192m \
      -Djava.io.tmpdir=/workspace \
      "$CLASS"
    ;;

  python)
    # Syntax check first — fast fail
    python3 -m py_compile main.py 2> compile_error.txt
    cc=$?
    printf '%s' "$cc" > compile_code
    [ "$cc" -ne 0 ] && exit 0
    run_program python3 -u main.py
    ;;

  node)
    # Syntax / parse check — fast fail
    node --check main.js 2> compile_error.txt
    cc=$?
    printf '%s' "$cc" > compile_code
    [ "$cc" -ne 0 ] && exit 0
    run_program node main.js
    ;;

  *)
    printf '%s\n' "Unsupported language: $LANG_RAW" > compile_error.txt
    printf '%s' "1" > compile_code
    ;;
esac

# Container always exits 0 — errors are communicated through result files.
exit 0
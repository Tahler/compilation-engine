# API

This document details the proper format for requests and what the caller should expect in terms of
response.

## Requests

Requests should be sent to this API as an 'application/json' post with the following properties:
- "lang": A string specifying the language code of the source code. A full list can be found in
  the properties of compilers.js.
- "src": A string containing all of the source code.
- "tests": The inputs and outputs to test against the program.
- "timeout": The number of seconds each test has to run (program runtime).

### Test Object

Each test object in the `tests` array must have an `input` property and an `output` property.
Optionally, a `hint` property may be included.

Examples:

```json
{
  "input": "0",
  "output": "2"
}
```

```json
{
  "input" : "",
  "output" : "Hello, NU Code!",
  "hint" : "Double check for any spelling errors and note the casing. The string should read \"Hello, NU Code!\" exactly."
}
```

### Full Request Example

JSON example:

```json
{
 "lang": "java",
 "src": "import java.util.Scanner;\npublic class Solution {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    int x = scanner.nextInt();\n    int y = x * 2;\n    System.out.println(y);\n  }\n}\n",
 "tests": [
    {
      "hint" : "0 * 2 = 0",
      "input" : "0",
      "output" : "0"
    },
    {
      "input" : "2",
      "output" : "4"
    },
    {
      "input" : "1024",
      "output" : "2048"
    },
    {
      "input" : "-4",
      "output" : "-8"
    }
  ],
  "timeout": 3
}
```

JSON above sent via cURL:

`curl -d '{ "lang": "java", "src": "import java.util.Scanner;\npublic class Solution {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    int x = scanner.nextInt();\n    int y = x * 2;\n    System.out.println(y);\n  }\n}\n", "tests": [ { "hint": "0 * 2 = 0", "input": "0", "output": "0" }, { "input": "2", "output": "4" }, { "input": "1024", "output": "2048" }, { "input": "-4", "output": "-8" } ],  "timeout": 3 }' -H "Content-Type: application/json" http://code.neumont.edu/api`

## Responses

Responses are sent as JSON.

If the request was _incorrectly_ formatted, the JSON response will contain a single "error"
property.

```json
{
  "error": "Requests must be sent as JSON containing the following properties: \"lang\", \"src\", \"timeout\", and \"tests\"."
}
```

If the request was _correctly_ formatted, then the JSON response will contain the results.

### "Pass" Response

If all tests pass, the response will contain a `status` property equaling `"Pass"` and an `execTime`
property with the total runtime in milliseconds.

Example:

```json
{
  "status": "Pass",
  "execTime": 0.192401
}
```

### "Fail" Response

If one or more tests fail, the response will contain a `status` property equaling `"Fail"`. If any
of the failing tests contained a `hint` property, then that hint will be included in the `hints`
property, an array of strings.

Example:

```json
{
  "status": "Fail"
}
```

Example with hints:

```json
{
  "status": "Fail",
  "hints": [
    "Account for dividing by 0."
  ]
}
```

### "Timeout" Response

If the program's runtime for a test exceeds the request's specified `timeout`, the response will
contain a `status` property equaling `"Timeout"`.

Example:

```json
{
  "status": "Timeout"
}
```

### "Compilation Error" Response

If the request's `lang` property corresponds to a compiled language, and the source code does not
compile, then the response will contain a `status` property equaling `"CompilationError"` and a
`message` property with the string message of the compiler's error output.

- Example:

```json
{
  "status": "CompilationError",
  "message": "solution.c: In function 'main':\nsolution.c:2:31: error: expected ';' before '}' token\n int main() { printf(\"233168\") }\n                               ^\n"
}
```

### "Runtime Error" Response

If the program runs into a runtime error during any of the tests, then the response will contain a
`status` property equaling `"RuntimeError"` and a `message` property with the stderr output of the
program.

- Example:

```json
{
  "status": "RuntimeError",
  "message": "Exception in thread \"main\" java.lang.RuntimeException\n	at Solution.main(Solution.java:3)"
}
```

# Code Review Rules Source Note

Review checklist note for a fictional open-source repository.

Reviewers lead with correctness, security, public-claim accuracy, and missing tests. Style comments are secondary unless the style problem makes the product harder to understand.

| Review area | Example question |
| --- | --- |
| behavior | Does this change match the documented contract? |
| safety | Could this expose private data or imply execution? |
| evidence | Did the author run the relevant verifier? |

This note is meant to shape review comments, not to authorize automated changes.

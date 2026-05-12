# Import Boundaries Source Note

Import boundary note for fictional vault-to-pack work.

The importer should preserve source context but avoid treating every note as trusted. Attachments, private folders, daily notes, and unresolved inbox items remain review candidates until a human promotes them.

| Source area | Import posture |
| --- | --- |
| reviewed project notes | candidate record |
| inbox | draft candidate |
| attachments | metadata only unless reviewed |
| private folders | excluded |

This source models a safe import policy without using real private files.

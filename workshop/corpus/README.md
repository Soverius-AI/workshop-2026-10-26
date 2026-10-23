# Training corpus
Six fictional company documents are included. Their contact details, thresholds and procedures exist only for the exercise. The date in them is the fixed training date, not today's date.

The two Danfoss manuals are listed in sources.json with original manufacturer URLs. Download them to the ignored `workshop/downloads/` directory before class. Compare the PDF with extraction output. Start with Optyma PDF page 6. Do not assume that a manual's feature exists in the simulated factory.

The local JSON index is an inspectable teaching artifact. Every participant can read these fictional files. A CLI role filter demonstrates retrieval policy but is NOT an authentication boundary. Do not put real restricted company documents in this exercise distribution.

The Docker Explorer uses prepared text for all six company documents plus selected excerpts from both manuals (`apps/explorer/data/prepared-corpus.json`). Participants start at chunking. Its separate protected keyword demonstration uses server login and PostgreSQL row policies; the older CLI role fixture is not the new authentication implementation. Original PDF files are optional for running the prepared-text exercises but useful for source inspection.

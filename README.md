## Signature Verification Data Collection Tool

For COMP3314 Machine Learning course, HKU



###Local Setup

- Create a folder `secret/` containing following files:
  + `pass`: passphrase to encrypt sensitive data,
  + `sheetId`: the file id of the published Google Spreadsheet,
  + `formId`: the file id of the Google Form to receive submission,
  + `urlprefix`: the static site url with scheduled runners (e.g., GitLab pages)
  + `info.csv`: member information (e.g., student names/ID, scores, etc.)
- Modify `build.js` to encrypt your secret files (e.g., be compatible with the structure of your `info.csv`).
- Run `make` to build the stand-alone `index.html`. Then you can open it as a file or serve it on a server.



### Remote Setup

How to configure the triggered Spreadsheet, and the scheduled runner.

(will be published after the data collection for the course are fulfilled)



### Dependencies

+ Python >= 3.6
+ Node, pug, http-server, crypto-js
+ … (to be updated)
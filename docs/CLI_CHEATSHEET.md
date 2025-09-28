# MARKET — CLI Cheat Sheet

Fast commands you’ll actually use. Copy–paste, ship faster.

---

## Basics
```bash
pwd                 # where am I?
ls -la              # list files (incl. hidden)
cd ..               # up one level
mkdir new-folder    # make folder
touch notes.txt     # create file
rm file.txt         # delete file (careful)
rm -r old_folder    # delete folder recursively

View / search files
cat file.txt                     # show file contents
head -n 20 file.txt              # first 20 lines
tail -f app.log                  # stream new log lines live
grep -nR "presign" app/          # find text in repo
find app -maxdepth 3 -type f     # list files under app/

Pipes (lego for commands)
ls -la | grep "\.ts$"            # list then filter .ts files
cat app/page.tsx | wc -l         # count lines in a file
ps aux | grep node               # which node processes are running?

Git (90% of your day)
git status
git add <path>                   # stage
git commit -m "message"          # commit
git push origin main             # push
git pull                         # pull
git log --oneline --graph        # pretty history
git diff                         # see changes
git checkout -b feat/s3          # new branch

Node / Next.js
npm install                      # install deps
npm run dev                      # start Next.js
npm run build                    # build

MARKET-specific one-liners
App structure quick peek
find app -maxdepth 3 -type f -print

Test presign API (Expect 200 with { url, key })
curl -s -i -X POST http://localhost:3000/api/s3/presign \
  -H 'content-type: application/json' \
  -d '{"filename":"test.png","contentType":"image/png"}'

Test preview API (Expect 200 with { url } or 400 "key required")
curl -s -i -X POST http://localhost:3000/api/s3/view-url \
  -H 'content-type: application/json' \
  -d '{"key":"uploads/example.png"}'

Check AWS envs are loaded (server side)
env | grep -E '^AWS_(ACCESS_KEY_ID|SECRET_ACCESS_KEY|REGION)='

Kill whatever is hogging port 3000 (macOS)
lsof -i :3000
kill -9 <PID>

Bucket cleanup (remove test files)
aws s3 rm s3://marketplace-images-irinel-uk-dev/test/ --recursive --region eu-west-2

Nano (friendly editor)
nano app/upload-test/UploadClient.tsx
# Ctrl+O save, Enter confirm, Ctrl+X exit

Aliases (paste into ~/.zshrc, then source ~/.zshrc)
alias gs='git status'
alias ga='git add'
alias gc='git commit -m'
alias gp='git push'
alias gl='git log --oneline --graph --decorate --all'
alias ll='ls -lah'
alias ports='lsof -i -P | grep LISTEN'

Mental model

Commands are verbs (ls, grep, git)

Flags are adverbs (-la, -nR, --oneline)

Pipes | chain commands like lego

Aliases = automate the boring stuff

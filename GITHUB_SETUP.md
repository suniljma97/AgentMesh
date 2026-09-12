# Git / GitHub Setup — Agentra

Is machine par **do accounts, do hosts** ek saath use hote hain:

| | Agentra (ye repo) | Work project |
|---|---|---|
| Host | GitHub | Bitbucket |
| Account | Personal (`dhakadsunil158@gmail.com`) | Work (`sunil.dhakad@pragmaapps.com`) |
| SSH key | `~/.ssh/id_ed25519_github` | `~/.ssh/id_ed25519` |

Dono kabhi mix nahi hone chahiye — is file me system setup, aur commit/push se pehle
ke checklists likhi hain taaki galti se kabhi wrong jagah push na ho, especially work
project par (wo already chal raha hai, usme kuch bhi accidental nahi jaana chahiye).

---

## 1. System-level setup (poore machine ke liye, ek baar)

### 1.1 SSH keys — har account ki apni alag key

```bash
# Personal GitHub ke liye (already ban chuki hai)
ssh-keygen -t ed25519 -C "dhakadsunil158@gmail.com" -f ~/.ssh/id_ed25519_github

# Work Bitbucket ke liye (existing key already isi kaam me hai)
# ~/.ssh/id_ed25519  ->  sunil.dhakad@pragmaapps.com
```

Public key check karne ke liye:
```bash
cat ~/.ssh/id_ed25519_github.pub    # GitHub account me add karni hai
cat ~/.ssh/id_ed25519.pub           # Bitbucket account me already hai (verify kar lo)
```

### 1.2 `~/.ssh/config` — kis host ke liye kaunsi key use ho

```
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_github
    IdentitiesOnly yes

Host bitbucket.org
    HostName bitbucket.org
    User git
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```

Test:
```bash
ssh -T git@github.com      # "Hi <username>! You've successfully authenticated" aana chahiye
ssh -T git@bitbucket.org   # similarly Bitbucket ke liye
```

### 1.3 GitHub par public key register karna

`cat ~/.ssh/id_ed25519_github.pub` ka output copy karke:
GitHub → **Settings → SSH and GPG keys → New SSH key** → paste → Save.

### 1.4 Global vs per-repo identity

Global git identity (saare repos ka default) abhi work email par set hai:
```bash
git config --global user.name    # Sunil Dhakad
git config --global user.email   # sunil.dhakad@pragmaapps.com
```
Isse **chhedna nahi** — work repo isi default se sahi chalta rahega.

Har naye **personal/GitHub repo** me (jaise Agentra) local override karna hai:
```bash
git config user.name  "Sunil Dhakad"
git config user.email "dhakadsunil158@gmail.com"
```
Ye sirf usi repo ke `.git/config` me save hota hai, global ko touch nahi karta.

> **Quick rule of thumb:** naya repo clone/init karte hi sabse pehla kaam —
> `git config user.email` chala kar dekho konsa email active hai, aur confirm karo
> ki wo us repo ke host (GitHub/Bitbucket) ke sahi account se match karta hai.

---

## 2. Agentra repo — is project ka setup (already done)

- Local identity: `dhakadsunil158@gmail.com` ✅
- SSH: `github.com` → `id_ed25519_github` ✅ (via `~/.ssh/config`)
- Safety hook: `.git/hooks/pre-push` ✅ (section 5 me detail)
- Remote: abhi tak add nahi hua — GitHub par repo banne ke baad:
  ```bash
  git remote add origin git@github.com:<your-username>/Agentra.git
  git remote -v
  ```
- Pehla commit + push (is repo me abhi tak koi commit nahi hai):
  ```bash
  git add .
  git commit -m "Initial commit"
  git push -u origin master
  ```

---

## 3. COMMIT karne se pehle — checklist

Ye har commit se pehle chalao, chahe repo koi bhi ho:

```bash
git status                 # kaunsi files staged/unstaged/untracked hain
git diff                   # unstaged changes line-by-line dekho
git diff --staged          # jo stage kiya hai wahi review karo commit se pehle
```

Check karo:
- [ ] Koi secret/credential/API key/`.env` file accidentally stage to nahi hui
      (Agentra ka `.gitignore` `.env`, `.env.local`, `node_modules/`, `dist/`, `*.db`
      already exclude karta hai — naya secret file ho to `.gitignore` me add karo pehle).
- [ ] Sirf wahi files staged hain jo is commit ka logical part hain (`git add .` se
      pehle `git status` zaroor dekho — anjaane me kisi aur kaam ki file mat le lo).
- [ ] Commit message clear hai (kya aur kyun badla, ek line me).
- [ ] Correct branch par ho (`git branch --show-current`) — seedha `master`/`main` par
      kaam nahi karna, feature branch use karo.

---

## 4. PUSH karne se pehle — checklist

```bash
git remote -v                              # sahi remote hai na? (Agentra -> github.com hi)
git config user.email                      # sahi identity hai na?
git log --oneline origin/master..HEAD      # exactly wahi commits jaa rahe hain jo chahiye
git diff --stat origin/master..HEAD        # kitni/kaunsi files change ho rahi hain, ek nazar
```

Check karo:
- [ ] `git remote -v` me sirf expected remote hai (Agentra me sirf `github.com`,
      work repo me sirf `bitbucket.org`) — dono kabhi ek repo me na ho.
- [ ] `git config user.email` us host ke sahi account se match karta hai.
- [ ] Sahi branch push ho raha hai (`git push origin <branch>` — bina branch naam ke
      `git push` chalane se pehle ek baar `git status` se current branch confirm karo).
- [ ] **Force push (`-f` / `--force-with-lease`) tab tak kabhi nahi**, jab tak 100%
      pakka na ho aur especially kabhi bhi shared/`main`/`master` branch par nahi.
- [ ] Work project par push karte time do extra second ruk kar sochna — production/live
      chal raha hai, wahan koi bhi galat push directly impact karta hai.

---

## 5. Automatic safety net — pre-push hook

Manual checklist bhoolne ka risk hamesha rehta hai, isliye Agentra me ek
`.git/hooks/pre-push` script hai jo push hone se PEHLE khud verify karta hai:

- Remote URL me `github.com` hona chahiye — Bitbucket/work remote par push try kiya
  to **turant block**.
- `git config user.email` `dhakadsunil158@gmail.com` hi hona chahiye, warna block.

Isi ka **mirror version** work/Bitbucket repo ke liye bana hua hai (`bitbucket.org`
allow, `github.com` block, work email check) — `/c/tmp/bitbucket-work-hook/pre-push`
me saved hai. Usko copy karke work repo ke `.git/hooks/pre-push` me daal do aur
executable banao:
```bash
cp /c/tmp/bitbucket-work-hook/pre-push /path/to/work-repo/.git/hooks/pre-push
chmod +x /path/to/work-repo/.git/hooks/pre-push
```

> Git hooks **local machine par hi rehte hain** — commit/clone se copy nahi hote.
> Naye machine par setup karte waqt in dono hooks ko dobara banana/copy karna hoga.

---

## 6. Roz ka workflow (day-to-day)

| Kaam | Command |
|---|---|
| Latest code lena | `git pull` |
| Naya feature branch | `git checkout -b feature/<name>` |
| Changes stage karna | `git add <files>` (`git add .` se pehle `git status` dekho) |
| Commit karna | `git commit -m "message"` (section 3 checklist ke baad) |
| Push karna | `git push` (section 4 checklist ke baad) |
| Feature branch push (pehli baar) | `git push -u origin feature/<name>` |
| PR ke baad cleanup | `git checkout master && git pull && git branch -d feature/<name>` |

Recommended flow: `master`/`main` par seedha kaam mat karo → feature branch banao →
push → GitHub par Pull Request → review/merge → local `master` sync → branch delete.

---

## 7. Troubleshooting

- **Push reject (non-fast-forward)** → `git pull --rebase`, phir `git push`.
- **Permission denied (publickey)** → `ssh -T git@github.com` (ya `bitbucket.org`)
  chala kar dekho sahi key pick ho rahi hai; `~/.ssh/config` ka block check karo.
- **Galat remote add ho gaya** → `git remote -v` se dekho, `git remote remove <name>`.
- **Hook ne push block kar diya** → error message padho, ya to remote galat hai ya
  email galat hai — vahi fix karo jo message me likha hai, hook ko bypass mat karo.
- **Bade/binary/secret files commit ho gaye** → `.gitignore` me add karo; agar already
  commit ho chuke hain to `git rm --cached <file>` karke dobara commit karo. Agar
  secret already push ho chuka hai, use turant rotate/revoke bhi karo (sirf history se
  hataana kaafi nahi hai).
- **Dono remotes (github + bitbucket) ek hi repo me dikh rahe hain** → turant samjho
  kuch galat add ho gaya, jo extra hai use `git remote remove <name>` se hata do.

---

## 8. Remote map (reference)

```
Agentra (ye repo)   ->  origin  ->  GitHub     (personal account)
Work project        ->  origin  ->  Bitbucket  (work account)
```

Agentra me Bitbucket remote kabhi add nahi karna; work repo me GitHub remote kabhi
add nahi karna. Pre-push hooks (section 5) isi rule ko automatically enforce karte hain.

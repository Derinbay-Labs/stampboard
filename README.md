# Stampboard

A one-page live view of your GitHub work: running and queued Actions jobs at the top, and every open
pull request and issue across your accounts and organisations below. It is built for a desktop
monitor (1920×1080) and you can leave it open all day.

![Stampboard, light theme](docs/screenshot-light.png)

![Stampboard, dark theme](docs/screenshot-dark.png)

*The screenshots show the built-in demo data.*

- **Actions board:** running and queued jobs, which runner they are on (self-hosted or GitHub-hosted), and live timers. Filter by runner or repository, and hide stuck runs (queued for over an hour with no jobs). Updates every 10 seconds.
- **Pull requests:** CI state and review state, with a stamp on the rows that need you (CI broken, changes requested, ready to merge). Updates every minute.
- **Issues:** labels, assignees and comment counts, with a stamp for the labels you choose (`security` by default).
- **Agents:** the [Claude Code](https://claude.com/claude-code) sessions running on this machine, and on other machines you list, with each session's active subagents. Shown only when there are any. See [Agents](#agents).
- **Interface:** English or Turkish, picked from the browser language or the EN/TR switch. Light, dark or automatic theme.
- **Dependencies:** none. It is one Node file for the server and one HTML file for the page.

## Requirements

- [Node.js](https://nodejs.org) 26 or newer
- [GitHub CLI](https://cli.github.com) (`gh`), signed in

## Quick start

```sh
gh auth login
git clone https://github.com/derinbay/stampboard.git
cd stampboard
npm start
```

`npm start` opens <http://localhost:4747> in your browser. If you have no `config.json`, the panel
scans the repositories of the account `gh` is signed in as.

To try the panel without a GitHub account, run `npm run demo`. It serves made-up data.

## Run in the background

To start the panel at login with no terminal window:

```sh
npm run install-service     # register at login, start now and open the browser
npm run status              # login item, server state, log file
npm run stop                # stop it until the next login
npm run start-service       # start it again
npm run uninstall-service   # stop it and remove the login item
```

None of these need administrator rights.

| OS | Registration | Log |
|---|---|---|
| Windows | `stampboard.vbs` in the Startup folder | `%LOCALAPPDATA%\stampboard\server.log` |
| macOS | LaunchAgent `~/Library/LaunchAgents/com.derinbay.stampboard.plist` | `~/Library/Logs/stampboard/server.log` |
| Linux | systemd user unit `stampboard.service` | `~/.local/state/stampboard/server.log` |

Every login item points at this folder and at the Node binary you ran it with. If you move the
folder or change your Node install, run `npm run install-service` again.

The project was called GitHub Run Panel until November 2026. If you installed it under that name,
run `npm run install-service` once more: it removes the old login item and starts Stampboard.

## Configuration

Copy `config.example.json` to `config.json` and edit it. Git ignores `config.json`.

| Key | Default | Meaning |
|---|---|---|
| `owners` | `[]` | The organisations or users to scan. When empty, the panel scans the account `gh` is signed in as. |
| `excludeRepos` | `[]` | The `owner/name` repositories to skip. |
| `includeArchived` | `false` | Whether to scan archived repositories. |
| `intervalSeconds` | `10` | How often the Actions board refreshes. The minimum is 5. Pull requests and issues refresh every minute. |
| `port` | `4747` | The local port. |
| `sealLabels` | `["security"]` | The issue labels that get a stamp, most important first. |
| `agentHosts` | `[]` | Other machines whose Claude Code sessions to show, over ssh: `"build-box"` or `{ "name": "mac", "ssh": "me@mac.local" }`. See [Agents](#agents). |

The `OWNERS` (comma-separated) and `PORT` environment variables override the file.

The page's language follows the browser until you pick one with the EN/TR switch, which the browser remembers. `?lang=en` or `?lang=tr` in the URL overrides both.

## Agents

If you use Claude Code, the panel lists its running sessions: name, status (working or idle), the
folder, the agent role and the subagents that have not finished. It reads the small status files
Claude Code keeps under `~/.claude/sessions/` (or `CLAUDE_CONFIG_DIR`) and each subagent's
`.meta.json`. It never reads a transcript, a prompt or an environment, and session ids stay on the
server. These files are not a documented Claude Code interface, so a future version may change
them; the section then stays hidden.

To include another machine, add it to `agentHosts`. Every 30 seconds the server runs
`ssh -o BatchMode=yes <host> sh -s` and sends a short POSIX shell script that prints the same
files; the machine needs only `sh`, not Node. ssh must already sign in with a key, because the
panel never answers a password prompt. A machine that does not answer is shown as unreachable.

## Security

- The server listens on `127.0.0.1` only. It rejects any request whose `Host` header is not `localhost`, `127.0.0.1` or `[::1]` on its port, which blocks DNS-rebinding attacks.
- The server reads the GitHub token with `gh auth token` and keeps it to itself. The token never reaches the browser.
- The page loads nothing from third parties, sends a restrictive Content Security Policy and cannot be embedded in a frame.
- The panel only reads from GitHub. It never writes.
- The Agents section reads only Claude Code's session status files, and over ssh only to the machines in `agentHosts`.

## License

[MIT](LICENSE). Made by [Derinbay Labs](https://derinbay.com). The bundled fonts, Archivo and JetBrains Mono, are under the
[SIL Open Font License 1.1](fonts/OFL.txt).

---

## Türkçe

GitHub işlerinizi tek sayfada gösteren canlı bir pano. Üstte çalışan ve sırada bekleyen Actions
job'ları, altta tüm hesap ve organizasyonlarınızdaki açık pull request'ler ve issue'lar var.
Masaüstü monitörü (1920×1080) için tasarlandı ve gün boyu açık kalabilir. Tarayıcınız Türkçeyse
arayüz Türkçe açılır; sağ üstteki EN/TR düğmesiyle değiştirilebilir.

**Gerekenler:** Node.js 26 veya üstü ve oturum açılmış GitHub CLI (`gh auth login`).

```sh
git clone https://github.com/derinbay/stampboard.git
cd stampboard
npm start                   # http://localhost:4747 adresini açar
npm run demo                # GitHub hesabı olmadan örnek verilerle dener
```

**Arka planda çalıştırma:** `npm run install-service` komutu paneli girişte terminal penceresi
açmadan başlatacak şekilde kaydeder. Windows'ta Başlangıç klasörünü, macOS'ta bir LaunchAgent'ı,
Linux'ta bir systemd kullanıcı birimini kullanır ve yönetici izni istemez. Diğer komutlar
`npm run status`, `npm run stop`, `npm run start-service` ve `npm run uninstall-service`'dir.
Günlük dosyasının yeri yukarıdaki tabloda. Eski adı (GitHub Run Panel) ile kurduysanız
`npm run install-service` komutunu bir kez daha çalıştırın; eski kaydı kaldırır.

**Ayarlar:** `config.example.json` dosyasını `config.json` olarak kopyalayın. `owners` boş
kalırsa `gh` ile oturum açtığınız hesap taranır. Diğer anahtarlar yukarıdaki tabloda.

**Ajanlar:** Claude Code kullanıyorsanız panel çalışan oturumları ve bitmemiş alt ajanlarını
listeler. Yalnızca `~/.claude/sessions/` altındaki durum dosyalarını ve alt ajanların
`.meta.json` dosyalarını okur; transcript, prompt ya da ortam değişkeni okumaz. Başka bir makineyi
eklemek için `agentHosts` listesine yazın (`"build-box"` ya da
`{ "name": "mac", "ssh": "ben@mac.local" }`). Sunucu 30 saniyede bir anahtarla ssh bağlantısı
kurar ve küçük bir POSIX shell betiği çalıştırır; karşı makinede Node gerekmez. Yanıt vermeyen
makine "ulaşılamıyor" olarak gösterilir.

**Güvenlik:** Sunucu yalnızca `127.0.0.1` üzerinde dinler ve yabancı `Host` başlıklarını
reddeder. GitHub token'ı sunucuda kalır, tarayıcıya hiç gitmez. Panel GitHub'a hiçbir şey yazmaz.
